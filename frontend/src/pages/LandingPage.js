import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {  useNavigate } from 'react-router-dom';
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              mb: 2,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            🔒 My Password Manager
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >

</Typography>
<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
  <Button
    variant="contained"
    size="large"
    onClick={() => navigate('/register')}
    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
  >
    Get Started Free
  </Button>
  <Button
    variant="outlined"
    size="large"
    onClick={() => navigate('/login')}
    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
  >
    Sign In
  </Button>
</Box>
</Box>

{/* Features Section */}
<Typography
variant="h3"
component="h2"
textAlign="center"
sx={{ mb: 6, fontWeight: 700 }}
>
Why Choose Our Password Manager?
</Typography>

{/* Grid container with alignItems="stretch" to make all grid items in a row equal height */}
<Grid container spacing={4} justifyContent="center" alignItems="stretch" sx={{ mb: 8 }}>

{/* Card 1: Military-Grade Encryption */}
<Grid 
  item 
  xs={12} 
  md={4} 
  sx={{ display: 'flex' }}
>
  <Card 
    sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'center',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-4px)' },
    }}
  >
    <CardContent 
      sx={{ 
        p: 4,
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <Typography 
        variant="h5" 
        component="h3" 
        sx={{ mb: 2, fontWeight: 600 }}
      >
        Military-Grade Encryption
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="body1" color="text.secondary">
        Your passwords use AES-256 encryption, the same standard trusted worldwide.
      </Typography>
    </CardContent>
  </Card>
</Grid>

{/* Card 2: Zero-Knowledge Architecture */}
<Grid 
  item 
  xs={12} 
  md={4} 
  sx={{ display: 'flex' }}
>
  <Card 
    sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'center',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-4px)' },
    }}
  >
    <CardContent 
      sx={{ 
        p: 4,
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <VpnKeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <Typography 
        variant="h5" 
        component="h3" 
        sx={{ mb: 2, fontWeight: 600 }}
      >
        Zero-Knowledge Architecture
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="body1" color="text.secondary">
        We never see your passwords. Everything is encrypted locally before being stored.
      </Typography>
    </CardContent>
  </Card>
</Grid>

{/* Card 3: Master Password Only */}
<Grid 
  item 
  xs={12} 
  md={4} 
  sx={{ display: 'flex' }}
>
  <Card 
    sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'center',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-4px)' },
    }}
  >
    <CardContent 
      sx={{ 
        p: 4,
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <VisibilityOffIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <Typography 
        variant="h5" 
        component="h3" 
        sx={{ mb: 2, fontWeight: 600 }}
      >
        Master Password Only
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="body1" color="text.secondary">
        Remember just one password. We'll take care of generating and storing the rest.
      </Typography>
    </CardContent>
  </Card>
</Grid>
</Grid>

{/* Security Promise Section */}
<Paper 
elevation={3} 
sx={{ 
  p: 6, 
  textAlign: 'center', 
  bgcolor: 'primary.main', 
  color: 'primary.contrastText',
  mb: 8
}}
>
<LockIcon sx={{ fontSize: 60, mb: 2 }} />
<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
  Your Security is Our Priority
</Typography>
<Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
  We use industry-standard encryption and follow security best practices 
  to ensure your data is always protected.
</Typography>
<Typography variant="body1" sx={{ opacity: 0.8 }}>
  Zero-knowledge architecture means we can't see your passwords even if we wanted to.
</Typography>
</Paper>

{/* Call to Action */}
<Box textAlign="center">
<Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 700 }}>
  Ready to Secure Your Digital Life?
</Typography>
<Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
  Join thousands of users who trust us with their password security.
</Typography>
<Button
  variant="contained"
  size="large"
  onClick={() => navigate('/register')}
  sx={{ 
    px: 6, 
    py: 2, 
    fontSize: '1.2rem',
    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
    '&:hover': {
      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
    }
  }}
>
  Start Protecting Your Passwords Now
</Button>
</Box>
</Container>

{/* Footer */}
<Box 
component="footer" 
sx={{ 
bgcolor: 'grey.100', 
py: 4, 
mt: 8,
borderTop: 1,
borderColor: 'divider'
}}
>
<Container maxWidth="lg">
<Typography variant="body2" textAlign="center" color="text.secondary">
  © 2024 My Password Manager. Built with security and privacy in mind.
</Typography>
</Container>
</Box>
</Box>
);
};

export default LandingPage;