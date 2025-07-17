import { scrypt } from 'scrypt-js';

// Helper: convert hex to Uint8Array
function hexToUint8Array(hex) {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

// Helper: convert Uint8Array to hex
function uint8ArrayToHex(arr) {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Derive key using scrypt-js
export async function deriveKeyScrypt(password, saltHex, kdfParams) {
  const N = kdfParams.cost;
  const r = kdfParams.blockSize;
  const p = kdfParams.parallelization;
  const keyLen = 32;
  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = hexToUint8Array(saltHex);

  const derivedKey = await scrypt(passwordBytes, saltBytes, N, r, p, keyLen);
  return new Uint8Array(derivedKey);
}

// Encrypt with AES-CBC (Web Crypto API)
export async function encryptAES256CBC(plainText, keyBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(plainText)
  );
  return {
    encryptedData: uint8ArrayToHex(new Uint8Array(encrypted)),
    iv: uint8ArrayToHex(iv)
  };
}

// Decrypt with AES-CBC (Web Crypto API)
export async function decryptAES256CBC(encryptedHex, ivHex, keyBytes) {
  const encrypted = hexToUint8Array(encryptedHex);
  const iv = hexToUint8Array(ivHex);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}