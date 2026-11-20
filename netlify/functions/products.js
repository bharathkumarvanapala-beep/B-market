import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectToDatabase, isDbConnected } from "./utils/db.js";
import Product from "./models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function getMasterSeedData() {
    try {
        const seedPath = path.join(__dirname, "data/masterProducts.json");
        if (fs.existsSync(seedPath)) {
            return JSON.parse(fs.readFileSync(seedPath, "utf8"));
        }
    } catch (e) {
        console.warn("Could not read masterProducts.json:", e.message);
    }
    return [];
}

export async function handler(event, context) {
    if (context) context.callbackWaitsForEmptyEventLoop = false;
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    const pathPart = (event.path || "").replace(/.*\/products\/?/, "").toLowerCase();
    const query = event.queryStringParameters || {};

    // 1. GET /categories
    if (pathPart === "categories") {
        const categories = [
            "fruits", "vegetables", "grains", "spices", "coffee", "tamarind", "dairy", "auxiliary"
        ];
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(categories)
        };
    }

    try {
        await connectToDatabase();
    } catch (e) {
        console.warn("DB connection error in products, falling back to seed:", e.message);
    }

    // 2. GET /:id (Single product)
    if (pathPart && pathPart !== "" && pathPart !== "categories") {
        try {
            if (isDbConnected()) {
                const doc = await Product.findOne({
                    $or: [
                        { _id: pathPart.match(/^[0-9a-fA-F]{24}$/) ? pathPart : null },
                        { name: new RegExp(`^${pathPart}$`, "i") }
                    ].filter(Boolean)
                });
                if (doc) {
                    return {
                        statusCode: 200,
                        headers: CORS_HEADERS,
                        body: JSON.stringify(doc)
                    };
                }
            }
        } catch (err) {
            console.warn("Single product lookup error:", err.message);
        }

        const seed = getMasterSeedData();
        const found = seed.find(p =>
            p.name.toLowerCase().includes(pathPart) ||
            p.category.toLowerCase() === pathPart
        );
        if (found) {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify(found)
            };
        }
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: "Product not found" })
        };
    }

    // 3. GET / (All products with filter/search)
    try {
        let products = [];
        const { category, source, search } = query;

        if (isDbConnected()) {
            const q = { active: { $ne: false } };
            if (category && category !== "all") q.category = category.toLowerCase();
            if (source && source !== "all") q.source = source.toLowerCase();

            products = await Product.find(q).sort({ createdAt: -1 });

            // Auto-seed if database is empty
            if (products.length === 0 && (!category || category === "all") && (!source || source === "all")) {
                const seed = getMasterSeedData();
                if (seed.length > 0) {
                    try {
                        await Product.insertMany(seed);
                        products = await Product.find(q).sort({ createdAt: -1 });
                    } catch (sErr) {
                        console.warn("Auto-seed notice:", sErr.message);
                    }
                }
            }
        }

        if (!products || products.length === 0) {
            let seed = getMasterSeedData();
            if (category && category !== "all") {
                seed = seed.filter(p => p.category.toLowerCase() === category.toLowerCase());
            }
            if (source && source !== "all") {
                seed = seed.filter(p => (p.source || "bmarket").toLowerCase() === source.toLowerCase());
            }
            products = seed;
        }

        if (search) {
            const term = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(term) ||
                (p.description && p.description.toLowerCase().includes(term))
            );
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(products)
        };
    } catch (err) {
        console.error("Products error:", err);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: err.message })
        };
    }
}
