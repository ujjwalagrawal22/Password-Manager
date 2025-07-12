import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginMasterPassword } from '../api/api';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { useMasterPassword } from '../context/MasterPasswordContext';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setMasterPassword } = useMasterPassword();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter your email and master password.');
      setLoading(false);
      return;
    }

    try {
      const result = await loginMasterPassword(email, password);
      login(result.token, result.salt, result.kdfParams);
      setMasterPassword(password); // Store master password in context
      navigate('/vault');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            color: 'primary.main',
            mb: 2,
            textShadow: '1px 1px 2px #90caf9'
          }}
        >
          🔒 My Password Manager
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
          />
          <TextField
            label="Master Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <Typography align="center" sx={{ mt: 2 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Box>
  );
};

export default LoginPage;