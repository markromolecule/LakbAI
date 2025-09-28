<?php
/**
 * Simple Xendit Webhook Endpoint
 * This file handles Xendit webhook notifications directly
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Callback-Token');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS preflight OK']);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load environment variables
require_once __DIR__ . '/vendor/autoload.php';
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

// Verify webhook token
$expectedToken = $_ENV['XENDIT_WEBHOOK_VERIFICATION_TOKEN'] ?? '4yXIKkEUsYm0GQsIiaj4iAUKdy9B2A19I5a4BZVbSaoVc3B7';
$receivedToken = $_SERVER['HTTP_X_CALLBACK_TOKEN'] ?? '';

if (empty($expectedToken) || $receivedToken !== $expectedToken) {
    error_log('Xendit webhook: Invalid verification token. Expected: ' . $expectedToken . ', Received: ' . $receivedToken);
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid verification token']);
    exit;
}

// Get webhook payload
$webhookData = json_decode(file_get_contents('php://input'), true);

if (!$webhookData) {
    error_log('Xendit webhook: Invalid JSON payload');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Log the webhook for debugging
error_log('Xendit webhook received: ' . json_encode($webhookData));

try {
    // Load database connection
    require_once __DIR__ . '/config/db.php';
    
    // Process the webhook
    $eventType = $webhookData['event'] ?? $webhookData['status'] ?? 'unknown';
    $externalId = $webhookData['external_id'] ?? '';
    $amount = (float) ($webhookData['amount'] ?? 0);
    $invoiceId = $webhookData['id'] ?? '';
    $status = $webhookData['status'] ?? 'UNKNOWN';
    
    // Log processing
    error_log("Processing webhook: Event=$eventType, ExternalID=$externalId, Amount=$amount, Status=$status");
    
    if ($eventType === 'invoice.paid' || $status === 'PAID') {
        // Handle successful payment
        $stmt = $pdo->prepare("
            INSERT INTO earnings (
                driver_id, 
                trip_id, 
                passenger_id, 
                original_fare, 
                final_fare, 
                discount_amount, 
                amount_paid, 
                counts_as_trip,
                payment_method, 
                pickup_location, 
                destination, 
                trip_date, 
                created_at,
                xendit_invoice_id,
                payment_status,
                paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'xendit', ?, ?, CURDATE(), NOW(), ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                payment_status = VALUES(payment_status),
                paid_at = VALUES(paid_at),
                xendit_invoice_id = VALUES(xendit_invoice_id)
        ");
        
        $stmt->execute([
            'driver_webhook', // driver_id - placeholder
            $externalId,      // trip_id
            'passenger_webhook', // passenger_id - placeholder
            $amount,          // original_fare
            $amount,          // final_fare
            0,                // discount_amount
            $amount,          // amount_paid
            1,                // counts_as_trip
            'Webhook Location', // pickup_location
            'Webhook Destination', // destination
            $invoiceId,       // xendit_invoice_id
            'PAID',           // payment_status
        ]);
        
        error_log("Payment recorded successfully: $externalId - $amount");
        
    } elseif ($eventType === 'invoice.expired' || $status === 'EXPIRED') {
        // Handle expired invoice
        $stmt = $pdo->prepare("
            UPDATE earnings 
            SET payment_status = 'EXPIRED', updated_at = NOW() 
            WHERE trip_id = ? OR xendit_invoice_id = ?
        ");
        $stmt->execute([$externalId, $invoiceId]);
        
        error_log("Invoice expired: $externalId");
        
    } elseif ($eventType === 'invoice.failed' || $status === 'FAILED') {
        // Handle failed payment
        $stmt = $pdo->prepare("
            UPDATE earnings 
            SET payment_status = 'FAILED', updated_at = NOW() 
            WHERE trip_id = ? OR xendit_invoice_id = ?
        ");
        $stmt->execute([$externalId, $invoiceId]);
        
        error_log("Payment failed: $externalId");
    }
    
    // Send success response
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Webhook processed successfully',
        'event' => $eventType,
        'external_id' => $externalId,
        'amount' => $amount
    ]);

} catch (Exception $e) {
    error_log('Xendit webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
?>
