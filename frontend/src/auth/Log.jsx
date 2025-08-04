import { 
  TextField, Typography, Button, Box, CircularProgress, Alert 
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function Login({ setIsAuthenticated, setUserEmail }) {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE}/login`, 
        { Email: email, Password: password },
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
        const from = location.state?.from || "/home";
        navigate(from, { replace: true });
      } else {
        setError(response.data.msg || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.msg || "An error occurred during login");
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
          Login
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
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>

          <Typography align="center">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}

export default Login;
