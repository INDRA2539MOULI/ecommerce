import { 
  Box, Typography, Button, Grid, 
  Card, CardMedia, Rating, Divider,
  Chip, CircularProgress, IconButton 
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/cart`, {
        productId: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail
      }, { withCredentials: true });
      setAddedToCart(true);
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return <Typography>Product not found</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <IconButton component={Link} to="/home" sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="500"
              image={product.thumbnail}
              alt={product.title}
              sx={{ objectFit: 'contain' }}
            />
          </Card>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
            {product.images.map((img, index) => (
              <CardMedia
                key={index}
                component="img"
                height="80"
                image={img}
                alt={`${product.title} ${index + 1}`}
                sx={{ width: 80, borderRadius: 1 }}
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {product.title}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            ${product.price} <Chip label={`${product.discountPercentage}% off`} color="success" size="small" />
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={product.rating} precision={0.1} readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {product.rating} ({product.stock} in stock)
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            {product.description}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Brand: {product.brand}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Category: {product.category}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={addedToCart}
            sx={{ mt: 3 }}
          >
            {addedToCart ? 'Added to Cart' : 'Add to Cart'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductDetails;