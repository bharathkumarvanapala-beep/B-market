import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to load master products seed data
function getMasterSeedData() {
    try {
        const seedPath = path.join(__dirname, "../data/masterProducts.json");
        if (fs.existsSync(seedPath)) {
            const raw = fs.readFileSync(seedPath, "utf8");
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("Error reading masterProducts.json:", e.message);
    }
    return [];
}

// In-memory runtime cache for fallback / live modifications
let runtimeProducts = getMasterSeedData();

// Check if mongoose is connected
function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

// GET /api/products - Get all products with filtering & search
router.get("/", async (req, res) => {
    try {
        const { category, source, search } = req.query;
        let products = [];

        if (isDbConnected()) {
            const q = { active: { $ne: false } };
            if (category && category !== "all") {
                q.category = category.toLowerCase();
            }
            if (source && source !== "all") {
                q.source = source.toLowerCase();
            }

            products = await Product.find(q).sort({ createdAt: -1 });

            // Auto-seed if database is empty
            if (products.length === 0 && (!category || category === "all") && (!source || source === "all")) {
                const seed = getMasterSeedData();
                if (seed.length > 0) {
                    console.log(`🌱 Auto-seeding ${seed.length} products to database...`);
                    try {
                        await Product.insertMany(seed);
                        products = await Product.find(q).sort({ createdAt: -1 });
                    } catch (seedErr) {
                        console.warn("Seeding notice:", seedErr.message);
                    }
                }
            }
        }

        // If DB returned nothing or DB is offline, use masterProducts
        if (!products || products.length === 0) {
            products = runtimeProducts.slice();
            if (category && category !== "all") {
                products = products.filter(p => (p.category || "").toLowerCase() === category.toLowerCase());
            }
            if (source && source !== "all") {
                products = products.filter(p => (p.source || "").toLowerCase() === source.toLowerCase());
            }
        }

        // Apply text search
        if (search && search.trim() !== "") {
            const s = search.toLowerCase().trim();
            products = products.filter(p =>
                (p.name && p.name.toLowerCase().includes(s)) ||
                (p.description && p.description.toLowerCase().includes(s)) ||
                (p.category && p.category.toLowerCase().includes(s)) ||
                (p.source && p.source.toLowerCase().includes(s))
            );
        }

        res.json(products);
    } catch (e) {
        console.error("Products API error:", e.message);
        // Resilient fallback
        let list = runtimeProducts.slice();
        if (req.query.category && req.query.category !== "all") {
            list = list.filter(p => (p.category || "").toLowerCase() === req.query.category.toLowerCase());
        }
        res.json(list);
    }
});

// GET /api/products/:id - Single product details
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        let product = null;

        if (isDbConnected()) {
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                product = await Product.findById(id);
            }
            if (!product) {
                product = await Product.findOne({ name: new RegExp(id, "i") });
            }
        }

        if (!product) {
            const idLower = id.toLowerCase();
            product = runtimeProducts.find(p =>
                (p._id && p._id.toString() === id) ||
                (p.id && p.id.toString() === id) ||
                (p.name && p.name.toLowerCase().includes(idLower)) ||
                (p.category && p.category.toLowerCase() === idLower) ||
                (p.affiliateUrl && p.affiliateUrl.toLowerCase().includes(idLower))
            );
        }

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json(product);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/products - Create product
router.post("/", async (req, res) => {
    try {
        const prodData = { ...req.body, active: true };
        let createdProduct = null;

        if (isDbConnected()) {
            createdProduct = await Product.create(prodData);
        } else {
            createdProduct = {
                _id: "prod-" + Date.now(),
                ...prodData,
                createdAt: new Date().toISOString()
            };
        }

        runtimeProducts.unshift(createdProduct);
        res.status(201).json({ success: true, product: createdProduct });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
