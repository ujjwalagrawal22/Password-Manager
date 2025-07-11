// --- src/server.js (Corrected Version) ---
const cors = require('cors');
//app.use(cors());
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
app.use(cors({ origin: 'http://localhost:3001' }));

// --- Public Routes (No Auth Needed) ---
// app.post('/api/setup', async (req, res) => {
//     try {
//         const { masterPassword } = req.body;
//         if (!masterPassword || masterPassword.length < 8) return res.status(400).json({ error: 'Master password must be at least 8 characters long.' });
        
//         let storedData = await loadData();
//         if (storedData.some(entry => entry.type === 'metadata')) return res.status(409).json({ error: 'Application has already been set up.' });
        
//         const masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
        
//         // Now passing the correctly named KDF_PARAMS
//         const derivedKey = await deriveKey(masterPassword, masterSalt, KEY_LENGTH, KDF_PARAMS);
//         const authTag = encrypt(AUTHENTICATION_CHECK_STRING, derivedKey);

//         const newMetadata = {
//             type: "metadata",
//             salt: masterSalt,
//             kdfParams: KDF_PARAMS, // Store the KDF config with correct keys
//             authTagData: authTag.encryptedData,
//             authTagIv: authTag.iv
//         };

//         storedData.push(newMetadata);
//         await saveData(storedData);
//         res.status(201).json({ message: 'Setup successful.' });

//     } catch (error) {
//         console.error('Error during setup:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

app.post('/api/setup', async (req, res) => {
    try {
        const { email, masterPassword } = req.body;
        if (!email || !masterPassword || masterPassword.length < 8) {
            return res.status(400).json({ error: 'Email and master password (min 8 chars) are required.' });
        }

        let storedData = await loadData();
        if (storedData.some(user => user.email === email)) {
            return res.status(409).json({ error: 'User already exists.' });
        }

        const masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
        const derivedKey = await deriveKey(masterPassword, masterSalt, KEY_LENGTH, KDF_PARAMS);
        const authTag = encrypt(AUTHENTICATION_CHECK_STRING, derivedKey);

        const newUser = {
            email,
            salt: masterSalt,
            kdfParams: KDF_PARAMS,
            authTagData: authTag.encryptedData,
            authTagIv: authTag.iv,
            vault: []
        };

        storedData.push(newUser);
        await saveData(storedData);
        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Error during setup:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.post('/api/login', async (req, res) => {
//     try {
//         const { masterPassword } = req.body;
//         if (!masterPassword) return res.status(400).json({ error: 'Master password is required.' });

//         const storedData = await loadData();
//         const metadata = storedData.find(entry => entry.type === 'metadata');
//         if (!metadata) return res.status(404).json({ error: 'Application not set up.' });
        
//         let derivedKey;
//         try {
//             // Reconstruct the options object, reading the correct property names
//             const scryptOptions = {
//                 cost: metadata.kdfParams.cost,
//                 blockSize: metadata.kdfParams.blockSize,
//                 parallelization: metadata.kdfParams.parallelization,
//                 maxmem: metadata.kdfParams.maxmem
//             };

//             derivedKey = await deriveKey(masterPassword, metadata.salt, KEY_LENGTH, scryptOptions);
//             const decryptedCheck = decrypt(metadata.authTagData, metadata.authTagIv, derivedKey);
//             if (decryptedCheck !== AUTHENTICATION_CHECK_STRING) return res.status(401).json({ error: 'Invalid master password.' });
        
//         } catch (error) {
//             console.error("Login crypto error:", error);
//             return res.status(401).json({ error: 'Invalid master password.' });
//         }

//         const payload = { sub: 'user-id' };
//         const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        
//         res.json({ message: 'Login successful!', token });
        
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
//---Protected Routes (Auth Needed)---

// ... the rest of the file (test-protected route) is the same ...

app.post('/api/login', async (req, res) => {
    try {
        const { email, masterPassword } = req.body;
        if (!email || !masterPassword) {
            return res.status(400).json({ error: 'Email and master password are required.' });
        }

        const storedData = await loadData();
        const user = storedData.find(u => u.email === email);
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

        const storedData = await loadData();
        const user = storedData.find(u => u.email === req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const newEntry = {
            id: crypto.randomBytes(16).toString('hex'),
            data: encryptedData,
            iv: iv,
            createdAt: new Date().toISOString()
        };

        user.vault = user.vault || [];
        user.vault.push(newEntry);
        await saveData(storedData);

        res.status(201).json({ message: 'Password entry added successfully.', entry: newEntry });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// app.post('/api/passwords', authMiddleware, async (req, res) => {
//     try {
//         // We expect the client to send us the *already encrypted* data.
//         // This aligns with Zero Knowledge principles. The server never sees the raw password.
//         const { encryptedData, iv } = req.body;

//         if (!encryptedData || !iv) {
//             return res.status(400).json({ error: 'Encrypted data and IV are required.' });
//         }

//         const storedData = await loadData();

//         // Create a unique ID for this password entry for easy reference later (e.g., for deleting/editing)
//         const newEntry = {
//             id: crypto.randomBytes(16).toString('hex'), // A simple unique ID
//             type: 'password_entry',
//             data: encryptedData,
//             iv: iv,
//             createdAt: new Date().toISOString()
//         };

//         // Add the new entry to the data array
//         // We need to make sure we don't just push it, but insert it before the metadata
//         const metadataIndex = storedData.findIndex(entry => entry.type === 'metadata');
//         if (metadataIndex > -1) {
//             storedData.splice(metadataIndex, 0, newEntry);
//         } else {
//             // This case should not happen in a properly set up vault, but it's a safe fallback.
//             storedData.push(newEntry);
//         }

//         await saveData(storedData);

//         res.status(201).json({ message: 'Password entry added successfully.', entry: newEntry });

//     } catch (error) {
//         console.error('Error adding password entry:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// --- In src/server.js ---

/**
 * @route   GET /api/passwords
 * @desc    Retrieves all encrypted password entries for the user.
 * @access  Protected
 */

// GET /api/passwords
app.get('/api/passwords', authMiddleware, async (req, res) => {
    try {
        const storedData = await loadData();
        const user = storedData.find(u => u.email === req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json(user.vault || []);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// app.get('/api/passwords', authMiddleware, async (req, res) => {
//     try {
//         const storedData = await loadData();

//         // Filter out only the password entries, leaving metadata behind.
//         const passwordEntries = storedData.filter(entry => entry.type === 'password_entry');

//         // We return the encrypted data. The client is responsible for decryption.
//         res.json(passwordEntries);

//     } catch (error) {
//         console.error('Error retrieving password entries:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// --- In src/server.js ---

/**
 * @route   DELETE /api/passwords/:id
 * @desc    Deletes a specific password entry by its ID.
 * @access  Protected
 */

app.delete('/api/passwords/:id', authMiddleware, async (req, res) => {
    try {
        const entryIdToDelete = req.params.id;
        const storedData = await loadData();
        const user = storedData.find(u => u.email === req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const entryIndex = user.vault.findIndex(entry => entry.id === entryIdToDelete);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Password entry not found.' });
        }

        user.vault.splice(entryIndex, 1);
        await saveData(storedData);

        res.json({ message: 'Password entry deleted successfully.', id: entryIdToDelete });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// app.delete('/api/passwords/:id', authMiddleware, async (req, res) => {
//     try {
//         const entryIdToDelete = req.params.id;
//         const storedData = await loadData();

//         // Find the index of the entry to delete
//         const entryIndex = storedData.findIndex(entry => entry.id === entryIdToDelete && entry.type === 'password_entry');

//         // Check if the entry was found
//         if (entryIndex === -1) {
//             return res.status(404).json({ error: 'Password entry not found.' });
//         }

//         // Remove the entry from the array
//         const deletedEntry = storedData.splice(entryIndex, 1);

//         // Save the updated data back to the file
//         await saveData(storedData);

//         // Send a confirmation response
//         // 200 OK is fine, or 204 No Content if you don't want to send a body.
//         res.json({ message: 'Password entry deleted successfully.', id: entryIdToDelete });

//     } catch (error) {
//         console.error('Error deleting password entry:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// --- In src/server.js ---

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

        const storedData = await loadData();
        const user = storedData.find(u => u.email === req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const entryToUpdate = user.vault.find(entry => entry.id === entryIdToUpdate);
        if (!entryToUpdate) {
            return res.status(404).json({ error: 'Password entry not found.' });
        }

        entryToUpdate.data = encryptedData;
        entryToUpdate.iv = iv;
        entryToUpdate.updatedAt = new Date().toISOString();

        await saveData(storedData);

        res.json({ message: 'Password entry updated successfully.', entry: entryToUpdate });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// app.put('/api/passwords/:id', authMiddleware, async (req, res) => {
//     try {
//         const entryIdToUpdate = req.params.id;
//         const { encryptedData, iv } = req.body;

//         // Validate the incoming data
//         if (!encryptedData || !iv) {
//             return res.status(400).json({ error: 'New encrypted data and IV are required.' });
//         }

//         const storedData = await loadData();

//         // Find the specific entry to update
//         const entryToUpdate = storedData.find(entry => entry.id === entryIdToUpdate && entry.type === 'password_entry');

//         if (!entryToUpdate) {
//             return res.status(404).json({ error: 'Password entry not found.' });
//         }

//         // Update the entry's data and add an 'updatedAt' timestamp
//         entryToUpdate.data = encryptedData;
//         entryToUpdate.iv = iv;
//         entryToUpdate.updatedAt = new Date().toISOString();

//         // Save the entire updated data array back to the file
//         await saveData(storedData);

//         res.json({ message: 'Password entry updated successfully.', entry: entryToUpdate });

//     } catch (error) {
//         console.error('Error updating password entry:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


app.listen(PORT, () => console.log(`Password Manager server listening on http://localhost:${PORT}`));