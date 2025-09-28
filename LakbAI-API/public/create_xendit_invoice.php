<?php
/**
 * @OA\Post(
 *     path="/public/create_xendit_invoice.php",
 *     tags={"Payments"},
 *     summary="Create Xendit Payment Invoice",
 *     description="Creates a payment invoice using Xendit API for jeepney fare payments",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             @OA\Property(property="amount", type="number", format="float", example=25.50, description="Payment amount in PHP"),
 *             @OA\Property(property="description", type="string", example="LakbAI Jeepney Fare Payment", description="Payment description"),
 *             @OA\Property(property="customerEmail", type="string", format="email", example="passenger@lakbai.com", description="Customer email address"),
 *             @OA\Property(property="customerName", type="string", example="Juan Dela Cruz", description="Customer name"),
 *             @OA\Property(property="jeepneyId", type="string", example="LKB-001", description="Jeepney identifier")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Invoice created successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(property="data", ref="#/components/schemas/XenditInvoice")
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Invalid request parameters",
 *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Xendit API error - fallback response provided",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(property="fallback", type="boolean", example=true),
 *             @OA\Property(property="data", ref="#/components/schemas/XenditInvoice"),
 *             @OA\Property(property="error", type="string", example="Using fallback payment method")
 *         )
 *     )
 * )
 */
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
if (file_exists(__DIR__ . '/../.env')) {
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

// Get Xendit API key from environment
$xenditSecretKey = $_ENV['XENDIT_SECRET_KEY'] ?? 'xnd_development_Y5YimXR4GsJC39yXdDWIEQ203sHWMWyYS8OXHWKAewG0zoaZnZ1rnlIzMUfehse';

// Create Xendit invoice
try {
    $externalId = 'lakbai_' . uniqid() . '_' . time();
    
    $postData = [
        'external_id' => $externalId,
        'amount' => $amount,
        'description' => $description,
        'invoice_duration' => 86400, // 24 hours
        'customer' => [
            'given_names' => $customerName,
            'email' => $customerEmail
        ],
        'customer_notification_preference' => [
            'invoice_created' => ['email'],
            'invoice_reminder' => ['email'],
            'invoice_paid' => ['email']
        ],
        'success_redirect_url' => 'lakbai://payment-success',
        'failure_redirect_url' => 'lakbai://payment-failure',
        'currency' => 'PHP',
        'items' => [
            [
                'name' => 'Jeepney Fare Payment',
                'quantity' => 1,
                'price' => $amount,
                'category' => 'Transportation'
            ]
        ],
        'fees' => [
            [
                'type' => 'ADMIN',
                'value' => 0
            ]
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.xendit.co/v2/invoices');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($xenditSecretKey . ':')
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('cURL Error: ' . $curlError);
    }

    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        throw new Exception('Xendit API Error: ' . ($errorData['message'] ?? 'Unknown error'));
    }

    $invoiceData = json_decode($response, true);
    
    // Return the invoice data
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $invoiceData['id'],
            'external_id' => $invoiceData['external_id'],
            'amount' => $invoiceData['amount'],
            'description' => $invoiceData['description'],
            'invoice_url' => $invoiceData['invoice_url'],
            'status' => $invoiceData['status'],
            'created' => $invoiceData['created'],
            'expiry_date' => $invoiceData['expiry_date']
        ]
    ]);

} catch (Exception $e) {
    // Fallback to mock response if Xendit API fails
    error_log('Xendit API Error: ' . $e->getMessage());
    
    $mockResponse = [
        'success' => false,
        'fallback' => true,
        'data' => [
            'id' => 'invoice_' . uniqid(),
            'external_id' => 'lakbai_' . uniqid(),
            'amount' => $amount,
            'description' => $description,
            'invoice_url' => 'https://checkout-staging.xendit.co/od/lakbai',
            'status' => 'PENDING',
            'created' => date('c')
        ],
        'error' => 'Using fallback payment method: ' . $e->getMessage()
    ];
    
    http_response_code(200);
    echo json_encode($mockResponse);
}