const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Product API
app.use("/api/products", productRoutes);

// Add test product
app.post("/api/add-test-product", async (req, res) => {
    try {
        const Product = require("./models/Product");

        const product = await Product.create({
            name: "Fresh Coffee",
            price: 250,
            description: "Fresh local coffee",
            image: "images/coffee.jpg"
        });

        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/bmarket")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch(error => {
        console.log("MongoDB connection error:", error);
    });


// ===============================
// EMAIL CONFIGURATION
// ===============================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// ===============================
// ENQUIRY API
// ===============================

app.post("/api/enquiry", async (req, res) => {

    try {

        const { name, email, phone, message } = req.body;

        // Check required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                message: "Name, email and message are required"
            });
        }

        // Email that YOU will receive
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,

            replyTo: email,

            subject: `New B Market Enquiry from ${name}`,

            text: `
New B Market Enquiry

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log("New enquiry received:", {
            name,
            email,
            phone,
            message
        });

        res.json({
            success: true,
            message: "Enquiry sent successfully"
        });

    } catch (error) {

        console.log("Email error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send enquiry",
            error: error.message
        });
    }
});


// ===============================
// ORDERS
// ===============================

let orders = [];

app.post("/api/orders", (req, res) => {

    const order = req.body;

    orders.push(order);

    console.log("New Order:", order);

    res.json({
        message: "Order placed successfully",
        order: order
    });
});


// ===============================
// START SERVER
// ===============================

app.listen(5000, () => {
    console.log(
        "B Market backend server is running on http://localhost:5000"
    );
});