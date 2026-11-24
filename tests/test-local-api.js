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

async function testLocal() {
    console.log("==================================================");
    console.log("Testing Local Backend Enquiry (Port 5000)...");
    const enqRes = await postJson("/api/enquiry", {
        name: "Vanapala Bharath Kumar",
        email: "bharathkumarvanapala@gmail.com",
        phone: "7981850491",
        message: "Direct Farmer Enquiry via Local Backend"
    });
    console.log("Enquiry Status:", enqRes.status);
    console.log("Enquiry Response:", enqRes.body);

    console.log("\n==================================================");
    console.log("Testing Local Customer Login (Port 5000)...");
    const loginRes = await postJson("/api/auth/login", {
        email: "bharathkumarvanapala@gmail.com",
        password: "testPassword123"
    });
    console.log("Login Status:", loginRes.status);
    console.log("Login Response:", loginRes.body);
}

testLocal();
