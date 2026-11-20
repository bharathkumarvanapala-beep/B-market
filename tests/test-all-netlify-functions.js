import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import assert from "assert";

import { handler as healthHandler } from "../netlify/functions/health.js";
import { handler as productsHandler } from "../netlify/functions/products.js";
import { handler as enquiryHandler } from "../netlify/functions/enquiry.js";
import { handler as authHandler } from "../netlify/functions/auth.js";
import { handler as ordersHandler } from "../netlify/functions/orders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });
dotenv.config();

async function testAllNetlifyFunctions() {
    console.log("====================================================");
    console.log("🧪 TESTING ALL NETLIFY SERVERLESS FUNCTIONS");
    console.log("====================================================\n");

    const timestamp = Date.now();
    const testEmail = `user_${timestamp}@example.com`;
    const testMobile = "9" + Math.floor(100000000 + Math.random() * 900000000);

    // 1. Health
    console.log("1. Health Check Function...");
    const healthRes = await healthHandler({ httpMethod: "GET", path: "/.netlify/functions/health" }, {});
    assert.strictEqual(healthRes.statusCode, 200);
    console.log("   ✅ Health Function: OK (Database:", JSON.parse(healthRes.body).database, ")");

    // 2. Products
    console.log("\n2. Products Function...");
    const prodsRes = await productsHandler({ httpMethod: "GET", path: "/.netlify/functions/products", queryStringParameters: {} }, {});
    assert.strictEqual(prodsRes.statusCode, 200);
    const prods = JSON.parse(prodsRes.body);
    console.log(`   ✅ Products Function: Returned ${prods.length} items`);
    assert(prods.length > 0, "Products should not be empty");

    // 3. User Registration
    console.log("\n3. Auth Function (Register)...");
    const regRes = await authHandler({
        httpMethod: "POST",
        path: "/.netlify/functions/auth/register",
        body: JSON.stringify({
            name: "Bharath Fast Test",
            email: testEmail,
            mobile: testMobile,
            password: "Password@123",
            address: "Paderu Market Road",
            city: "Paderu",
            pincode: "531024"
        })
    }, {});
    assert.strictEqual(regRes.statusCode, 201);
    const regData = JSON.parse(regRes.body);
    console.log("   ✅ Auth Register: OK (Token issued:", Boolean(regData.token), ")");

    // 4. User Login
    console.log("\n4. Auth Function (Login)...");
    const loginRes = await authHandler({
        httpMethod: "POST",
        path: "/.netlify/functions/auth/login",
        body: JSON.stringify({
            email: testEmail,
            password: "Password@123"
        })
    }, {});
    assert.strictEqual(loginRes.statusCode, 200);
    console.log("   ✅ Auth Login: OK (Welcome:", JSON.parse(loginRes.body).user.name, ")");

    // 5. Enquiry Submission & Storage
    console.log("\n5. Enquiry Function (Submit & Store)...");
    const enqRes = await enquiryHandler({
        httpMethod: "POST",
        path: "/.netlify/functions/enquiry",
        body: JSON.stringify({
            name: "Bharath Fast Buyer",
            email: testEmail,
            phone: testMobile,
            message: "Urgent order for 25kg Araku Coffee"
        })
    }, {});
    assert.strictEqual(enqRes.statusCode, 201);
    const enqData = JSON.parse(enqRes.body);
    console.log("   ✅ Enquiry Function: Stored in MongoDB! (ID:", enqData.enquiryId, ")");

    // 6. Orders Creation
    console.log("\n6. Orders Function (Place Order)...");
    const orderRes = await ordersHandler({
        httpMethod: "POST",
        path: "/.netlify/functions/orders",
        body: JSON.stringify({
            id: `BM-TEST-${timestamp.toString().slice(-4)}`,
            customer: {
                name: "Bharath Fast Buyer",
                email: testEmail,
                mobile: testMobile,
                address: "Paderu Road",
                city: "Paderu",
                pincode: "531024"
            },
            items: [
                { name: prods[0].name, price: prods[0].price, quantity: 2, image: prods[0].image }
            ],
            total: prods[0].price * 2,
            paymentMethod: "UPI",
            paymentStatus: "Paid"
        })
    }, {});
    assert.strictEqual(orderRes.statusCode, 201);
    console.log("   ✅ Orders Function: Stored Order! (#:", JSON.parse(orderRes.body).order.orderId, ")");

    // 7. Orders Listing
    console.log("\n7. Orders Function (List Orders)...");
    const ordersListRes = await ordersHandler({ httpMethod: "GET", path: "/.netlify/functions/orders" }, {});
    assert.strictEqual(ordersListRes.statusCode, 200);
    console.log("   ✅ Orders Listing: Retrieved", JSON.parse(ordersListRes.body).orders.length, "orders");

    console.log("\n====================================================");
    console.log("🎉 ALL 5 NETLIFY FUNCTIONS TESTED & WORKING PERFECTLY!");
    console.log("====================================================");

    await mongoose.disconnect();
}

testAllNetlifyFunctions().catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
