import { 
  Box, Typography, Button, Card, CardContent, 
  Grid, Divider, List, ListItem, ListItemText,
  IconButton, CircularProgress, TextField,
  Alert
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

function Cart({ setIsAuthenticated }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/cart`, {
          withCredentials: true
        });
        
        if (response.data.success === false) {
          setIsAuthenticated(false);
          navigate('/');
          return;
        }
        
        setCart(response.data.cart);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
          navigate('/');
        }
        setError("Failed to load cart");
        setLoading(false);
      }
    };
    fetchCart();
  }, [setIsAuthenticated, navigate]);

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE}/api/cart/${productId}`, {
        withCredentials: true
      });
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => item.productId !== productId)
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        navigate('/');
      }
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE}/api/cart/${productId}`,
        { quantity: newQuantity },
        { withCredentials: true }
      );
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        navigate('/');
      }
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Your Shopping Cart
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {(!cart || cart.items.length === 0) ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your cart is empty
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/home"
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <List>
                  {cart.items.map(item => (
                    <ListItem 
                      key={item.productId} 
                      divider
                      secondaryAction={
                        <IconButton onClick={() => handleRemoveItem(item.productId)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText 
                        primary={item.title} 
                        secondary={`Price: $${item.price}`}
                      />
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                        inputProps={{ min: 1 }}
                        sx={{ width: 80, mr: 2 }}
                      />
                      <Typography>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="h5">
                    Total: ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Cart;