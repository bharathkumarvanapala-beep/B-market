<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    // Connect to MySQL
    require "db.php";

    // Only POST allowed
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {

        echo json_encode([
            "success" => false,
            "message" => "Only POST requests are allowed."
        ]);

        exit;
    }


    // Customer details
    $name = trim($_POST["name"] ?? "");
    $mobile = trim($_POST["mobile"] ?? "");
    $email = trim($_POST["email"] ?? "");

    $address = trim($_POST["address"] ?? "");
    $city = trim($_POST["city"] ?? "");
    $pincode = trim($_POST["pincode"] ?? "");


    // Order details
    $items = trim($_POST["items"] ?? "");
    $total = trim($_POST["total"] ?? "");


    // Check required fields
    if (
        $name === "" ||
        $mobile === "" ||
        $email === "" ||
        $address === "" ||
        $city === "" ||
        $pincode === "" ||
        $items === ""
    ) {

        echo json_encode([
            "success" => false,
            "message" => "Please fill in all order details."
        ]);

        exit;
    }


    // Convert total to number
    $total = (float)$total;


    // Insert into orders table
    $sql = "INSERT INTO orders
            (name, mobile, email, address, city, pincode, items, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";


    $stmt = $conn->prepare($sql);


    $stmt->bind_param(
        "sssssssd",
        $name,
        $mobile,
        $email,
        $address,
        $city,
        $pincode,
        $items,
        $total
    );


    // Save order
    $stmt->execute();


    // Success response
    echo json_encode([
        "success" => true,
        "message" => "Order received successfully!"
    ]);


    $stmt->close();
    $conn->close();


} catch (Throwable $e) {

    // Send error as JSON
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);

}

?>