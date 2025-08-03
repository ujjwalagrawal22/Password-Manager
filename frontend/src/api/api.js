// frontend/src/api/api.js

const API_BASE = process.env.REACT_APP_API_URL; // Change this to your backend URL/port if different


export async function loginMasterPassword(email,password) {
  // Adjust the endpoint and payload to match your backend API
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, masterPassword: password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json(); // Should return { token: '...' } or similar
}

export async function fetchVaultPasswords(token) {
    const response = await fetch(`${API_BASE}/api/passwords`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch passwords');
    }
  
    return response.json(); // Returns an array of encrypted password entries
  }

  export async function addVaultPassword(token, encryptedData, iv) {
    const response = await fetch(`${API_BASE}/api/passwords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ encryptedData, iv }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add password');
    }
  
    return response.json();
  }

  export async function deleteVaultPassword(token, id) {
    const response = await fetch(`${API_BASE}/api/passwords/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete password');
    }
    return response.json();
  }

  export async function updateVaultPassword(token, id, encryptedData, iv) {
    const response = await fetch(`${API_BASE}/api/passwords/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ encryptedData, iv }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }
    return response.json();
  }