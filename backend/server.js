import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import ragRoutes from "./routes/rag.js";
import enquiryRoutes from "./routes/enquiry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables (.env in backend or root, ignored by git)
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const app = express();

// ========================================================
// CORS CONFIGURATION FOR NETLIFY & ONLINE HOSTING
// ========================================================
const allowedOrigins = [
    "https://bmrket.netlify.app",
    process.env.FRONTEND_URL,
    process.env.NETLIFY_URL,
    process.env.CLIENT_URL,
    "http://localhost:8080",
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500"
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Explicit production Netlify origin
        if (origin === "https://bmrket.netlify.app") return callback(null, true);

        // Any Netlify deploy preview or production subdomain (*.netlify.app)
        const isNetlifyDomain = /^https:\/\/[a-zA-Z0-9_-]+\.netlify\.app$/.test(origin);
        if (isNetlifyDomain) return callback(null, true);

        // Explicitly allowed origins list
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // In non-production, permit local development IP/host testing
        if (process.env.NODE_ENV !== "production") {
            if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }
        }

        return callback(new Error(`CORS origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Identify potential co-located frontend folders
const frontendPaths = [
    path.resolve(__dirname, ".."),
    path.resolve(__dirname, "../frontend")
];

for (const fPath of frontendPaths) {
    if (fs.existsSync(path.join(fPath, "index.html"))) {
        app.use(express.static(fPath));
        break;
    }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        service: "B Market API",
        status: "online",
        database: mongoose.connection.readyState === 1 ? "connected" : "fallback_memory_catalog",
        cors: "configured for Netlify & Localhost",
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/enquiry", enquiryRoutes);

// Root Route handler
app.get("/", (req, res) => {
    for (const fPath of frontendPaths) {
        const indexPath = path.join(fPath, "index.html");
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    res.json({
        ok: true,
        service: "B Market Backend API",
        status: "online",
        endpoints: {
            health: "/api/health",
            products: "/api/products",
            enquiry: "/api/enquiry",
            enquiryStatus: "/api/enquiry/status",
            orders: "/api/orders",
            auth: "/api/auth"
        }
    });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bmarket";

// Try connecting to MongoDB, but keep server running regardless
async function startServer() {
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
        console.log("✅ MongoDB connected successfully to:", mongoUri);
    } catch (err) {
        console.warn(`⚠️ MongoDB connection unavailable (${err.message}). Running with high-performance JSON & in-memory catalog fallback.`);
    }

    app.listen(port, () => {
        console.log(`🚀 B Market Backend API is LIVE on port ${port} (http://localhost:${port})`);
        console.log(`🌐 Ready for Local Development, Netlify, and Cloud Hosting.`);
    });
}

startServer();
