import { connectToDatabase, isDbConnected } from "./utils/db.js";

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export async function handler(event, context) {
    if (context) context.callbackWaitsForEmptyEventLoop = false;
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    let dbState = "disconnected";
    try {
        await connectToDatabase();
        dbState = isDbConnected() ? "connected" : "disconnected";
    } catch (e) {
        dbState = "error: " + e.message;
    }

    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            ok: true,
            service: "B Market Netlify Serverless API",
            status: "online",
            database: dbState,
            timestamp: new Date().toISOString()
        })
    };
}
