const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { CartModel, UserModel } = require("./models");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
require('dotenv').config(); 

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "https://ecommerce-frontend-c81y.onrender.com",
    credentials: true,
    exposedHeaders: ["set-cookie"]
}));

const SECRET = process.env.JWT_SECRET || "Mouli222";
const TOKEN_EXPIRY = "1h";
const COOKIE_EXPIRY = 3600000;

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("Mongo error:", err));

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ success: false, msg: "Invalid token" });
    }
};

// Auth Routes
app.post("/signup", async (req, res) => {
    try {
        const existingUser = await UserModel.findOne({ Email: req.body.Email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                msg: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.Password, 10);
        const newUser = await UserModel.create({
            Email: req.body.Email,
            Password: hashedPassword
        });

        const token = jwt.sign({ userId: newUser._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
        
        res.cookie('token', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_EXPIRY,
            path: '/'
        });
        
        res.status(201).json({
            success: true,
            msg: "Account created successfully!",
            user: { email: newUser.Email }
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ success: false, msg: "Server error during signup" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const user = await UserModel.findOne({ Email: req.body.Email });
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Account not found"
            });
        }

        const isMatch = await bcrypt.compare(req.body.Password, user.Password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: "Incorrect password"
            });
        }

        const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
        
        res.cookie('token', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_EXPIRY,
            path: '/'
        });
        
        res.json({
            success: true,
            msg: "Logged in successfully!",
            user: { email: user.Email }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});

app.get("/api/auth/verify", verifyToken, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res.status(401).json({ success: false });
        }
        res.json({ 
            success: true,
            user: {
                email: user.Email
            }
        });
    } catch (err) {
        console.error("Verify token error:", err);
        res.status(401).json({ success: false });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    res.json({ success: true, msg: "Logged out successfully" });
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
        res.status(500).json({ success: false, msg: "Error fetching products" });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const response = await axios.get(`https://dummyjson.com/products/${req.params.id}`);
        res.json(response.data);
    } catch (err) {
        console.error("Product fetch error:", err);
        res.status(500).json({ success: false, msg: "Error fetching product" });
    }
});

// Cart Routes
app.get("/api/cart", verifyToken, async (req, res) => {
    try {
        const cart = await CartModel.findOne({ user: req.userId });
        res.json({ success: true, cart: cart || { items: [] } });
    } catch (err) {
        console.error("Cart fetch error:", err);
        res.status(500).json({ success: false, msg: "Error fetching cart" });
    }
});

app.post("/api/cart", verifyToken, async (req, res) => {
    try {
        const { productId, title, price, thumbnail } = req.body;
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
        res.json({ success: true, cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).json({ success: false, msg: "Error adding to cart" });
    }
});

app.put("/api/cart/:productId", verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await CartModel.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ success: false, msg: "Cart not found" });
        }

        const item = cart.items.find(item => item.productId === parseInt(req.params.productId));
        if (!item) {
            return res.status(404).json({ success: false, msg: "Item not found in cart" });
        }

        item.quantity = quantity;
        await cart.save();
        res.json({ success: true, cart });
    } catch (err) {
        console.error("Update cart error:", err);
        res.status(500).json({ success: false, msg: "Error updating quantity" });
    }
});

app.delete("/api/cart/:productId", verifyToken, async (req, res) => {
    try {
        const cart = await CartModel.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ success: false, msg: "Cart not found" });
        }

        cart.items = cart.items.filter(item => item.productId !== parseInt(req.params.productId));
        await cart.save();
        res.json({ success: true, cart });
    } catch (err) {
        console.error("Remove from cart error:", err);
        res.status(500).json({ success: false, msg: "Error removing item" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
