import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase, isDbConnected } from "./utils/db.js";
import User from "./models/User.js";

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function generateToken(user) {
    const secret = process.env.JWT_SECRET || "bmarket_default_secret_2026";
    return jwt.sign(
        {
            id: user._id || user.id,
            email: user.email,
            role: user.role || "customer"
        },
        secret,
        { expiresIn: "30d" }
    );
}

export async function handler(event, context) {
    if (context) context.callbackWaitsForEmptyEventLoop = false;
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    const pathPart = (event.path || "").toLowerCase();

    try {
        await connectToDatabase();
    } catch (e) {
        console.warn("DB connection error in auth:", e.message);
    }

    let body = {};
    try {
        body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
    } catch (e) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, message: "Invalid JSON body" })
        };
    }

    // POST /api/auth/register
    if (pathPart.endsWith("/register") && event.httpMethod === "POST") {
        const { name, email, mobile, password, address, city, pincode } = body;
        if (!name || !email || !password) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: "Name, email and password are required." })
            };
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanMobile = (mobile || "").toString().trim();

        try {
            if (isDbConnected()) {
                const existing = await User.findOne({
                    $or: [
                        { email: cleanEmail },
                        cleanMobile ? { mobile: cleanMobile } : null
                    ].filter(Boolean)
                });

                if (existing) {
                    return {
                        statusCode: 409,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({
                            success: false,
                            message: "An account with this email or mobile number already exists."
                        })
                    };
                }

                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);

                const newUser = await User.create({
                    name: name.trim(),
                    email: cleanEmail,
                    mobile: cleanMobile,
                    passwordHash,
                    address: address || "",
                    city: city || "",
                    pincode: pincode || "",
                    role: "customer"
                });

                const token = generateToken(newUser);
                return {
                    statusCode: 201,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        message: "Registration successful!",
                        token,
                        user: {
                            id: newUser._id,
                            name: newUser.name,
                            email: newUser.email,
                            mobile: newUser.mobile,
                            address: newUser.address,
                            city: newUser.city,
                            pincode: newUser.pincode
                        }
                    })
                };
            }

            return {
                statusCode: 503,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: "Database temporarily unavailable." })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: err.message })
            };
        }
    }

    // POST /api/auth/login
    if (pathPart.endsWith("/login") && event.httpMethod === "POST") {
        const { email, password } = body;
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: "Email and password are required." })
            };
        }

        const cleanInput = email.toLowerCase().trim();

        try {
            if (isDbConnected()) {
                const user = await User.findOne({
                    $or: [
                        { email: cleanInput },
                        { mobile: cleanInput }
                    ]
                });

                if (!user) {
                    return {
                        statusCode: 401,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ success: false, message: "Invalid email or password." })
                    };
                }

                const match = await bcrypt.compare(password, user.passwordHash || user.password || "");
                if (!match) {
                    return {
                        statusCode: 401,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ success: false, message: "Invalid email or password." })
                    };
                }

                const token = generateToken(user);
                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        message: "Login successful!",
                        token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            mobile: user.mobile,
                            address: user.address,
                            city: user.city,
                            pincode: user.pincode
                        }
                    })
                };
            }

            return {
                statusCode: 503,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: "Database temporarily unavailable." })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: false, message: err.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Method Not Allowed" })
    };
}
