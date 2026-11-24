import http from "http";

function postJson(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = http.request({
            hostname: "127.0.0.1",
            port: 5000,
            path: path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
                "Accept": "application/json"
            }
        }, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function testAuthCycle() {
    const timestamp = Date.now().toString().slice(-6);
    const testEmail = `demo_customer_${timestamp}@example.com`;
    const testMobile = `98${timestamp.slice(0, 4)}1234`;
    const testPassword = "SecurePassword2026!";

    console.log("1. Registering customer:", testEmail, "Phone:", testMobile);
    const regRes = await postJson("/api/auth/register", {
        name: "Demo Customer",
        email: testEmail,
        mobile: testMobile,
        password: testPassword,
        address: "Main Road",
        city: "Paderu",
        pincode: "531024"
    });
    console.log("Registration Status:", regRes.status);
    console.log("Registration Success:", regRes.body.success);

    console.log("\n2. Logging in with credentials...");
    const loginRes = await postJson("/api/auth/login", {
        email: testEmail,
        password: testPassword
    });
    console.log("Login Status:", loginRes.status);
    console.log("Login Success:", loginRes.body.success);
    console.log("Customer Token generated:", Boolean(loginRes.body.token));
    console.log("User retrieved from DB:", loginRes.body.user?.name, "(Role:", loginRes.body.user?.role + ")");
}

testAuthCycle();
