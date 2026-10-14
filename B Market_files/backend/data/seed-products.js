const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bmarket";

async function seed() {
    try {
        console.log("Connecting to MongoDB at:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);

        const Product = require("../models/Product");

        const dataPath = path.join(__dirname, "masterProducts.json");
        const productsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

        console.log(`Clearing old products...`);
        await Product.deleteMany({});

        console.log(`Inserting ${productsData.length} master products into MongoDB...`);
        const inserted = await Product.insertMany(productsData);

        console.log(`✅ Successfully seeded ${inserted.length} dynamic products!`);
        console.log(`- B Market Direct products: ${productsData.filter(p => p.source === 'bmarket').length}`);
        console.log(`- Amazon Auxiliary products: ${productsData.filter(p => p.source === 'amazon').length}`);
        console.log(`- Flipkart Auxiliary products: ${productsData.filter(p => p.source === 'flipkart').length}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seed();
