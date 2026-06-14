// Helper utilities for string to hex and hex to string conversions
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hexString) {
  if (!hexString || hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Generate a random salt (16 bytes) as hex
export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return bufferToHex(array);
}

// Derive AES-GCM key from Master Password and Salt using PBKDF2
export async function deriveKey(masterPassword, saltHex) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);
  const saltBuffer = hexToBuffer(saltHex);

  // Import the password as a raw key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive the actual AES-GCM encryption key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plain text using AES-GCM with a random IV (12 bytes)
export async function encryptData(plainText, key) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(plainText);
  
  // Generate random Initialization Vector (IV)
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: bufferToHex(encryptedBuffer),
    iv: bufferToHex(iv)
  };
}

// Decrypt ciphertext using AES-GCM
export async function decryptData(ciphertextHex, ivHex, key) {
  const ciphertextBuffer = hexToBuffer(ciphertextHex);
  const ivBuffer = hexToBuffer(ivHex);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Gagal melakukan dekripsi. Master Password salah atau data korup.');
  }
}

// SHA-256 hashing helper for hashing the verification text
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}
