const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        mobile: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        pincode: { type: String, default: "" },
        role: { type: String, default: "customer" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
