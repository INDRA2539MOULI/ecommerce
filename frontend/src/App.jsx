import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Home from './Home';
import Signup from './auth/Sign';
import Login from './auth/Log';
import Cart from './Cart';
import ProductDetails from './ProductDetails';
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/auth/verify`, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        setIsAuthenticated(response.data.success);
        if (response.data.user) {
          setUserEmail(response.data.user.email);
        }
      } catch (err) {
        console.error("Auth verification error:", err);
        setIsAuthenticated(false);
        setUserEmail('');
      }
    };
    checkAuth();
  }, [location.pathname]);

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/home" /> : <Login setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/home" /> : <Signup setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />} 
      />
      <Route 
        path="/home" 
        element={isAuthenticated ? <Home userEmail={userEmail} setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" state={{ from: location.pathname }} />} 
      />
      <Route 
        path="/cart" 
        element={isAuthenticated ? <Cart setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" state={{ from: '/cart' }} />} 
      />
      <Route 
        path="/product/:id" 
        element={isAuthenticated ? <ProductDetails /> : <Navigate to="/" />} 
      />
    </Routes>
  );
}

export default App;
