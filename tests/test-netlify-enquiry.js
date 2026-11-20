import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { handler } from "./netlify/functions/enquiry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "backend/.env") });
dotenv.config();

async function testNetlifyEnquiryFunction() {
    console.log("====================================================");
    console.log("🧪 TESTING NETLIFY SERVERLESS ENQUIRY FUNCTION LOCALLY");
    console.log("====================================================\n");

    // TEST 1: Status check (GET /status)
    console.log("1. Testing GET /status...");
    const statusEvent = {
        httpMethod: "GET",
        path: "/.netlify/functions/enquiry/status"
    };
    const statusRes = await handler(statusEvent, {});
    console.log("   Status code:", statusRes.statusCode);
    const statusBody = JSON.parse(statusRes.body);
    console.log("   Response:", statusBody);
    if (statusRes.statusCode !== 200 || statusBody.database !== "connected") {
        throw new Error("Status check failed or database not connected");
    }
    console.log("   ✅ Status check passed. Database connected.\n");

    // TEST 2: Validation check (POST empty payload)
    console.log("2. Testing POST validation failure...");
    const badEvent = {
        httpMethod: "POST",
        path: "/.netlify/functions/enquiry",
        body: JSON.stringify({ name: "A", email: "notanemail", message: "hi" })
    };
    const badRes = await handler(badEvent, {});
    console.log("   Status code:", badRes.statusCode);
    console.log("   Response:", JSON.parse(badRes.body));
    if (badRes.statusCode !== 400) {
        throw new Error("Validation failure test failed: expected 400, got " + badRes.statusCode);
    }
    console.log("   ✅ Validation properly rejected bad input (HTTP 400).\n");

    // TEST 3: Successful submission (POST valid enquiry)
    console.log("3. Testing POST valid enquiry...");
    const testTimestamp = Date.now();
    const testEmail = `farmer_enquiry_${testTimestamp}@example.com`;
    const validEvent = {
        httpMethod: "POST",
        path: "/.netlify/functions/enquiry",
        headers: {
            "x-forwarded-for": "157.48.21.90",
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
        },
        body: JSON.stringify({
            name: "Vanapala Bharath Kumar",
            email: testEmail,
            phone: "+91 7981850491",
            message: "Need 100 kgs of pure organic forest honey directly from Paderu tribal growers."
        })
    };

    const postRes = await handler(validEvent, {});
    console.log("   Status code:", postRes.statusCode);
    const postBody = JSON.parse(postRes.body);
    console.log("   Response:", postBody);

    if (postRes.statusCode !== 201 || !postBody.enquiryId) {
        throw new Error("Expected 201 with enquiryId, got " + postRes.statusCode);
    }
    const createdId = postBody.enquiryId;
    console.log(`   ✅ Netlify Function returned HTTP 201 with enquiryId: ${createdId}\n`);

    // TEST 4: Direct MongoDB Verification (Checking actual database persistence)
    console.log("4. Direct MongoDB Persistence Verification (NOT relying solely on HTTP 200/201)...");
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bmarket";
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(mongoUri);
    }

    const Enquiry = mongoose.models.Enquiry;
    const dbRecord = await Enquiry.findById(createdId);
    console.log("   Retrieved document from MongoDB:");
    console.log({
        _id: dbRecord._id.toString(),
        name: dbRecord.name,
        email: dbRecord.email,
        phone: dbRecord.phone,
        message: dbRecord.message,
        status: dbRecord.status,
        ipAddress: dbRecord.ipAddress,
        userAgent: dbRecord.userAgent,
        createdAt: dbRecord.createdAt
    });

    if (!dbRecord) {
        throw new Error("CRITICAL: Document was NOT found in MongoDB!");
    }
    if (dbRecord.email !== testEmail) {
        throw new Error("Data mismatch in MongoDB document!");
    }
    console.log("   ✅ Confirmed: Document is genuinely persisted in MongoDB!\n");

    // TEST 5: GET /api/enquiry list verification
    console.log("5. Testing GET /api/enquiry list...");
    const listEvent = {
        httpMethod: "GET",
        path: "/.netlify/functions/enquiry"
    };
    const listRes = await handler(listEvent, {});
    const listBody = JSON.parse(listRes.body);
    console.log(`   Retrieved ${listBody.count} enquiries from MongoDB.`);
    const found = listBody.enquiries.find(e => e._id === createdId);
    if (!found) {
        throw new Error("Created enquiry was not found in GET list query");
    }
    console.log("   ✅ Confirmed: Created enquiry appears in GET enquiries list query.\n");

    console.log("====================================================");
    console.log("🎉 ALL NETLIFY ENQUIRY FUNCTION TESTS PASSED!");
    console.log("====================================================");

    await mongoose.disconnect();
}

testNetlifyEnquiryFunction().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
