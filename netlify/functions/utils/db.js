import mongoose from "mongoose";

let cachedDbPromise = null;

export async function connectToDatabase() {
    // If connection is already open, reuse it immediately
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/bmarket";

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
        console.error("MongoDB connection error in Netlify Function:", err.message);
        throw err;
    }
}

export function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

