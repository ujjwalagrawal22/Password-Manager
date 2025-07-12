import { createTheme } from '@mui/material/styles';

const createAppTheme = (mode) => createTheme({
  palette: {
    mode: mode,
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 700,
    },
  },
});

export default createAppTheme;
