import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import VaultPage from './pages/VaultPage';
import AddPasswordPage from './pages/AddPasswordPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';

function App() {
  const { isLoggedIn, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {isLoggedIn && (
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/add" element={<AddPasswordPage />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;