import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { MasterPasswordProvider } from './context/MasterPasswordContext';
import createAppTheme from './ theme.js';
import { useTheme } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

function AppWithTheme() {
  const { mode } = useTheme();
  const theme = createAppTheme(mode);
  
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </MUIThemeProvider>
  );
}

root.render(
  <ThemeProvider>
    <AuthProvider>
      <MasterPasswordProvider>
        <AppWithTheme />
      </MasterPasswordProvider>
    </AuthProvider>
  </ThemeProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
