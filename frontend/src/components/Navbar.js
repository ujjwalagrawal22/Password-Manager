import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      background: '#1976d2',
      color: '#fff',
      marginBottom: 24
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 20 }}>
        Password Manager
      </div>
      <div>
        <Link to="/vault" style={{ color: '#fff', marginRight: 16, textDecoration: 'none' }}>Vault</Link>
        <Link to="/add" style={{ color: '#fff', marginRight: 16, textDecoration: 'none' }}>Add Password</Link>
        <button onClick={handleLogout} style={{
          background: '#fff',
          color: '#1976d2',
          border: 'none',
          borderRadius: 4,
          padding: '6px 16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;