<?php
/**
 * Xendit Webhook Endpoint
 * Handles payment notifications from Xendit
 */

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Callback-Token');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';
if (file_exists(__DIR__ . '/../.env')) {
    Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();
}

// Load database connection
require_once __DIR__ . '/../config/db.php';

// Verify webhook token
$webhookToken = $_ENV['XENDIT_WEBHOOK_VERIFICATION_TOKEN'] ?? '';
$receivedToken = $_SERVER['HTTP_X_CALLBACK_TOKEN'] ?? '';

if (empty($webhookToken) || $receivedToken !== $webhookToken) {
    error_log('Xendit webhook: Invalid or missing verification token');
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
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

// Log webhook data for debugging
error_log('Xendit webhook received: ' . json_encode($webhookData));

try {
    // Process different webhook events
    $eventType = $webhookData['event'] ?? 'invoice';
    
    switch ($eventType) {
        case 'invoice.paid':
            handleInvoicePaid($webhookData, $pdo);
            break;
        case 'invoice.expired':
            handleInvoiceExpired($webhookData, $pdo);
            break;
        case 'invoice.failed':
            handleInvoiceFailed($webhookData, $pdo);
            break;
        default:
            handleGenericInvoiceEvent($webhookData, $pdo);
            break;
    }
    
    // Send success response
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Webhook processed successfully']);

} catch (Exception $e) {
    error_log('Xendit webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Handle successful payment
 */
function handleInvoicePaid($data, $pdo) {
    $externalId = $data['external_id'] ?? '';
    $amount = (float) ($data['amount'] ?? 0);
    $invoiceId = $data['id'] ?? '';
    $status = $data['status'] ?? 'PAID';
    $paidAt = $data['paid_at'] ?? date('Y-m-d H:i:s');
    
    // Extract trip data from external_id or description
    $tripData = extractTripDataFromPayment($data);
    
    // Update earnings table
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'xendit', ?, ?, CURDATE(), NOW(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            payment_status = VALUES(payment_status),
            paid_at = VALUES(paid_at),
            xendit_invoice_id = VALUES(xendit_invoice_id)
    ");
    
    $stmt->execute([
        $tripData['driver_id'] ?? 'unknown',
        $externalId,
        $tripData['passenger_id'] ?? 'unknown',
        $tripData['original_fare'] ?? $amount,
        $amount,
        $tripData['discount_amount'] ?? 0,
        $amount,
        1, // counts_as_trip
        $tripData['pickup_location'] ?? 'Unknown',
        $tripData['destination'] ?? 'Unknown',
        $invoiceId,
        $status,
        $paidAt
    ]);
    
    // Send notification to driver and passenger
    sendPaymentNotification($tripData, 'paid', $amount);
    
    error_log("Payment processed successfully: $externalId - $amount");
}

/**
 * Handle expired invoice
 */
function handleInvoiceExpired($data, $pdo) {
    $externalId = $data['external_id'] ?? '';
    $invoiceId = $data['id'] ?? '';
    
    // Update payment status
    $stmt = $pdo->prepare("
        UPDATE earnings 
        SET payment_status = 'EXPIRED', 
            updated_at = NOW() 
        WHERE trip_id = ? OR xendit_invoice_id = ?
    ");
    $stmt->execute([$externalId, $invoiceId]);
    
    error_log("Invoice expired: $externalId");
}

/**
 * Handle failed payment
 */
function handleInvoiceFailed($data, $pdo) {
    $externalId = $data['external_id'] ?? '';
    $invoiceId = $data['id'] ?? '';
    
    // Update payment status
    $stmt = $pdo->prepare("
        UPDATE earnings 
        SET payment_status = 'FAILED', 
            updated_at = NOW() 
        WHERE trip_id = ? OR xendit_invoice_id = ?
    ");
    $stmt->execute([$externalId, $invoiceId]);
    
    error_log("Payment failed: $externalId");
}

/**
 * Handle generic invoice events
 */
function handleGenericInvoiceEvent($data, $pdo) {
    $status = $data['status'] ?? '';
    $externalId = $data['external_id'] ?? '';
    
    if ($status === 'PAID') {
        handleInvoicePaid($data, $pdo);
    } elseif ($status === 'EXPIRED') {
        handleInvoiceExpired($data, $pdo);
    } elseif ($status === 'FAILED') {
        handleInvoiceFailed($data, $pdo);
    }
    
    error_log("Generic invoice event processed: $externalId - Status: $status");
}

/**
 * Extract trip data from payment information
 */
function extractTripDataFromPayment($data) {
    // Try to extract from description or custom data
    $description = $data['description'] ?? '';
    
    // Parse description for trip information
    // Format: "LakbAI Jeepney Ride | Driver: Name | Jeepney: Number | Route: A → B"
    $tripData = [
        'driver_id' => null,
        'passenger_id' => null,
        'pickup_location' => null,
        'destination' => null,
        'original_fare' => null,
        'discount_amount' => 0
    ];
    
    // Extract route information from description
    if (preg_match('/Route: (.+?) → (.+?)(?:\s*\||$)/', $description, $matches)) {
        $tripData['pickup_location'] = trim($matches[1]);
        $tripData['destination'] = trim($matches[2]);
    }
    
    // Extract original fare and discount
    if (preg_match('/Original: ₱([0-9.]+)/', $description, $matches)) {
        $tripData['original_fare'] = (float) $matches[1];
    }
    
    if (preg_match('/Discount: ₱([0-9.]+)/', $description, $matches)) {
        $tripData['discount_amount'] = (float) $matches[1];
    }
    
    return $tripData;
}

/**
 * Send payment notification to relevant parties
 */
function sendPaymentNotification($tripData, $status, $amount) {
    // This would integrate with your notification system
    // For now, just log the notification
    error_log("Payment notification: Status: $status, Amount: $amount");
    
    // TODO: Implement push notifications
    // TODO: Implement email notifications
    // TODO: Update real-time dashboard
}
?>
