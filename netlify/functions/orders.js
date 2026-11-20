import nodemailer from "nodemailer";
import { connectToDatabase, isDbConnected } from "./utils/db.js";
import Order from "./models/Order.js";

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export async function handler(event, context) {
    if (context) context.callbackWaitsForEmptyEventLoop = false;
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    try {
        await connectToDatabase();
    } catch (e) {
        console.warn("DB connection error in orders:", e.message);
    }

    // 1. GET /api/orders
    if (event.httpMethod === "GET") {
        try {
            if (isDbConnected()) {
                const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ success: true, orders })
                };
            }
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: true, orders: [] })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: err.message })
            };
        }
    }

    // 2. POST /api/orders
    if (event.httpMethod === "POST") {
        try {
            let body = {};
            try {
                body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
            } catch (e) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ success: false, message: "Invalid JSON" })
                };
            }

            const customer = body.customer || {};
            const rawItems = body.items || body.products || [];
            const total = Number(body.total) || 0;
            const orderId = body.id || body.orderId || ("BM-" + Date.now().toString().slice(-6));
            const transactionId = body.transactionId || ("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
            const paymentMethod = body.paymentMethod || "Online";
            const paymentStatus = body.paymentStatus || "Paid";
            const status = body.status || "Order Confirmed";

            const items = rawItems.map(item => ({
                productId: item.productId || item.id || null,
                name: item.name || "Product",
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1,
                image: item.image || "image/fruit.jpg"
            }));

            let savedOrder = null;
            if (isDbConnected()) {
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
            }

            // Email Invoice Notification (best-effort)
            const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
            const rawPass = process.env.EMAIL_PASS || "";
            const emailPass = rawPass.replace(/\s+/g, "").trim();

            if (emailPass && emailPass !== "your_16_character_app_password_here" && emailPass.length >= 8) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: { user: emailUser, pass: emailPass }
                    });

                    await transporter.sendMail({
                        from: `"B Market Orders" <${emailUser}>`,
                        to: customer.email || emailUser,
                        subject: `B Market Order Confirmation - #${orderId}`,
                        text: `Thank you for your order #${orderId}! Total: ₹${total}. Delivery will arrive in 24-48 hours.`
                    });
                } catch (emErr) {
                    console.warn("Order email notice:", emErr.message);
                }
            }

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    message: "Order placed successfully!",
                    order: savedOrder || { orderId, total, status, items }
                })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: err.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Method Not Allowed" })
    };
}
