const cors = require('cors');
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { deriveKey, encrypt, decrypt } = require('./services/cryptoService');
require('./database/mongo'); //Ensures mongodb Connection
const authMiddleware = require('./middleware/authMiddleware');
const User = require('./database/User');
require('dotenv').config(); 

const app = express();
//env create
const PORT = process.env.PORT || 3001;

// --- Constants & Config ---
const MASTER_PASSWORD_SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const AUTHENTICATION_CHECK_STRING = "master_password_verification_check";
//env create
const JWT_SECRET = process.env.JWT_SECRET; 
//env create
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

// KDF Configuration with CORRECT property names for Node.js crypto
const KDF_PARAMS = {
    // N = cost, r = blockSize, p = parallelization
    cost: 2**15,          // This is N
    blockSize: 8,         // This is r
    parallelization: 1,   // This is p
    maxmem: 32 * 1024 * 1024 // Optional: Good practice to set a memory limit
};

//env create -CORS_ORIgIN
app.use(express.json());
// app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(cors({
    origin: 'http://34.29.53.106',  // frontend URL (without port 3001)
    methods: ['GET','POST','PUT','DELETE'],
    credentials: true
  }));
  

// --- Public Routes (No Auth Needed) ---

app.post('/api/setup',
     async (req, res) => {
    try {
        const { email, masterPassword } = req.body;
        if (!email || !masterPassword || masterPassword.length < 8) {
            return res.status(400).json({ error: 'Email and master password (min 8 chars) are required.' });
        }

  
        if(await User.findOne({email})) {
            return res.status(409).json({ error: 'User already exists.' });
        }

        const masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
        const derivedKey = await deriveKey(masterPassword, masterSalt, KEY_LENGTH, KDF_PARAMS);
        const authTag = encrypt(AUTHENTICATION_CHECK_STRING, derivedKey);

        const newUser = new User({
            email,
            salt: masterSalt,
            kdfParams: KDF_PARAMS,
            authTagData: authTag.encryptedData,
            authTagIv: authTag.iv,
            vault: []
        });

        //saving in mongodb using save() func
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Error during setup:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, masterPassword } = req.body;
        if (!email || !masterPassword) {
            return res.status(400).json({ error: 'Email and master password are required.' });
        }

        const user = await User.findOne({email});//storedData.find(u => u.email === email);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        let derivedKey;
        try {
            const scryptOptions = {
                cost: user.kdfParams.cost,
                blockSize: user.kdfParams.blockSize,
                parallelization: user.kdfParams.parallelization,
                maxmem: user.kdfParams.maxmem
            };

            derivedKey = await deriveKey(masterPassword, user.salt, KEY_LENGTH, scryptOptions);
            const decryptedCheck = decrypt(user.authTagData, user.authTagIv, derivedKey);
            if (decryptedCheck !== AUTHENTICATION_CHECK_STRING) {
                return res.status(401).json({ error: 'Invalid master password.' });
            }
        } catch (error) {
            return res.status(401).json({ error: 'Invalid master password.' });
        }

        const payload = { sub: user.email };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({ message: 'Login successful!', token, salt: user.salt, kdfParams: user.kdfParams });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/test-protected', authMiddleware, (req, res) => {
    res.json({ message: 'Success! You have accessed a protected route.', user: req.user });
});

/**
 * @route   POST /api/passwords
 * @desc    Adds a new encrypted password entry to the vault.
 * @access  Protected
 */

app.post('/api/passwords', authMiddleware, async (req, res) => {
    try {
        const { encryptedData, iv } = req.body;
        if (!encryptedData || !iv) {
            return res.status(400).json({ error: 'Encrypted data and IV are required.' });
        }
        
        //Saves to MongoDB
        const user = await User.findOne({email: req.user.sub});
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const newEntry = {
            data: encryptedData,
            iv: iv,
            createdAt: new Date(),
        };

        user.vault.push(newEntry);
        await user.save();

        res.status(201).json({ message: 'Password entry added successfully.', entry: newEntry });
    } catch (error) {
        console.error('Error adding password entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route   GET /api/passwords
 * @desc    Retrieves all encrypted password entries for the user.
 * @access  Protected
 */

// GET /api/passwords
app.get('/api/passwords', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({email: req.user.sub});
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json(user.vault || []);
    } catch (error) {
        console.error('Error retrieving password entries:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /api/passwords/:id
 * @desc    Deletes a specific password entry by its ID.
 * @access  Protected
 */

app.delete('/api/passwords/:id', authMiddleware, async (req, res) => {
    try {
        const entryIdToDelete = req.params.id;
        const user = await User.findOne({email: req.user.sub});//storedData.find(u => u.email === req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const entryIndex = user.vault.findIndex(entry => entry._id.toString() === entryIdToDelete);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Password entry not found.' });
        }

        user.vault.splice(entryIndex, 1);
        await user.save();

        res.json({ message: 'Password entry deleted successfully.', id: entryIdToDelete });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /api/passwords/:id
 * @desc    Updates an existing password entry with new encrypted data.
 * @access  Protected
 */

app.put('/api/passwords/:id', authMiddleware, async (req, res) => {
    try {
        const entryIdToUpdate = req.params.id;
        const { encryptedData, iv } = req.body;
        if (!encryptedData || !iv) {
            return res.status(400).json({ error: 'New encrypted data and IV are required.' });
        }

        const user = await User.findOne({email: req.user.sub});
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const entryToUpdate = user.vault.id(entryIdToUpdate);
        if (!entryToUpdate) {
            return res.status(404).json({ error: 'Password entry not found.' });
        }

        entryToUpdate.data = encryptedData;
        entryToUpdate.iv = iv;
        entryToUpdate.updatedAt = new Date();

        await user.save();

        res.json({ message: 'Password entry updated successfully.', entry: entryToUpdate });
    } catch (error) {
        console.error('Error updating password entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => console.log(`Password Manager server listening on http://localhost:${PORT}`));