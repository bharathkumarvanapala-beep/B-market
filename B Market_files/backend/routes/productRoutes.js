const express = require("express");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");

const router = express.Router();

// Helper to load master products fallback/seed
function getMasterSeedData() {
    try {
        const p = path.join(__dirname, "../data/masterProducts.json");
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, "utf8"));
        }
    } catch (e) {
        console.error("Error reading masterProducts.json:", e);
    }
    return [];
}

// GET /api/products - Dynamic Products List with filtering & search
router.get("/", async (req, res) => {
    try {
        const { category, source, search } = req.query;
        const query = { active: { $ne: false } };

        if (category && category !== "all") {
            query.category = category.toLowerCase();
        }

        if (source && source !== "all") {
            query.source = source.toLowerCase();
        }

        let products = await Product.find(query).sort({ createdAt: -1 });

        // Auto-seed if database is empty
        if (products.length === 0 && (!category || category === "all") && (!source || source === "all")) {
            const seedData = getMasterSeedData();
            if (seedData.length > 0) {
                console.log(`Auto-seeding ${seedData.length} products to empty database...`);
                await Product.insertMany(seedData);
                products = await Product.find(query).sort({ createdAt: -1 });
            }
        }

        // Apply text search if requested
        if (search && search.trim() !== "") {
            const q = search.toLowerCase().trim();
            products = products.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q)) ||
                (p.source && p.source.toLowerCase().includes(q))
            );
        }

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to in-memory/file if DB is down
        const seedData = getMasterSeedData();
        let fallbackList = seedData;
        if (req.query.category && req.query.category !== "all") {
            fallbackList = fallbackList.filter(p => p.category === req.query.category);
        }
        if (req.query.source && req.query.source !== "all") {
            fallbackList = fallbackList.filter(p => p.source === req.query.source);
        }
        res.json(fallbackList);
    }
});

// GET /api/products/:id - Single product details
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let product = null;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        }

        if (!product) {
            // Find by name match or fallback data
            const seedData = getMasterSeedData();
            product = seedData.find(p =>
                p.name.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(id.toLowerCase()) ||
                (p.affiliateUrl && p.affiliateUrl.includes(id))
            );
        }

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/products - Dynamically add a new product
router.post("/", async (req, res) => {
    try {
        const {
            name,
            price,
            category = "fruits",
            source = "bmarket",
            originalPrice = 0,
            unit = "kg",
            rating = 4.8,
            reviews = 1,
            badge = "",
            image,
            fallbackImage = "image/fruit.jpg",
            description = "",
            affiliateUrl = "",
            stock = 100
        } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ success: false, message: "Product name and price are required." });
        }

        const newProduct = await Product.create({
            name,
            price: Number(price),
            category: category.toLowerCase(),
            source: source.toLowerCase(),
            originalPrice: Number(originalPrice) || Number(price),
            unit,
            rating: Number(rating) || 4.8,
            reviews: Number(reviews) || 10,
            badge: badge || (source === "bmarket" ? "🌿 Local Farm" : source === "amazon" ? "📦 Amazon's Choice" : "⚡ Flipkart Assured"),
            image: image || fallbackImage,
            fallbackImage,
            description,
            affiliateUrl: affiliateUrl || (source === "bmarket" ? `product-details.html?product=${encodeURIComponent(name)}` : ""),
            stock: Number(stock) || 100,
            active: true
        });

        res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/products/seed - Reset / seed all master products
router.post("/seed", async (req, res) => {
    try {
        const seedData = getMasterSeedData();
        await Product.deleteMany({});
        const inserted = await Product.insertMany(seedData);
        res.json({ success: true, count: inserted.length, message: "Products successfully seeded into database" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;