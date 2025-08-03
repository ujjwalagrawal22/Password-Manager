import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, IconButton, Divider, Avatar, Typography, Collapse } from '@mui/material';
import { Home, Add, Logout, ChevronLeft, ChevronRight, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMasterPassword } from '../context/MasterPasswordContext';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { setMasterPassword } = useMasterPassword();

  const menu = [
    { icon: <Home />, label: 'Vault', path: '/vault' },
    { icon: <Add />, label: 'Add Password', path: '/add' },
  ];

  const handleLogout = () => {
    logout();
    setMasterPassword(null); // Clear master password from context
    navigate('/');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? 64 : 240,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        [`& .MuiDrawer-paper`]: {
          width: isCollapsed ? 64 : 240,
          boxSizing: 'border-box',
          background: 'background.paper',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
        {!isCollapsed && (
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
            Password Manager
          </Typography>
        )}
        <IconButton onClick={onToggle}>
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <Avatar sx={{ width: 32, height: 32, mr: isCollapsed ? 0 : 1 }} />
          {!isCollapsed && (
            <>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  HOLA, User
                </Typography>
              </Box>
              {dropdownOpen ? <ExpandLess /> : <ExpandMore />}
            </>
          )}
        </Box>
        
        <Collapse in={dropdownOpen && !isCollapsed}>
          <List dense>
            {menu.map((item) => (
              <ListItem
                button
                key={item.label}
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setDropdownOpen(false);
                }}
                sx={{
                  ml: 2,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box sx={{ p: 1 }}>
        <IconButton onClick={toggleTheme} sx={{ mb: 1 }}>
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
        <IconButton
          color="error"
          onClick={handleLogout}
          sx={{ width: '100%' }}
        >
          <Logout />
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
