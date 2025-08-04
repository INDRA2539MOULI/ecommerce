const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true, minlength: 6 }
});

const UserModel = mongoose.model("User", UserSchema);

const CartItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    title: String,
    price: Number,
    thumbnail: String
});

const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [CartItemSchema],
    createdAt: { type: Date, default: Date.now }
});

const CartModel = mongoose.model("Cart", CartSchema);

module.exports = { CartModel, UserModel };