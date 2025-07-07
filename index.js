const { deriveKey, encrypt, decrypt } = require('./src/backend/cryptoService');
const { loadData, saveData } = require('./src/database/dataStore');
const crypto = require('crypto');
const readline = require('readline');

const MASTER_PASSWORD_SALT_LENGTH = 16;

// NEW: Add this constant at the top of your file
const AUTHENTICATION_CHECK_STRING = "master_password_verification_check";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// --- In index.js ---
// Replace your old initializePasswordManager function with this one.



async function initializePasswordManager() {
    let storedData = await loadData();
    let derivedKey;

    // CHANGED: Find the single metadata entry instead of just the salt
    let metadata = storedData.find(entry => entry.type === "metadata");

    if (!metadata) {
        // --- First-Time Setup ---
        console.log("\nIt looks like this is your first time. Let's set up your master password.\n");
        const masterPassword = await prompt("Enter a new master password: ");
        const confirmMasterPassword = await prompt("Confirm your master password: ");

        if (masterPassword !== confirmMasterPassword) {
            console.error("Master passwords do not match. Please try again.");
            rl.close();
            process.exit(1);
        }

        const masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
        derivedKey = await deriveKey(masterPassword, masterSalt);
        
        // NEW: Encrypt the verification string to create an authentication tag
        const authTag = encrypt(AUTHENTICATION_CHECK_STRING, derivedKey);

        // NEW: Create a single metadata object
        const newMetadata = {
            type: "metadata",
            salt: masterSalt,
            authTagData: authTag.encryptedData,
            authTagIv: authTag.iv
        };
        storedData.push(newMetadata);
        await saveData(storedData);

        console.log("Master password set and key derived. You are now logged in.");

    } else {
        // --- Login ---
        let authenticated = false;
        while (!authenticated) {
            const masterPassword = await prompt("Enter your master password to unlock: ");
            
            // Derive a key from the user's input password
            derivedKey = await deriveKey(masterPassword, metadata.salt);

            try {
                // NEW: Attempt to decrypt the stored authentication tag
                const decryptedCheck = decrypt(metadata.authTagData, metadata.authTagIv, derivedKey);
                
                // NEW: Check if the decrypted text matches our known string
                if (decryptedCheck === AUTHENTICATION_CHECK_STRING) {
                    console.log("Master password confirmed. You are now logged in.");
                    authenticated = true; // Success! Exit the loop.
                } else {
                    // This case is unlikely but good to have. Usually, it will throw an error.
                    console.error("Authentication failed. Please try again.");
                }
            } catch (error) {
                // This will happen if the password is wrong, causing decryption to fail.
                console.error("Authentication failed. The master password you entered is incorrect. Please try again.");
            }
        }
    }
    // Return only the derivedKey. The salt is no longer needed in the main loop.
    return { derivedKey };
}
// async function initializePasswordManager() {
//     let storedData = await loadData();
//     let masterSalt;
//     let derivedKey;

//     let masterSaltEntry = storedData.find(entry => entry.type === "master_salt");

//     if (!masterSaltEntry) {
//         console.log("\nIt looks like this is your first time. Let's set up your master password.\n");
//         const masterPassword = await prompt("Enter a new master password: ");
//         const confirmMasterPassword = await prompt("Confirm your master password: ");

//         if (masterPassword !== confirmMasterPassword) {
//             console.error("Master passwords do not match. Please try again.");
//             rl.close();
//             process.exit(1);
//         }

//         masterSalt = crypto.randomBytes(MASTER_PASSWORD_SALT_LENGTH).toString('hex');
//         derivedKey = await deriveKey(masterPassword, masterSalt);
        
//         storedData.push({ type: "master_salt", value: masterSalt });
//         await saveData(storedData);

//         console.log("Master password set and key derived. You are now logged in.");
//     } else {
//         masterSalt = masterSaltEntry.value;
//         let authenticated = false;
//         while (!authenticated) {
//             const masterPassword = await prompt("Enter your master password to unlock: ");
//             derivedKey = await deriveKey(masterPassword, masterSalt);
//             // TODO: Implement actual authentication verification here.
//             // For now, we'll proceed assuming the master password is correct if deriveKey succeeds.
//             console.log("Master password confirmed. You are now logged in.");
//             authenticated = true; // Placeholder for actual authentication check
//         }
//     }
//     return { derivedKey, masterSalt };
// }

async function addPasswordEntry(derivedKey) {
    console.log("\n--- Add New Password Entry ---");
    const website = await prompt("Website/Service: ");
    const username = await prompt("Username/Email: ");
    const password = await prompt("Password: ");

    const encryptedData = encrypt(JSON.stringify({ website, username, password }), derivedKey);

    let storedData = await loadData();
    storedData.push({ type: "password_entry", data: encryptedData.encryptedData, iv: encryptedData.iv });
    await saveData(storedData);
    console.log("Password entry added successfully!");
}

async function viewPasswordEntries(derivedKey) {
    console.log("\n--- Your Stored Passwords ---");
    let storedData = await loadData();
    const passwordEntries = storedData.filter(entry => entry.type === "password_entry");

    if (passwordEntries.length === 0) {
        console.log("No password entries found.");
        return;
    }

    passwordEntries.forEach((entry, index) => {
        try {
            const decryptedText = decrypt(entry.data, entry.iv, derivedKey);
            const decryptedEntry = JSON.parse(decryptedText);
            console.log(`\nEntry ${index + 1}:`);
            console.log(`  Website: ${decryptedEntry.website}`);
            console.log(`  Username: ${decryptedEntry.username}`);
            console.log(`  Password: ${decryptedEntry.password}`);
        } catch (error) {
            console.error(`Error decrypting entry ${index + 1}:`, error.message);
        }
    });
}

async function main() {
    const { derivedKey, masterSalt } = await initializePasswordManager();

    let running = true;
    while (running) {
        console.log("\n--- Password Manager Menu ---");
        console.log("1. Add New Password");
        console.log("2. View Passwords");
        console.log("3. Exit");

        const choice = await prompt("Choose an option: ");

        switch (choice.trim()) {
            case '1':
                await addPasswordEntry(derivedKey);
                break;
            case '2':
                await viewPasswordEntries(derivedKey);
                break;
            case '3':
                console.log("Exiting Password Manager. Goodbye!");
                running = false;
                break;
            default:
                console.log("Invalid option. Please try again.");
        }
    }
    rl.close();
}

main();
