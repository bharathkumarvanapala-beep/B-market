<?php

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $name = htmlspecialchars($_POST["name"] ?? "");
    $email = htmlspecialchars($_POST["email"] ?? "");
    $phone = htmlspecialchars($_POST["phone"] ?? "");
    $message = htmlspecialchars($_POST["message"] ?? "");

    // YOUR B MARKET GMAIL ADDRESS
    $to = "bharathkumarvanapala@gmail.com";

    $subject = "New B Market Enquiry";

    $body = "New enquiry received from B Market website.\n\n";
    $body .= "Customer Name: " . $name . "\n";
    $body .= "Customer Email: " . $email . "\n";
    $body .= "Customer Phone: " . $phone . "\n";
    $body .= "Customer Message: " . $message . "\n";

    // Always send from your B Market Gmail
    $headers = "From: B Market <bharathkumarvanapala@gmail.com>\r\n";
    $headers .= "Reply-To: bharathkumarvanapala@gmail.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    if (mail($to, $subject, $body, $headers)) {

        echo "Enquiry sent successfully!";

    } else {

        echo "Unable to send enquiry.";

    }

} else {

    echo "B Market enquiry backend is working!";

}

?>