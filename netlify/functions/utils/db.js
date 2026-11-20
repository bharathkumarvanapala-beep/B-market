import mongoose from "mongoose";

let cachedDbPromise = null;

/**
 * Returns safe diagnostic metadata about the configured database
 * without exposing sensitive credentials or passwords.
 */
export function getSanitizedDbInfo() {
    const raw =
        process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.DATABASE_URL ||
        process.env.MONGODB_URL;

    if (!raw) {
        return {
            configured: false,
            type: "MISSING",
            message: "No MongoDB connection string found in Netlify Environment Variables."
        };
    }

    const isAtlas = raw.startsWith("mongodb+srv://") || raw.includes("mongodb.net");
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

/**
 * Connects to MongoDB in a serverless environment.
 * Reuses the cached Mongoose connection across warm invocations.
 * STRICT RULE: Never falls back to localhost (127.0.0.1) in production.
 */
export async function connectToDatabase() {
    // 1. If connection is already open, reuse it immediately
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // 2. Read environment variable (supports standard aliases)
    const mongoUri =
        process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.DATABASE_URL ||
        process.env.MONGODB_URL;

    // 3. STRICT CHECK: Fail immediately if no URI is configured
    // NEVER fall back to 127.0.0.1 in Netlify cloud serverless!
    if (!mongoUri) {
        const missingErr = new Error(
            "MONGODB_URI is not set in Netlify Environment Variables. " +
            "Netlify Functions run in the cloud and cannot connect to localhost. " +
            "Please add MONGODB_URI in Netlify Dashboard -> Site configuration -> Environment variables."
        );
        console.error("❌ Production Configuration Error:", missingErr.message);
        throw missingErr;
    }

    // 4. STRICT CHECK: In Netlify cloud, reject localhost URIs
    const isNetlifyCloud = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.CONTEXT === "production");
    if (isNetlifyCloud && (mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost"))) {
        const localErr = new Error(
            "MONGODB_URI points to 127.0.0.1 / localhost. " +
            "Netlify cloud functions require your cloud MongoDB Atlas connection string (mongodb+srv://...). " +
            "Please update MONGODB_URI in Netlify."
        );
        console.error("❌ Production Configuration Error:", localErr.message);
        throw localErr;
    }

    // 5. Connect to MongoDB Atlas with connection caching
    if (!cachedDbPromise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        };

        const hostMatch = mongoUri.match(/@([^/?#]+)/);
        const maskedHost = hostMatch ? hostMatch[1] : "mongodb_cluster";
        console.log(`Connecting to cloud database at ${maskedHost}...`);

        cachedDbPromise = mongoose.connect(mongoUri, opts).then(m => {
            console.log("✅ Successfully connected to MongoDB Atlas via Netlify Function");
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
            friendlyReason = "MongoDB Atlas Authentication Failed: Check your database username and password in MONGODB_URI.";
        } else if (
            err.message.includes("whitelist") ||
            err.name === "MongooseServerSelectionError" ||
            err.message.includes("buffering timed out") ||
            err.message.includes("timed out")
        ) {
            friendlyReason = "MongoDB Atlas Network Block: Add 0.0.0.0/0 to MongoDB Atlas -> Network Access (IP Access List).";
        } else if (err.message.includes("querySrv ENOTFOUND")) {
            friendlyReason = "MongoDB Atlas Host Not Found: Check the cluster hostname in MONGODB_URI.";
        }

        console.error("❌ MongoDB Atlas connection failed:", friendlyReason);
        const detailedError = new Error(friendlyReason);
        detailedError.original = err.message;
        throw detailedError;
    }
}

export function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}
