import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bmarket";

async function seed() {
    try {
        const seedPath = path.join(__dirname, "masterProducts.json");
        const raw = fs.readFileSync(seedPath, "utf8");
        const products = JSON.parse(raw);

        console.log(`Connecting to MongoDB at: ${mongoUri}`);
        await mongoose.connect(mongoUri);

        await Product.deleteMany({});
        await Product.insertMany(products);

        console.log(`✅ Successfully seeded ${products.length} products to database!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

seed();
