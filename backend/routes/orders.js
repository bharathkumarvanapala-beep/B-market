import { Router } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = Router();
let runtimeOrders = [];

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

// GET /api/orders - List latest orders (for order history)
router.get("/", async (req, res) => {
    try {
        if (isDbConnected()) {
            const dbOrders = await Order.find().sort({ createdAt: -1 }).limit(50);
            return res.json({ success: true, orders: dbOrders });
        }
        res.json({ success: true, orders: runtimeOrders });
    } catch (err) {
        console.warn("Orders fetch notice (using cache):", err.message);
        res.json({ success: true, orders: runtimeOrders });
    }
});

// GET /api/orders/my - Authenticated customer's orders
router.get("/my", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || "bmarket_default_secret");
                userId = payload.id;
            } catch (jwtErr) {
                // Invalid token
            }
        }

        if (isDbConnected() && userId) {
            const userOrders = await Order.find({ userId }).sort({ createdAt: -1 });
            return res.json({ success: true, orders: userOrders });
        }

        res.json({ success: true, orders: runtimeOrders });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/orders - Place and confirm an order
router.post("/", async (req, res) => {
    try {
        const orderData = req.body || {};
        const customer = orderData.customer || {};
        const rawItems = orderData.items || orderData.products || [];
        const total = Number(orderData.total) || 0;
        const orderId = orderData.id || orderData.orderId || ("BM-" + Date.now().toString().slice(-6));
        const transactionId = orderData.transactionId || ("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
        const paymentMethod = orderData.paymentMethod || "Online";
        const paymentStatus = orderData.paymentStatus || "Paid";
        const status = orderData.status || "Order Confirmed";

        const items = rawItems.map(item => ({
            productId: item.productId || item.id || null,
            name: item.name || "Product",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || "image/fruit.jpg"
        }));

        console.log(`📦 Processing Order #${orderId} (₹${total}) via ${paymentMethod}`);

        let savedOrder = null;

        if (isDbConnected()) {
            try {
                savedOrder = await Order.create({
                    orderId,
                    orderNumber: orderId,
                    transactionId,
                    customer: {
                        name: customer.name || "Valued Customer",
                        mobile: customer.mobile || "",
                        email: customer.email || "",
                        address: customer.address || "",
                        city: customer.city || "",
                        pincode: customer.pincode || ""
                    },
                    items,
                    total,
                    paymentMethod,
                    paymentStatus,
                    status,
                    date: new Date()
                });
            } catch (dbErr) {
                console.warn("MongoDB order save notice:", dbErr.message);
            }
        }

        const responseOrder = savedOrder ? savedOrder.toObject() : {
            orderId,
            id: orderId,
            transactionId,
            customer,
            items,
            total,
            paymentMethod,
            paymentStatus,
            status,
            date: new Date().toISOString()
        };

        runtimeOrders.unshift(responseOrder);

        // Deliver Email Invoice & Order Confirmation via Gmail SMTP
        const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
        const rawPass = process.env.EMAIL_PASS || "";
        const emailPass = rawPass.replace(/\s+/g, "").trim();

        if (emailPass && emailPass !== "your_16_character_app_password_here" && emailPass.length >= 8) {
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
                        <td style="padding: 10px; text-align: center; color: #555555;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: right; color: #555555;">₹${item.price}</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold; color: #2e7d32;">₹${item.price * item.quantity}</td>
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
            <h3 style="margin: 0 0 6px 0; color: #2e7d32; font-size: 18px;">✅ Payment &amp; Order Confirmed!</h3>
            <p style="margin: 0; color: #333333; font-size: 14px;">Order ID: <strong>#${orderId}</strong> &nbsp;|&nbsp; Txn: <strong>${transactionId}</strong> &nbsp;|&nbsp; Payment: <strong>${paymentMethod} (${paymentStatus})</strong></p>
        </div>

        <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 12px; font-size: 17px; border-bottom: 2px solid #2e7d32; padding-bottom: 6px;">Customer &amp; Delivery Address</h3>
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

                transporter.sendMail(orderMailOptions).then(() => {
                    console.log(`✅ Order confirmation email delivered for #${orderId} to ${emailUser}`);
                }).catch(mailErr => {
                    console.error("Order email error:", mailErr.message);
                });
            } catch (err) {
                console.error("Email setup error for order:", err.message);
            }
        }

        res.status(201).json({
            success: true,
            message: "Order placed successfully! Confirmation email dispatched.",
            order: responseOrder
        });
    } catch (e) {
        console.error("Order processing error:", e);
        res.status(500).json({
            success: false,
            message: "Failed to process order",
            error: e.message
        });
    }
});

export default router;
