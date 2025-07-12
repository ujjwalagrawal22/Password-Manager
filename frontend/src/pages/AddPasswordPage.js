import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addVaultPassword } from '../api/api';
import { deriveKeyScrypt, encryptAES256CBC } from '../api/crypto';
import { useMasterPassword } from '../context/MasterPasswordContext';
import MasterPasswordModal from '../components/MasterPasswordModal';
import {
  Box, Paper, Typography, TextField, Button, Alert, LinearProgress,
  IconButton, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';

const AddPasswordPage = () => {
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { masterPassword } = useMasterPassword();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!masterPassword) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [masterPassword]);

  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'error' };
    
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special characters');

    let label = '';
    let color = 'error';

    if (score <= 1) {
      label = 'Very Weak';
      color = 'error';
    } else if (score === 2) {
      label = 'Weak';
      color = 'warning';
    } else if (score === 3) {
      label = 'Fair';
      color = 'info';
    } else if (score === 4) {
      label = 'Good';
      color = 'success';
    } else {
      label = 'Strong';
      color = 'success';
    }

    return { score, label, color, feedback };
  };

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let generatedPassword = '';
    
    // Ensure at least one of each character type
    generatedPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    generatedPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    generatedPassword += '0123456789'[Math.floor(Math.random() * 10)];
    generatedPassword += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      generatedPassword += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    generatedPassword = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(generatedPassword);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setSuccess('Password copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!website || !username || !password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const salt = localStorage.getItem('salt');
      const kdfParams = JSON.parse(localStorage.getItem('kdfParams'));
      if (!token || !salt || !kdfParams || !masterPassword) {
        setError('Missing authentication or encryption info.');
        setLoading(false);
        return;
      }

      const key = await deriveKeyScrypt(masterPassword, salt, kdfParams);
      //User enters:website,username,password
      const { encryptedData, iv } = await encryptAES256CBC(
        JSON.stringify({ website, username, password }),
        key
      );
      // Sends encrypted data to the server 
      await addVaultPassword(token, encryptedData, iv);
      setSuccess('Password entry added successfully!');
      setWebsite('');
      setUsername('');
      setPassword('');
      setTimeout(() => navigate('/vault'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Add New Password
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Website/Service"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="e.g., google.com, github.com"
          />
          
          <TextField
            label="Username/Email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="your.email@example.com"
          />
          
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="Enter or generate a password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  {password && (
                    <IconButton onClick={copyToClipboard} edge="end">
                      <ContentCopy />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {password && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Password Strength: {passwordStrength.label}
                </Typography>
                <Typography variant="body2" color={`${passwordStrength.color}.main`}>
                  {passwordStrength.score}/5
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(passwordStrength.score / 5) * 100} 
                color={passwordStrength.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
              {passwordStrength.feedback.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Suggestions: {passwordStrength.feedback.join(', ')}
                </Typography>
              )}
            </Box>
          )}

          {/* Generate Password Button */}
          <Button
            type="button"
            variant="outlined"
            onClick={generatePassword}
            fullWidth
            sx={{ mb: 2 }}
          >
            Generate Strong Password
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Add Password'}
          </Button>
        </form>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
      
      <MasterPasswordModal open={modalOpen} />
    </Box>
  );
};

export default AddPasswordPage;