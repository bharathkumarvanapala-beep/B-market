const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true },
        transactionId: { type: String },
        customer: {
            name: { type: String, required: true },
            mobile: { type: String, required: true },
            email: { type: String },
            address: { type: String },
            city: { type: String },
            pincode: { type: String }
        },
        items: [
            {
                name: String,
                price: Number,
                quantity: Number,
                image: String
            }
        ],
        total: { type: Number, required: true },
        paymentMethod: { type: String, default: "Online" },
        paymentStatus: { type: String, default: "Paid" },
        status: { type: String, default: "Order Placed" },
        date: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);