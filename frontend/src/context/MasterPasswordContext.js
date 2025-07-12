import React, { createContext, useState, useContext } from 'react';

const MasterPasswordContext = createContext();

export const MasterPasswordProvider = ({ children }) => {
  const [masterPassword, setMasterPassword] = useState('');

  return (
    <MasterPasswordContext.Provider value={{ masterPassword, setMasterPassword }}>
      {children}
    </MasterPasswordContext.Provider>
  );
};

export const useMasterPassword = () => useContext(MasterPasswordContext); 