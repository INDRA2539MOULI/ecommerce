import { 
  AppBar, Box, Button, Card, CardActions, CardContent, CardMedia, 
  CircularProgress, Container, Grid, IconButton, Typography, Toolbar,
  Menu, MenuItem, Avatar
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";

const ProductCard = ({ product }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
      component="img"
      height="200"
      image={product.thumbnail}
      alt={product.title}
      sx={{ objectFit: 'contain', p: 1 }}
    />
    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {product.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ${product.price}
      </Typography>
      <Typography variant="body2">
        Rating: {product.rating}
      </Typography>
    </CardContent>
    <CardActions>
      <Button 
        size="small" 
        component={Link} 
        to={`/product/${product.id}`}
      >
        View
      </Button>
    </CardActions>
  </Card>
);

function Home({ userEmail, setIsAuthenticated }) {
  const [featured, setFeatured] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredRes, laptopsRes, mobilesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE}/api/products?limit=8`),
          axios.get(`${import.meta.env.VITE_API_BASE}/api/products?category=laptops`),
          axios.get(`${import.meta.env.VITE_API_BASE}/api/products?category=smartphones`)
        ]);
        
        setFeatured(featuredRes.data.products);
        setLaptops(laptopsRes.data.products);
        setMobiles(mobilesRes.data.products);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/logout`, {}, { 
        withCredentials: true 
      });
      setIsAuthenticated(false);
      navigate('/', { replace: true });  // Force redirect to login
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      handleMenuClose();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>E-SHOP</Typography>
          
          <IconButton color="inherit" component={Link} to="/cart">
            <ShoppingCartIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {userEmail ? userEmail.charAt(0).toUpperCase() : ''}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>{userEmail}</MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Featured Products */}
        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
          Featured Products
        </Typography>
        <Grid container spacing={3}>
          {featured.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>

        {/* Laptops Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          Laptops
        </Typography>
        <Grid container spacing={3}>
          {laptops.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>

        {/* Mobiles Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          Smartphones
        </Typography>
        <Grid container spacing={3}>
          {mobiles.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}

export default Home;