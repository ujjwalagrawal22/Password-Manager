import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useMasterPassword } from '../context/MasterPasswordContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 350,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const MasterPasswordModal = ({ open }) => {
  const { setMasterPassword } = useMasterPassword();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input) {
      setError('Master password is required.');
      return;
    }
    setMasterPassword(input);
    setInput('');
    setError('');
  };

  return (
    <Modal open={open}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Enter Master Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Master Password"
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Unlock
          </Button>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    </Modal>
  );
};

export default MasterPasswordModal;
