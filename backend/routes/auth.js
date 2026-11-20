import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();
const runtimeUsers = [];

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

const JWT_SECRET = process.env.JWT_SECRET || "bmarket_jwt_secret_dev_key_2026_secure";

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

async function verifyPassword(password, storedPassword) {
    if (!storedPassword) return false;
    if (typeof storedPassword === "string" && storedPassword.includes(":")) {
        const [salt, originalHash] = storedPassword.split(":");
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
        return hash === originalHash;
    }
    try {
        return await bcrypt.compare(password, storedPassword);
    } catch (e) {
        return false;
    }
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, mobile, password, address, city, pincode } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanMobile = (mobile || "").toString().trim();

        if (isDbConnected()) {
            const existingEmail = await User.findOne({ email: cleanEmail });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists. Please login."
                });
            }
            if (cleanMobile) {
                const existingMobile = await User.findOne({ mobile: cleanMobile });
                if (existingMobile) {
                    return res.status(409).json({
                        success: false,
                        message: "An account with this mobile number already exists. Please login."
                    });
                }
            }
        } else {
            const existing = runtimeUsers.find(u => u.email === cleanEmail || (cleanMobile && u.mobile === cleanMobile));
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email or mobile already exists. Please login."
                });
            }
        }

        const pHash = hashPassword(password);
        let userObj = null;

        if (isDbConnected()) {
            const u = await User.create({
                name: name.trim(),
                email: cleanEmail,
                mobile: cleanMobile,
                password: pHash,
                passwordHash: pHash,
                address: (address || "").trim(),
                city: (city || "").trim(),
                pincode: (pincode || "").trim(),
                role: "customer"
            });
            userObj = {
                id: u._id,
                name: u.name,
                email: u.email,
                mobile: u.mobile,
                address: u.address,
                city: u.city,
                pincode: u.pincode,
                role: u.role
            };
        } else {
            userObj = {
                id: "usr-" + Date.now(),
                name: name.trim(),
                email: cleanEmail,
                mobile: cleanMobile,
                password: pHash,
                passwordHash: pHash,
                address: (address || "").trim(),
                city: (city || "").trim(),
                pincode: (pincode || "").trim(),
                role: "customer"
            };
            runtimeUsers.push(userObj);
        }

        const token = jwt.sign({ id: userObj.id }, JWT_SECRET, { expiresIn: "30d" });

        console.log(`👤 New Customer Registered: ${userObj.name} (${userObj.email})`);

        res.status(201).json({
            success: true,
            message: "Account created successfully! Welcome to B Market.",
            token,
            user: userObj
        });
    } catch (e) {
        console.error("Register error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/auth/login
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

        let user = null;

        if (isDbConnected()) {
            user = await User.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { mobile: identifier }
                ]
            });
        } else {
            user = runtimeUsers.find(u =>
                u.email.toLowerCase() === identifier.toLowerCase() ||
                u.mobile === identifier
            );
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "No account found matching this email or mobile number."
            });
        }

        const storedPassword = user.passwordHash || user.password;
        const isMatch = await verifyPassword(password, storedPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password. Please check your credentials and try again."
            });
        }

        const userObj = {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            address: user.address,
            city: user.city,
            pincode: user.pincode,
            role: user.role || "customer"
        };

        const token = jwt.sign({ id: userObj.id }, JWT_SECRET, { expiresIn: "30d" });

        console.log(`✅ Customer Logged In: ${userObj.name} (${userObj.email})`);

        res.json({
            success: true,
            message: `Welcome back, ${userObj.name}!`,
            token,
            user: userObj
        });
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
    res.json({ success: true, user: req.user });
});

// GET /api/auth/profile/:id
router.get("/profile/:id", async (req, res) => {
    try {
        if (isDbConnected()) {
            const user = await User.findById(req.params.id).select("-password -passwordHash");
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            return res.json({ success: true, user });
        }
        const user = runtimeUsers.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const { password, passwordHash, ...clean } = user;
        res.json({ success: true, user: clean });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
