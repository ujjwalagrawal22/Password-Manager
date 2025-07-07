const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 16;  // 128 bits for AES-CBC
// CHANGED: The function now accepts scrypt parameters
// Fix: Add scryptParams as a parameter with default value
async function deriveKey(masterPassword, salt, keylen, scryptParams) {
    return new Promise((resolve, reject) => {
        let options;
        if (scryptParams) {
            const { N, r, p } = scryptParams;
            options = { cost: N, blockSize: r, parallelization: p };
        } else {
            options = { cost: 16384, blockSize: 8, parallelization: 1 };
        }
        crypto.scrypt(masterPassword, salt, keylen, options, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey);
        });
    });
}
// async function deriveKey(masterPassword, salt, keyLength = KEY_LENGTH, scryptParams = { N: 2**14, r: 8, p: 1 }) {
//     return new Promise((resolve, reject) => {
//         crypto.scrypt(masterPassword, salt, keyLength, scryptParams, (err, derivedKey) => {
//             if (err) return reject(err);
//             resolve(derivedKey);
//         });
//     });
// }

function encrypt(text, derivedKey) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

function decrypt(encryptedData, ivHex, derivedKey) {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    deriveKey,
    encrypt,
    decrypt,
    IV_LENGTH,
    ALGORITHM,
    KEY_LENGTH // Exporting these for potential use elsewhere, e.g., generating salt
};
