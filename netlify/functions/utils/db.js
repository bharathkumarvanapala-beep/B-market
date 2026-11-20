import mongoose from "mongoose";

let cachedDbPromise = null;

function resolveMongoUri() {
    let raw =
        process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.DATABASE_URL ||
        process.env.MONGODB_URL ||
        process.env.MONGO_URL ||
        process.env.MONGODB_ATLAS_URI ||
        process.env.ATLAS_URI;

    if (!raw || typeof raw !== "string") return null;

    raw = raw.trim();

    // 1. Remove leading export or assignment if user pasted 'MONGODB_URI=...'
    raw = raw.replace(/^(export\s+)?([A-Za-z0-9_]+)\s*=\s*/i, "");

    // 2. Remove mongosh invocation if copied from Atlas connect wizard
    raw = raw.replace(/^mongosh\s+['"]?/i, "");

    // 3. Remove surrounding quotes
    raw = raw.replace(/^['"]|['"]$/g, "").trim();

    // 4. Normalize scheme slashes (e.g. mongodb:/ or mongodb+srv:/ with missing slash)
    raw = raw.replace(/^mongodb\+srv:\/([^\/])/i, "mongodb+srv://$1");
    raw = raw.replace(/^mongodb:\/([^\/])/i, "mongodb://$1");

    // 5. If missing scheme entirely
    if (!raw.startsWith("mongodb://") && !raw.startsWith("mongodb+srv://")) {
        if (raw.includes("mongodb.net") || raw.includes("+srv")) {
            raw = "mongodb+srv://" + raw.replace(/^(\+srv:\/\/|srv:\/\/)/i, "");
        } else if (raw.includes("@") || raw.includes(":27017")) {
            raw = "mongodb://" + raw;
        }
    }

    return raw;
}

/**
 * Returns safe diagnostic metadata about the configured database
 * without exposing sensitive credentials or passwords.
 */
export function getSanitizedDbInfo() {
    const raw = resolveMongoUri();

    if (!raw) {
        return {
            configured: false,
            type: "MISSING",
            message: "No MongoDB connection string found in Netlify Environment Variables.",
            checkedVariables: [
                "MONGODB_URI",
                "MONGO_URI",
                "DATABASE_URL",
                "MONGODB_URL",
                "MONGO_URL",
                "MONGODB_ATLAS_URI",
                "ATLAS_URI"
            ]
        };
    }

    const isAtlas = raw.startsWith("mongodb+srv://") || raw.includes("mongodb.net");
    const isLocal = raw.includes("127.0.0.1") || raw.includes("localhost");
    const hostMatch = raw.match(/@([^/?#]+)/);
    const host = hostMatch ? hostMatch[1] : (isLocal ? "localhost:27017" : "custom_host");
    const pathPart = raw.replace(/^mongodb(\+srv)?:\/\/[^/]+/, "");
    const hasExplicitDb = /\/[a-zA-Z0-9_-]+(\?|$)/.test(pathPart);

    // Safe sanitized preview: strips credentials between // and @
    let safePreview = raw;
    if (safePreview.includes("@")) {
        safePreview = safePreview.replace(/:\/\/[^@]+@/, "://***:***@");
    } else {
        safePreview = safePreview.slice(0, 15) + "...";
    }

    return {
        configured: true,
        type: isAtlas ? "MongoDB Atlas (Cloud)" : (isLocal ? "Localhost (Invalid for Cloud)" : "MongoDB"),
        host: host,
        hasExplicitDatabaseName: hasExplicitDb,
        targetDatabase: hasExplicitDb ? "from_uri" : "bmarket",
        formatPreview: safePreview
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

    // 2. Read environment variable (supports standard aliases and sanitizes quotes)
    const mongoUri = resolveMongoUri();

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
        const pathPart = mongoUri.replace(/^mongodb(\+srv)?:\/\/[^/]+/, "");
        const hasExplicitDb = /\/[a-zA-Z0-9_-]+(\?|$)/.test(pathPart);

        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000
        };

        // If connection string does not specify a db name, route to bmarket
        if (!hasExplicitDb) {
            opts.dbName = "bmarket";
        }

        const hostMatch = mongoUri.match(/@([^/?#]+)/);
        const maskedHost = hostMatch ? hostMatch[1] : "mongodb_cluster";
        console.log(`Connecting to cloud database at ${maskedHost} (db: ${opts.dbName || "from_uri"})...`);

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

