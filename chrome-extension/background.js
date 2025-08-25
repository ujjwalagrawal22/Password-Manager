// background.js

// Import the cryptographic functions from your crypto.js file
import { deriveKeyScrypt, encryptAES256CBC, decryptAES256CBC } from './crypto.js';

// --- Configuration ---
const BASE_API_URL = 'http://34.29.53.106/api';

// --- In-memory State ---
// The derivedKey is stored here temporarily and is cleared when the browser closes.
// This is a security measure to avoid storing the sensitive encryption key in persistent storage.
let state = {
    token: null,
    derivedKey: null, // This will be a Uint8Array
    isLoggedIn: false
};

// --- API Helper Function ---
async function fetchWithAuth(url, options = {}) {
    if (!state.token) {
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Handle token expiration or invalidation by logging out
        state.token = null;
        state.derivedKey = null;
        state.isLoggedIn = false;
        throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    // Handle cases with no JSON response body (like a 204 No Content)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return null; // Or handle as needed
}

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            // --- Authentication Flow ---
            if (message.type === 'LOGIN') {
                const { email, masterPassword } = message.data;
                const loginResponse = await fetch(`${BASE_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, masterPassword }),
                });

                if (!loginResponse.ok) {
                    const errorData = await loginResponse.json();
                    throw new Error(errorData.error);
                }

                const { token, salt, kdfParams } = await loginResponse.json();

                // Derive the encryption key using the master password and server-provided salt
                const derivedKey = await deriveKeyScrypt(masterPassword, salt, kdfParams);

                // Store the token and derived key in our in-memory state
                state.token = token;
                state.derivedKey = derivedKey;
                state.isLoggedIn = true;

                console.log("Login successful. Key derived and stored in memory.");
                sendResponse({ success: true });

            } else if (message.type === 'LOGOUT') {
                state.token = null;
                state.derivedKey = null;
                state.isLoggedIn = false;
                console.log("User logged out.");
                sendResponse({ success: true });

            } else if (message.type === 'GET_LOGIN_STATUS') {
                sendResponse({ isLoggedIn: state.isLoggedIn });
            }

            // --- Password Capture and Save Flow ---
            else if (message.type === 'PASSWORD_CAPTURED') {
                if (!state.isLoggedIn) return; // Do nothing if not logged in
                // Ask the content script on the relevant tab to show a "Save password?" prompt
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: 'PROMPT_TO_SAVE_PASSWORD',
                    data: message.data
                });

            } else if (message.type === 'SAVE_CREDENTIALS') {
                if (!state.derivedKey) {
                    throw new Error("Cannot save. User is not logged in or key is missing.");
                }
                
                // 1. Encrypt the new credential data using the in-memory key.
                const credentialsJSON = JSON.stringify(message.data);
                const { encryptedData, iv } = await encryptAES256CBC(credentialsJSON, state.derivedKey);

                // 2. Send the *encrypted* data and IV to the server.
                await fetchWithAuth(`${BASE_API_URL}/passwords`, {
                    method: 'POST',
                    body: JSON.stringify({ encryptedData, iv }),
                });

                console.log('Credentials encrypted and saved to the vault.');
                 // --- NEW: SYSTEM NOTIFICATION ---
                 chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'images/icon48.png', // Ensure you created this file!
                  title: 'Password Saved',
                  message: `Your login for ${new URL(message.data.url).hostname} has been saved.`
              });
              // --- END NEW SECTION ---
                sendResponse({ success: true });
            }

            // --- Autofill Flow ---
            else if (message.type === 'GET_CREDENTIALS_FOR_URL') {
                if (!state.isLoggedIn || !state.derivedKey) {
                    throw new Error("Not logged in.");
                }

                // 1. Get all encrypted vault entries from the server.
                const encryptedVault = await fetchWithAuth(`${BASE_API_URL}/passwords`);

                // Helper function to get the origin (protocol + hostname + port) of a URL
                const getOrigin = (urlString) => {
                    try {
                        return new URL(urlString).origin;
                    } catch (e) {
                        console.warn("Invalid URL encountered:", urlString, e);
                        return null;
                    }
                };

                const currentUrlOrigin = getOrigin(message.url);

                // 2. Decrypt each entry and find matches for the current URL.
                const matchingCredentials = [];
                for (const entry of encryptedVault) {
                    // Your backend stores the encrypted data in `entry.data` and the iv in `entry.iv`
                    const decryptedString = await decryptAES256CBC(entry.data, entry.iv, state.derivedKey);
                    const credential = JSON.parse(decryptedString);
                    
                    // Simple matching logic. Can be improved (e.g., using new URL() for better domain matching).
                    if (credential.url) {
                        const savedUrlOrigin = getOrigin(credential.url);
                        if (currentUrlOrigin && savedUrlOrigin && currentUrlOrigin === savedUrlOrigin) {
                            matchingCredentials.push(credential);
                        }
                    }
                }

                sendResponse({ success: true, data: matchingCredentials });
            }
        } catch (error) {
            console.error(`Error in background script for message type ${message.type}:`, error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    // Return true to indicate that we will send a response asynchronously.
    return true;
});