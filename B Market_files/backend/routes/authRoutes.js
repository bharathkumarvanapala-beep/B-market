const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

// Helper to hash password with salt
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

// Helper to verify password
function verifyPassword(password, storedPassword) {
    if (!storedPassword || !storedPassword.includes(":")) return false;
    const [salt, originalHash] = storedPassword.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
}

// ==========================================
// POST /api/auth/register
// Customer Registration & Profile Creation
// ==========================================
router.post("/register", async (req, res) => {
    try {
        const { name, email, mobile, password, address, city, pincode } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, mobile, and password are required."
            });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanMobile = mobile.toString().trim();

        // Check for existing user with same email or mobile
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists. Please login instead."
            });
        }

        const existingMobile = await User.findOne({ mobile: cleanMobile });
        if (existingMobile) {
            return res.status(409).json({
                success: false,
                message: "An account with this mobile number already exists. Please login instead."
            });
        }

        const passwordHash = hashPassword(password);

        const newUser = await User.create({
            name: name.trim(),
            email: cleanEmail,
            mobile: cleanMobile,
            passwordHash: passwordHash,
            address: (address || "").trim(),
            city: (city || "").trim(),
            pincode: (pincode || "").trim()
        });

        console.log(`👤 New Customer Registered: ${newUser.name} (${newUser.email})`);

        res.status(201).json({
            success: true,
            message: "Account created successfully! Welcome to B Market.",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                address: newUser.address,
                city: newUser.city,
                pincode: newUser.pincode
            }
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create account",
            error: err.message
        });
    }
});

// ==========================================
// POST /api/auth/login
// Customer Login & Verification
// ==========================================
router.post("/login", async (req, res) => {
    try {
        const identifier = (req.body.email || req.body.identifier || req.body.mobile || "").trim();
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Email / mobile number and password are required."
            });
        }

        // Allow login by email or 10-digit mobile number
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { mobile: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "No account found matching this email or mobile number."
            });
        }

        const isMatch = verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password. Please check your credentials and try again."
            });
        }

        console.log(`✅ Customer Logged In: ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                city: user.city,
                pincode: user.pincode
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to login",
            error: err.message
        });
    }
});

// ==========================================
// GET /api/auth/profile/:id
// Get customer profile with saved addresses
// ==========================================
router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// PUT /api/auth/profile/:id
// Update customer profile & default delivery info
// ==========================================
router.put("/profile/:id", async (req, res) => {
    try {
        const { name, mobile, address, city, pincode } = req.body;
        const updates = {};
        if (name) updates.name = name.trim();
        if (mobile) updates.mobile = mobile.trim();
        if (address !== undefined) updates.address = address.trim();
        if (city !== undefined) updates.city = city.trim();
        if (pincode !== undefined) updates.pincode = pincode.trim();

        const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
        res.json({ success: true, message: "Profile updated successfully", user: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
