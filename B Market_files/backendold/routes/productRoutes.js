const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let products = await Product.find();

        // Add products automatically if database is empty
        if (products.length === 0) {

            products = await Product.insertMany([
                {
                    name: "Fresh Fruits",
                    price: 120,
                    description: "Seasonal fresh fruits",
                    image: "image/fruit.jpg"
                },
                {
                    name: "Fresh Vegetables",
                    price: 60,
                    description: "Healthy green vegetables",
                    image: "image/vfrt.webp"
                },
                {
                    name: "Quality Grains",
                    price: 60,
                    description: "Rice, wheat and other grains",
                    image: "image/image.b.webp"
                },
                {
                    name: "Black Pepper",
                    price: 120,
                    description: "Natural and aromatic pepper",
                    image: "image/image.f.webp"
                },
                {
                    name: "Fresh Coffee",
                    price: 60,
                    description: "Fresh coffee beans",
                    image: "image/image.e.webp"
                },
                {
                    name: "Organic Tamarind",
                    price: 70,
                    description: "Natural and tasty tamarind",
                    image: "image/image.d.jpg"
                }
            ]);
        }

        res.json(products);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;