<?php
// LakbAI-API/create_xendit_invoice.php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';
if (file_exists(__DIR__ . '/.env')) {
    Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

// Extract data from QR code or direct input
$amount = (float) ($input['amount'] ?? 0);
$description = $input['description'] ?? 'LakbAI Payment';
$customerEmail = $input['customerEmail'] ?? 'passenger@lakbai.com';
$customerName = $input['customerName'] ?? 'LakbAI Passenger';
$jeepneyId = $input['jeepneyId'] ?? 'LKB-001';

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid amount']);
    exit;
}

// For demo purposes, return a mock response with your static link
// Replace this with actual Xendit API call when you have the API key
$mockResponse = [
    'id' => 'invoice_' . uniqid(),
    'external_id' => 'lakbai_' . uniqid(),
    'amount' => $amount,
    'description' => $description,
    'invoice_url' => 'https://checkout-staging.xendit.co/od/lakbai',
    'status' => 'PENDING',
    'created' => date('c')
];

http_response_code(200);
echo json_encode($mockResponse);

