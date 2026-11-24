import nodemailer from "nodemailer";

async function testGmail() {
    console.log("Testing Gmail sending with configured credentials...");
    const emailUser = "bharathkumarvanapala@gmail.com";
    const emailPass = "oiufzihvumlfcsen";

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    try {
        console.log("Verifying transporter connection to smtp.gmail.com...");
        await transporter.verify();
        console.log("✅ Transporter verified successfully!");

        console.log("Sending test email to:", emailUser);
        const info = await transporter.sendMail({
            from: `"B Market Test" <${emailUser}>`,
            to: emailUser,
            subject: "B Market — Email Notification System Test",
            text: "This is a test to verify that enquiries arrive in your mobile Gmail inbox as before!"
        });
        console.log("✅ Email sent successfully! Message ID:", info.messageId);
    } catch (err) {
        console.error("❌ Email test failed:", err.message);
    }
}

testGmail();
