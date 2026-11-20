import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "bmarket_jwt_secret_dev_key_2026_secure";

export async function protect(req, res, next) {
    try {
        const h = req.headers.authorization;
        if (!h?.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Login required" });
        }
        const payload = jwt.verify(h.slice(7), JWT_SECRET);
        try {
            req.user = await User.findById(payload.id).select("-password");
        } catch (dbErr) {
            // DB might be offline or user might be in-memory
        }
        if (!req.user) {
            req.user = { _id: payload.id, id: payload.id };
        }
        next();
    } catch (e) {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}
