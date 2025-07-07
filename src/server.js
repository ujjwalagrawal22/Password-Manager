// --- src/server.js (Corrected Version) ---

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { deriveKey, encrypt, decrypt } = require('./backend/cryptoService');
const { loadData, saveData } = require('./database/dataStore');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = 3000;

// --- Constants & Config ---
const MASTER_PASSWORD_SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const AUTHENTICATION_CHECK_STRING = "master_password_verification_check";
const JWT_SECRET = 'your-super-secret-and-long-jwt-secret-key';
const JWT_EXPIRATION = '1h';

// KDF Configuration with CORRECT property names for Node.js crypto
const KDF_PARAMS = {
    // N = cost, r = blockSize, p = parallelization
    cost: 2**15,          // This is N
    blockSize: 8,         // This is r
    parallelization: 1,   // This is p
    maxmem: 32 * 1024 * 1024 // Optional: Good practice to set a memory limit
};

app.use(express.json());

// --- Public Routes (No Auth Needed) ---
app.post('/api/setup', async (req, res) => {
    try {
        const { masterPassword } = req.body;
        if (!masterPassword || masterPassword.length < 8) return res.status(400).json({ error: 'Master password must be at least 8 characters long.' });
        
        let storedData = await loadData();
        if (storedData.some(entry => entry.type === 'metadata')) return res.status(409).json({ error: 'Application has already been set up.' });
        
        const masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
        
        // Now passing the correctly named KDF_PARAMS
        const derivedKey = await deriveKey(masterPassword, masterSalt, KEY_LENGTH, KDF_PARAMS);
        const authTag = encrypt(AUTHENTICATION_CHECK_STRING, derivedKey);

        const newMetadata = {
            type: "metadata",
            salt: masterSalt,
            kdfParams: KDF_PARAMS, // Store the KDF config with correct keys
            authTagData: authTag.encryptedData,
            authTagIv: authTag.iv
        };

        storedData.push(newMetadata);
        await saveData(storedData);
        res.status(201).json({ message: 'Setup successful.' });

    } catch (error) {
        console.error('Error during setup:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { masterPassword } = req.body;
        if (!masterPassword) return res.status(400).json({ error: 'Master password is required.' });

        const storedData = await loadData();
        const metadata = storedData.find(entry => entry.type === 'metadata');
        if (!metadata) return res.status(404).json({ error: 'Application not set up.' });
        
        let derivedKey;
        try {
            // Reconstruct the options object, reading the correct property names
            const scryptOptions = {
                cost: metadata.kdfParams.cost,
                blockSize: metadata.kdfParams.blockSize,
                parallelization: metadata.kdfParams.parallelization,
                maxmem: metadata.kdfParams.maxmem
            };

            derivedKey = await deriveKey(masterPassword, metadata.salt, KEY_LENGTH, scryptOptions);
            const decryptedCheck = decrypt(metadata.authTagData, metadata.authTagIv, derivedKey);
            if (decryptedCheck !== AUTHENTICATION_CHECK_STRING) return res.status(401).json({ error: 'Invalid master password.' });
        
        } catch (error) {
            console.error("Login crypto error:", error);
            return res.status(401).json({ error: 'Invalid master password.' });
        }

        const payload = { sub: 'user-id' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        
        res.json({ message: 'Login successful!', token });
        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
//---Protected Routes (Auth Needed)---

// ... the rest of the file (test-protected route) is the same ...
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
        // We expect the client to send us the *already encrypted* data.
        // This aligns with Zero Knowledge principles. The server never sees the raw password.
        const { encryptedData, iv } = req.body;

        if (!encryptedData || !iv) {
            return res.status(400).json({ error: 'Encrypted data and IV are required.' });
        }

        const storedData = await loadData();

        // Create a unique ID for this password entry for easy reference later (e.g., for deleting/editing)
        const newEntry = {
            id: crypto.randomBytes(16).toString('hex'), // A simple unique ID
            type: 'password_entry',
            data: encryptedData,
            iv: iv,
            createdAt: new Date().toISOString()
        };

        // Add the new entry to the data array
        // We need to make sure we don't just push it, but insert it before the metadata
        const metadataIndex = storedData.findIndex(entry => entry.type === 'metadata');
        if (metadataIndex > -1) {
            storedData.splice(metadataIndex, 0, newEntry);
        } else {
            // This case should not happen in a properly set up vault, but it's a safe fallback.
            storedData.push(newEntry);
        }

        await saveData(storedData);

        res.status(201).json({ message: 'Password entry added successfully.', entry: newEntry });

    } catch (error) {
        console.error('Error adding password entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => console.log(`Password Manager server listening on http://localhost:${PORT}`));