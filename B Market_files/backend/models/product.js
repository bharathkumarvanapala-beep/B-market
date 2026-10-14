const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: { type: String, required: true, default: "fruits" },
        source: {
            type: String,
            default: "bmarket",
            enum: ["bmarket", "amazon", "flipkart"]
        },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, default: 0 },
        unit: { type: String, default: "kg" },
        rating: { type: Number, default: 4.8 },
        reviews: { type: Number, default: 100 },
        badge: { type: String, default: "" },
        image: { type: String, required: true },
        fallbackImage: { type: String, default: "image/fruit.jpg" },
        description: { type: String, default: "" },
        affiliateUrl: { type: String, default: "" },
        stock: { type: Number, default: 100, min: 0 },
        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Index for fast search and filtering
productSchema.index({ category: 1, source: 1, active: 1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
