const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");

// Load .env explicitly from backend directory first, then root directory
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth & Customer API
app.use("/api/auth", authRoutes);

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


// Serve frontend static files
const frontendDir = path.resolve(__dirname, "../..");
app.use(express.static(frontendDir));

// Root route
app.get("/", (req, res) => {
    const indexPath = path.join(frontendDir, "index.html");
    if (require("fs").existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.json({ status: "ok", service: "B Market Backend API", root: true });
});

// Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "B Market Backend API" });
});

// ===============================
// EMAIL CONFIGURATION & ENQUIRY API
// ===============================

// Check Email Service Configuration Status (Safe - never exposes password)
app.get("/api/enquiry/status", (req, res) => {
    const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
    const rawPass = process.env.EMAIL_PASS || "";
    const cleanPass = rawPass.replace(/\s+/g, "").trim();
    const isConfigured = Boolean(cleanPass && cleanPass !== "your_16_character_app_password_here" && cleanPass.length >= 8);
    res.json({
        success: true,
        configured: isConfigured,
        recipient: emailUser
    });
});

app.post("/api/enquiry", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Check required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and enquiry message are required."
            });
        }

        const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
        const rawPass = process.env.EMAIL_PASS || "";
        const emailPass = rawPass.replace(/\s+/g, "").trim();

        // Check if pass key / app password is set
        if (!emailPass || emailPass === "your_16_character_app_password_here" || emailPass === "") {
            console.warn("⚠️ Enquiry received but EMAIL_PASS is not configured in .env yet.");
            return res.status(400).json({
                success: false,
                message: "Email service is not configured yet. Please configure EMAIL_PASS in the backend .env file."
            });
        }

        // Configure Gmail Transporter with the user's App Password
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        const submissionDate = new Date().toLocaleString();

        // Email options
        const mailOptions = {
            from: `"B Market" <${emailUser}>`,
            to: emailUser,
            replyTo: email,
            subject: `New B Market Enquiry from ${name}`,
            text: `
New B Market Customer Enquiry

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}

---
Submitted at: ${submissionDate}
Reply directly to this email to contact ${name} (${email}).
            `,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <div style="background-color: #2e7d32; color: #ffffff; padding: 22px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">B Market — New Customer Enquiry</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Fresh Farm Products Directly from Farmers</p>
    </div>
    <div style="padding: 26px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #333333; margin-top: 0; margin-bottom: 20px;">
            You have received a new enquiry from your website contact form:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; width: 130px; color: #555555;">Customer Name:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Email:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">
                    <a href="mailto:${email}" style="color: #2e7d32; text-decoration: none; font-weight: 500;">${email}</a>
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Phone:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">${phone || "Not provided"}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Time:</td>
                <td style="padding: 10px 0; color: #777777; font-size: 13px;">${submissionDate}</td>
            </tr>
        </table>
        <div style="padding: 16px 20px; background-color: #f7faf7; border-left: 4px solid #2e7d32; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #2e7d32; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
            <p style="margin: 0; color: #333333; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #666666; background: #e8f5e9; padding: 10px 14px; border-radius: 6px;">
            💡 <strong>Quick Reply:</strong> Click "Reply" in your email client to email <strong>${name}</strong> directly at <a href="mailto:${email}" style="color: #2e7d32;">${email}</a>.
        </p>
    </div>
    <div style="background-color: #f5f5f5; padding: 14px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;">
        © 2026 B Market. All Rights Reserved.
    </div>
</div>
            `
        };

        // Send email via Gmail SMTP
        await transporter.sendMail(mailOptions);

        console.log(`✅ Enquiry successfully delivered to ${emailUser} from ${email}`);

        res.json({
            success: true,
            message: "Enquiry sent successfully! We will get back to you soon."
        });

    } catch (error) {
        console.error("❌ Email sending error:", error);

        let errorMessage = "Failed to send enquiry.";
        if (error.code === "EAUTH") {
            errorMessage = "Gmail authentication failed. Please verify that your Google App Password in .env is correct.";
        }

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});


// ===============================
// ORDERS & PAYMENT CONFIRMATION API
// ===============================

const Order = require("./models/order");
let orders = [];

app.get("/api/orders", async (req, res) => {
    try {
        const dbOrders = await Order.find().sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, orders: dbOrders });
    } catch (err) {
        res.json({ success: true, orders: orders });
    }
});

app.post("/api/orders", async (req, res) => {
    try {
        const orderData = req.body;
        const customer = orderData.customer || {};
        const items = orderData.items || orderData.products || [];
        const total = orderData.total || 0;
        const orderId = orderData.id || orderData.orderId || ("BM-" + Date.now().toString().slice(-6));
        const transactionId = orderData.transactionId || ("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
        const paymentMethod = orderData.paymentMethod || "Online";
        const paymentStatus = orderData.paymentStatus || "Paid";

        console.log(`📦 Processing Order #${orderId} (₹${total}) via ${paymentMethod}`);

        // Save to Database
        let savedOrder = null;
        try {
            savedOrder = await Order.create({
                orderId: orderId,
                transactionId: transactionId,
                customer: {
                    name: customer.name || "Customer",
                    mobile: customer.mobile || "",
                    email: customer.email || "",
                    address: customer.address || "",
                    city: customer.city || "",
                    pincode: customer.pincode || ""
                },
                items: items,
                total: total,
                paymentMethod: paymentMethod,
                paymentStatus: paymentStatus,
                status: "Order Confirmed",
                date: new Date()
            });
        } catch (dbErr) {
            console.warn("MongoDB order save notice (falling back to memory):", dbErr.message);
        }

        const responseOrder = savedOrder ? savedOrder.toObject() : {
            ...orderData,
            orderId: orderId,
            transactionId: transactionId,
            paymentStatus: paymentStatus
        };
        orders.unshift(responseOrder);

        // Send Email Confirmation to Store Owner & Customer
        const emailUser = process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com";
        const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "").trim() : "";

        if (emailPass && emailPass !== "your_16_character_app_password_here") {
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: emailUser,
                        pass: emailPass
                    }
                });

                const itemsRowsHtml = items.map(item => `
                    <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 10px; color: #333333;"><strong>${item.name}</strong></td>
                        <td style="padding: 10px; text-align: center; color: #555555;">${item.quantity || 1}</td>
                        <td style="padding: 10px; text-align: right; color: #555555;">₹${item.price}</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold; color: #2e7d32;">₹${(item.price * (item.quantity || 1))}</td>
                    </tr>
                `).join("");

                const orderMailOptions = {
                    from: `"B Market Orders" <${emailUser}>`,
                    to: customer.email ? `${emailUser}, ${customer.email}` : emailUser,
                    subject: `🛍️ New Order Confirmed #${orderId} - ₹${total} [${paymentMethod}]`,
                    html: `
<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #2e7d32; color: #ffffff; padding: 25px; text-align: center;">
        <h2 style="margin: 0; font-size: 26px;">B Market — Order Confirmation</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Fresh Farm Products Directly from Farmers</p>
    </div>
    <div style="padding: 28px; background-color: #ffffff;">
        <div style="background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 6px; padding: 15px 20px; margin-bottom: 22px;">
            <h3 style="margin: 0 0 6px 0; color: #2e7d32; font-size: 18px;">✅ Payment & Order Confirmed!</h3>
            <p style="margin: 0; color: #333333; font-size: 14px;">Order ID: <strong>#${orderId}</strong> &nbsp;|&nbsp; Txn: <strong>${transactionId}</strong> &nbsp;|&nbsp; Payment: <strong>${paymentMethod} (${paymentStatus})</strong></p>
        </div>

        <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 12px; font-size: 17px; border-bottom: 2px solid #2e7d32; padding-bottom: 6px;">Customer & Delivery Address</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${customer.name || "N/A"}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${customer.mobile || "N/A"}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${customer.email || "N/A"}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${customer.address || ""}, ${customer.city || ""} - ${customer.pincode || ""}</p>

        <h3 style="color: #2e7d32; margin-top: 25px; margin-bottom: 12px; font-size: 17px; border-bottom: 2px solid #2e7d32; padding-bottom: 6px;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
                    <th style="padding: 10px; text-align: left; font-size: 13px; color: #555555;">Product</th>
                    <th style="padding: 10px; text-align: center; font-size: 13px; color: #555555;">Qty</th>
                    <th style="padding: 10px; text-align: right; font-size: 13px; color: #555555;">Price</th>
                    <th style="padding: 10px; text-align: right; font-size: 13px; color: #555555;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRowsHtml}
            </tbody>
            <tfoot>
                <tr style="border-top: 2px solid #2e7d32;">
                    <td colspan="3" style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: bold; color: #333333;">Total Paid:</td>
                    <td style="padding: 12px 10px; text-align: right; font-size: 20px; font-weight: bold; color: #2e7d32;">₹${total}</td>
                </tr>
            </tfoot>
        </table>

        <p style="font-size: 13px; color: #777777; margin-top: 20px; text-align: center;">
            Fresh products will be packed and dispatched for delivery within 24-48 hours. Thank you for shopping with B Market!
        </p>
    </div>
    <div style="background-color: #f5f5f5; padding: 14px; text-align: center; font-size: 12px; color: #888888;">
        © 2026 B Market. All Rights Reserved.
    </div>
</div>
                    `
                };

                // Asynchronously deliver email without blocking HTTP response
                transporter.sendMail(orderMailOptions).then(() => {
                    console.log(`✅ Order confirmation email delivered for #${orderId} to ${emailUser}`);
                }).catch(mailErr => {
                    console.error("Order email error:", mailErr.message);
                });
            } catch (err) {
                console.error("Email setup error for order:", err.message);
            }
        }

        res.json({
            success: true,
            message: "Order placed successfully! Confirmation email has been sent.",
            order: responseOrder
        });

    } catch (error) {
        console.error("Order processing error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process order",
            error: error.message
        });
    }
});


// ===============================
// START SERVER
// ===============================

app.listen(5000, () => {
    console.log(
        "B Market backend server is running on http://localhost:5000"
    );
});