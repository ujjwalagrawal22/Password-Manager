import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVaultPasswords } from '../api/api';
import { deriveKeyScrypt, decryptAES256CBC } from '../api/crypto';
import { deleteVaultPassword, updateVaultPassword } from '../api/api';
import { encryptAES256CBC } from '../api/crypto';
import { useMasterPassword } from '../context/MasterPasswordContext';
import MasterPasswordModal from '../components/MasterPasswordModal';
import {
  Box, Paper, Typography, TextField, Button, Alert, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Snackbar, Skeleton
} from '@mui/material';
import {
  Visibility, VisibilityOff, Edit, Delete, ContentCopy,
  Search, Add, Save, Cancel, Security
} from '@mui/icons-material';

const VaultPage = () => {
  const [passwords, setPasswords] = useState([]);
  const [decrypted, setDecrypted] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [editIdx, setEditIdx] = useState(null);
  const [editWebsite, setEditWebsite] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const { masterPassword } = useMasterPassword();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    fetchVaultPasswords(token)
      .then(setPasswords)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (passwords.length === 0) return;
    const salt = localStorage.getItem('salt');
    const kdfParams = JSON.parse(localStorage.getItem('kdfParams'));
    if (!salt || !kdfParams || !masterPassword) return;

    deriveKeyScrypt(masterPassword, salt, kdfParams)
      .then(async (key) => {
        const dec = [];
        for (const entry of passwords) {
          try {
            const decryptedText = await decryptAES256CBC(entry.data, entry.iv, key);
            dec.push(JSON.parse(decryptedText));
          } catch (e) {
            dec.push({ error: 'Failed to decrypt', raw: entry.data });
          }
        }
        setDecrypted(dec);
      });
  }, [passwords, masterPassword]);

  useEffect(() => {
    if (!masterPassword) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [masterPassword]);

  const handleCopyPassword = (password) => {
    navigator.clipboard.writeText(password);
    setSnackbar({ open: true, message: 'Password copied to clipboard!', severity: 'success' });
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Are you sure you want to delete this password?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await deleteVaultPassword(token, passwords[idx].id);
      setPasswords(passwords.filter((_, i) => i !== idx));
      setDecrypted(decrypted.filter((_, i) => i !== idx));
      setSnackbar({ open: true, message: 'Password deleted successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete: ' + err.message, severity: 'error' });
    }
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const salt = localStorage.getItem('salt');
      const kdfParams = JSON.parse(localStorage.getItem('kdfParams'));
      if (!token || !salt || !kdfParams || !masterPassword) {
        setSnackbar({ open: true, message: 'Missing authentication or encryption info.', severity: 'error' });
        return;
      }
      const key = await deriveKeyScrypt(masterPassword, salt, kdfParams);
      const { encryptedData, iv } = await encryptAES256CBC(
        JSON.stringify({
          website: editWebsite,
          username: editUsername,
          password: editPassword
        }),
        key
      );
      await updateVaultPassword(token, passwords[editIdx].id, encryptedData, iv);
      
      const updated = [...decrypted];
      updated[editIdx] = {
        website: editWebsite,
        username: editUsername,
        password: editPassword
      };
      setDecrypted(updated);
      setEditIdx(null);
      setSnackbar({ open: true, message: 'Password updated successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update: ' + err.message, severity: 'error' });
    }
  };

  const filteredPasswords = decrypted.filter(entry => 
    entry.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <MasterPasswordModal open={modalOpen} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Your Vault
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/add')}
        >
          Add Password
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search passwords..."
            disabled
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="70%" height={24} sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="rectangular" width={80} height={32} />
                      <Skeleton variant="rectangular" width={80} height={32} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          {filteredPasswords.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {searchTerm ? 'No passwords found' : 'Your vault is empty'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm 
                  ? 'Try adjusting your search terms or add a new password.'
                  : 'Start by adding your first password to keep it secure.'
                }
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/add')}
                >
                  Add Your First Password
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredPasswords.map((entry, idx) => {
                const originalIdx = decrypted.indexOf(entry);
                return (
                  <Grid item xs={12} sm={6} md={4} key={passwords[originalIdx]?.id || originalIdx}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h2" sx={{ wordBreak: 'break-word' }}>
                            {entry.website || 'Unknown Website'}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => setShowPasswords(prev => ({ ...prev, [originalIdx]: !prev[originalIdx] }))}
                            >
                              {showPasswords[originalIdx] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Username:</strong> {entry.username || '-'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            <strong>Password:</strong>
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              backgroundColor: 'action.hover',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              flexGrow: 1
                            }}
                          >
                            {showPasswords[originalIdx] ? (entry.password || '-') : '••••••••'}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyPassword(entry.password)}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => {
                              setEditIdx(originalIdx);
                              setEditWebsite(entry.website || '');
                              setEditUsername(entry.username || '');
                              setEditPassword(entry.password || '');
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDelete(originalIdx)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editIdx !== null} onClose={() => setEditIdx(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Website/Service"
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Username/Email"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditIdx(null)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={handleEdit} variant="contained" startIcon={<Save />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VaultPage;