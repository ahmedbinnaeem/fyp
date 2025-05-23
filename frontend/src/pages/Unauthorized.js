import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h2" color="error" gutterBottom>
        401
      </Typography>
      <Typography variant="h4" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        You don't have permission to access this page.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default Unauthorized; 