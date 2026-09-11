<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $products = [
        [
            "id" => 1,
            "name" => "Fresh Coffee",
            "price" => 250,
            "description" => "Fresh local coffee",
            "image" => "images/coffee.jpg"
        ],
        [
            "id" => 2,
            "name" => "Tamarind",
            "price" => 180,
            "description" => "Fresh quality tamarind",
            "image" => "images/tamarind.jpg"
        ],
        [
            "id" => 3,
            "name" => "Turmeric",
            "price" => 220,
            "description" => "Natural local turmeric",
            "image" => "images/turmeric.jpg"
        ]
    ];

    echo json_encode($products);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);
}

?>