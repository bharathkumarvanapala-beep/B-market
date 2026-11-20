import https from "https";

function makeRequest(url, method = "GET", postData = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            headers: {
                "Accept": "application/json",
                "User-Agent": "BMarket-Production-Verifier/1.0"
            }
        };

        if (postData) {
            const dataStr = JSON.stringify(postData);
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(dataStr);
        }

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {
                    parsed = body;
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on("error", err => reject(err));

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function run() {
    console.log("==================================================");
    console.log("1. TESTING GET /.netlify/functions/enquiry/status");
    console.log("==================================================");
    try {
        const resStatus = await makeRequest("https://bmrket.netlify.app/.netlify/functions/enquiry/status");
        console.log("HTTP Status:", resStatus.statusCode);
        console.log("Body:", JSON.stringify(resStatus.body, null, 2));
    } catch (e) {
        console.error("GET Status Failed:", e.message);
    }

    console.log("\n==================================================");
    console.log("2. TESTING POST /.netlify/functions/enquiry");
    console.log("==================================================");
    try {
        const payload = {
            name: "Bharath Kumar Live Verification",
            email: "bharathkumarvanapala@gmail.com",
            phone: "+91 7981850491",
            message: "Production verification test enquiry from automated verifier."
        };
        const resPost = await makeRequest("https://bmrket.netlify.app/.netlify/functions/enquiry", "POST", payload);
        console.log("HTTP Status:", resPost.statusCode);
        console.log("Body:", JSON.stringify(resPost.body, null, 2));
    } catch (e) {
        console.error("POST Enquiry Failed:", e.message);
    }

    console.log("\n==================================================");
    console.log("3. TESTING GET /.netlify/functions/health");
    console.log("==================================================");
    try {
        const resHealth = await makeRequest("https://bmrket.netlify.app/.netlify/functions/health");
        console.log("HTTP Status:", resHealth.statusCode);
        console.log("Body:", JSON.stringify(resHealth.body, null, 2));
    } catch (e) {
        console.error("GET Health Failed:", e.message);
    }
}

run();
