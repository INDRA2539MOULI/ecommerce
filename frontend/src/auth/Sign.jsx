import { 
  TextField, Typography, Button, Box, 
  CircularProgress, Alert 
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Signup({ setIsAuthenticated, setUserEmail }) {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
       `${import.meta.env.VITE_API_BASE}/signup`, 
        { 
          Email: email, 
          Password: password 
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setIsAuthenticated(true);
        setUserEmail(response.data.user.email);
        navigate("/home");
      } else {
        setError(response.data.msg || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      if (err.response) {
        setError(err.response.data.msg || "Signup failed");
      } else if (err.request) {
        setError("No response from server. Please try again.");
      } else {
        setError("Signup error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      width: "100vw", 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      backgroundColor: 'background.default'
    }}>
      <Box sx={{ 
        p: 4, 
        width: { xs: '90%', sm: '400px' }, 
        boxShadow: 3, 
        borderRadius: 2,
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h5" align="center" gutterBottom color="primary">
          Sign Up
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            variant="outlined"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            variant="outlined"
            type="password"
            required
            value={password}
            onChange={(e) => setPass(e.target.value)}
            error={!!error}
            helperText="Minimum 6 characters"
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>

          <Typography align="center">
            Already have an account? <Link to="/">Login</Link>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}

export default Signup;