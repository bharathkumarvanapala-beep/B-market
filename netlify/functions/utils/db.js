import mongoose from "mongoose";

let cachedDbPromise = null;

export function getSanitizedDbInfo() {
    const raw = process.env.MONGODB_URI;
    if (!raw) {
        return {
            configured: false,
            type: "MISSING",
            message: "MONGODB_URI is not set in Netlify Environment Variables."
        };
    }
    const isAtlas = raw.startsWith("mongodb+srv://");
    const isLocal = raw.includes("127.0.0.1") || raw.includes("localhost");
    const hostMatch = raw.match(/@([^/?#]+)/);
    const host = hostMatch ? hostMatch[1] : (isLocal ? "localhost:27017" : "custom_host");

    return {
        configured: true,
        type: isAtlas ? "MongoDB Atlas (Cloud)" : (isLocal ? "Localhost (Invalid for Cloud)" : "MongoDB"),
        host: host,
        hasDatabaseName: /\/[a-zA-Z0-9_-]+(\?|$)/.test(raw)
    };
}

export async function connectToDatabase() {
    // If connection is already open, reuse it immediately
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGODB_URI is missing in Netlify. Please add MONGODB_URI under Netlify Site Configuration -> Environment Variables."
        );
    }

    if (mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost")) {
        throw new Error(
            "MONGODB_URI points to 127.0.0.1/localhost. Netlify functions run in cloud and require a cloud MongoDB Atlas connection string (mongodb+srv://...)."
        );
    }

    if (!cachedDbPromise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        };

        cachedDbPromise = mongoose.connect(mongoUri, opts).then(m => {
            console.log("Connected to MongoDB via Netlify Function");
            return m.connection;
        });
    }

    try {
        const conn = await cachedDbPromise;
        return conn;
    } catch (err) {
        cachedDbPromise = null; // Reset promise so next invocation can retry
        let friendlyReason = err.message;
        if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
            friendlyReason = "MongoDB Atlas Authentication Failed: Verify username and password in MONGODB_URI.";
        } else if (err.message.includes("whitelist") || err.name === "MongooseServerSelectionError" || err.message.includes("buffering timed out") || err.message.includes("timed out")) {
            friendlyReason = "MongoDB Atlas Network Block: Add 0.0.0.0/0 to MongoDB Atlas -> Network Access (IP Access List).";
        } else if (err.message.includes("querySrv ENOTFOUND")) {
            friendlyReason = "MongoDB Atlas Host Not Found: Verify cluster address in MONGODB_URI.";
        }
        console.error("MongoDB connection error in Netlify Function:", friendlyReason);
        const detailedError = new Error(friendlyReason);
        detailedError.original = err.message;
        throw detailedError;
    }
}

export function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}
