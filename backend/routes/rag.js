import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const faq = [
    { title: "Delivery", text: "B Market delivers fresh produce directly from local farmers to your doorstep in 24-48 hours." },
    { title: "Payment", text: "We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD)." },
    { title: "Freshness Guarantee", text: "Produce is harvested fresh daily without harmful pesticides or chemical preservatives." },
    { title: "Farmer Connection", text: "Farmers receive fair market rates directly without exploitative middleman cuts." }
];

function score(q, text) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
}

function getLocalProducts() {
    try {
        const seedPath = path.join(__dirname, "../data/masterProducts.json");
        if (fs.existsSync(seedPath)) {
            return JSON.parse(fs.readFileSync(seedPath, "utf8"));
        }
    } catch (e) {
        // ignore
    }
    return [];
}

router.post("/ask", async (req, res) => {
    try {
        const question = String(req.body.question || "").trim();
        if (!question) {
            return res.status(400).json({ success: false, message: "Question is required." });
        }

        let products = [];
        if (mongoose.connection.readyState === 1) {
            try {
                products = await Product.find({ active: true }).limit(200);
            } catch (dbErr) {
                products = getLocalProducts();
            }
        } else {
            products = getLocalProducts();
        }

        const docs = [
            ...products.map(p => ({
                title: p.name,
                text: `${p.name}. Category: ${p.category}. ${p.description || ""} Price: ₹${p.price} per ${p.unit || "kg"}. Stock: ${p.stock || 100}.`
            })),
            ...faq
        ];

        const retrieved = docs
            .map(d => ({ ...d, score: score(question, `${d.title} ${d.text}`) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        res.json({
            success: true,
            question,
            answer: `Here is the relevant information from B Market's catalog regarding "${question}".`,
            sources: retrieved
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
