const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { CartModel, UserModel } = require("./models");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "https://ecommerce-frontend-c81y.onrender.com",
    "http://localhost:3000" // For local development
  ],
  credentials: true,
  exposedHeaders: ["set-cookie"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Configuration
const SECRET = process.env.JWT_SECRET || "Mouli222";
const TOKEN_EXPIRY = "1h";
const COOKIE_EXPIRY = 3600000; // 1 hour in milliseconds

// Database Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce")
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// Authentication Middleware
const verifyToken = (req, res, next) => {
  // Check both cookies and Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ 
      success: false, 
      msg: "Authentication required" 
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    console.log('Token verified successfully for user:', decoded.userId);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.clearCookie('token');
    return res.status(401).json({ 
      success: false, 
      msg: "Invalid or expired token" 
    });
  }
};

// Helper function to set auth cookie
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, { 
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_EXPIRY,
    path: '/',
    domain: isProduction ? '.onrender.com' : undefined
  });
};

// Auth Routes
app.post("/signup", async (req, res) => {
    try {
        const { Email, Password } = req.body;
        
        // Validate input
        if (!Email || !Password) {
            return res.status(400).json({
                success: false,
                msg: "Email and password are required"
            });
        }

        // Check if user exists
        const existingUser = await UserModel.findOne({ Email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                msg: "Email already registered"
            });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(Password, 10);
        const newUser = await UserModel.create({
            Email,
            Password: hashedPassword
        });

        // Generate JWT
        const token = jwt.sign({ userId: newUser._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
        
        // Set cookie
        setAuthCookie(res, token);
        
        // Respond
        res.status(201).json({
            success: true,
            msg: "Account created successfully!",
            user: { 
                email: newUser.Email,
                id: newUser._id
            }
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Server error during signup" 
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { Email, Password } = req.body;
        
        // Validate input
        if (!Email || !Password) {
            return res.status(400).json({
                success: false,
                msg: "Email and password are required"
            });
        }

        // Find user
        const user = await UserModel.findOne({ Email });
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Account not found"
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: "Incorrect password"
            });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
        
        // Set cookie
        setAuthCookie(res, token);
        
        // Respond
        res.json({
            success: true,
            msg: "Logged in successfully!",
            user: { 
                email: user.Email,
                id: user._id
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Server error during login" 
        });
    }
});

app.get("/api/auth/verify", verifyToken, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                msg: "User not found" 
            });
        }
        
        res.json({ 
            success: true,
            user: {
                email: user.Email,
                id: user._id
            }
        });
    } catch (err) {
        console.error("Verify token error:", err);
        res.clearCookie('token');
        res.status(401).json({ 
            success: false,
            msg: "Authentication verification failed" 
        });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
    });
    res.json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

// Product Routes
app.get("/api/products", async (req, res) => {
    try {
        const { category, limit = 10 } = req.query;
        let url = 'https://dummyjson.com/products';
        
        if (category) {
            url = `https://dummyjson.com/products/category/${category}`;
        } else {
            url = `https://dummyjson.com/products?limit=${limit}`;
        }

        const response = await axios.get(url);
        res.json(response.data);
    } catch (err) {
        console.error("Products fetch error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error fetching products" 
        });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const response = await axios.get(`https://dummyjson.com/products/${req.params.id}`);
        res.json(response.data);
    } catch (err) {
        console.error("Product fetch error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error fetching product details" 
        });
    }
});

// Cart Routes
app.get("/api/cart", verifyToken, async (req, res) => {
    try {
        const cart = await CartModel.findOne({ user: req.userId });
        res.json({ 
            success: true, 
            cart: cart || { items: [] } 
        });
    } catch (err) {
        console.error("Cart fetch error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error fetching cart" 
        });
    }
});

app.post("/api/cart", verifyToken, async (req, res) => {
    try {
        const { productId, title, price, thumbnail } = req.body;
        
        if (!productId || !title || !price) {
            return res.status(400).json({
                success: false,
                msg: "Missing required product fields"
            });
        }

        let cart = await CartModel.findOne({ user: req.userId });
        
        if (!cart) {
            cart = new CartModel({
                user: req.userId,
                items: []
            });
        }

        const existingItem = cart.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                productId,
                title,
                price,
                thumbnail,
                quantity: 1
            });
        }

        await cart.save();
        res.json({ 
            success: true, 
            cart 
        });
    } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error adding to cart" 
        });
    }
});

app.put("/api/cart/:productId", verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (quantity === undefined || quantity < 1) {
            return res.status(400).json({
                success: false,
                msg: "Invalid quantity value"
            });
        }

        const cart = await CartModel.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                msg: "Cart not found" 
            });
        }

        const item = cart.items.find(item => item.productId === parseInt(req.params.productId));
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                msg: "Item not found in cart" 
            });
        }

        item.quantity = quantity;
        await cart.save();
        res.json({ 
            success: true, 
            cart 
        });
    } catch (err) {
        console.error("Update cart error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error updating cart quantity" 
        });
    }
});

app.delete("/api/cart/:productId", verifyToken, async (req, res) => {
    try {
        const cart = await CartModel.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                msg: "Cart not found" 
            });
        }

        cart.items = cart.items.filter(item => item.productId !== parseInt(req.params.productId));
        await cart.save();
        res.json({ 
            success: true, 
            cart 
        });
    } catch (err) {
        console.error("Remove from cart error:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error removing item from cart" 
        });
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
        success: false, 
        msg: "Internal server error" 
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
