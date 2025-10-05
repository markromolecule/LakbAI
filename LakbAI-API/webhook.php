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
error_log('🔍 Xendit webhook received: ' . json_encode($webhookData));

// Log the description specifically for passenger ID debugging
if (isset($webhookData['description'])) {
    error_log('🔍 Webhook description: ' . $webhookData['description']);
}

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
        // Extract trip data from payment information
        $tripData = extractTripDataFromPayment($webhookData);
        
        // Log the extracted trip data for debugging
        error_log('🔍 Extracted trip data: ' . json_encode($tripData));
        
        // Handle successful payment
        $stmt = $pdo->prepare("
            INSERT INTO driver_earnings (
                driver_id, 
                trip_id, 
                passenger_id, 
                original_fare, 
                final_fare, 
                discount_amount, 
                amount, 
                counts_as_trip,
                payment_method, 
                pickup_location, 
                destination, 
                transaction_date, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'xendit', ?, ?, CURDATE(), NOW())
            ON DUPLICATE KEY UPDATE
                amount = VALUES(amount),
                final_fare = VALUES(final_fare),
                discount_amount = VALUES(discount_amount),
                updated_at = NOW()
        ");
        
        $stmt->execute([
            $tripData['driver_id'] ?? 'unknown', // driver_id
            $externalId,      // trip_id
            $tripData['passenger_id'] ?? 'unknown', // passenger_id
            $tripData['original_fare'] ?? $amount, // original_fare
            $amount,          // final_fare
            $tripData['discount_amount'] ?? 0, // discount_amount
            $amount,          // amount
            1,                // counts_as_trip
            $tripData['pickup_location'] ?? 'Unknown', // pickup_location
            $tripData['destination'] ?? 'Unknown', // destination
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

/**
 * Extract trip data from payment information
 */
function extractTripDataFromPayment($data) {
    // Try to extract from description or custom data
    $description = $data['description'] ?? '';
    
    // Parse description for trip information
    // Format: "LakbAI Jeepney Ride | Passenger: ID | Driver: Name | Jeepney: Number | Route: A → B"
    $tripData = [
        'driver_id' => null,
        'passenger_id' => null,
        'pickup_location' => null,
        'destination' => null,
        'original_fare' => null,
        'discount_amount' => 0
    ];
    
    // Extract passenger ID from description
    if (preg_match('/Passenger: ([^|]+)/', $description, $matches)) {
        $tripData['passenger_id'] = trim($matches[1]);
    }
    
    // Extract driver information from description
    if (preg_match('/Driver: ([^|]+)/', $description, $matches)) {
        // Try to get driver ID from driver name (this would need a database lookup in real implementation)
        $driverName = trim($matches[1]);
        // For now, we'll use a placeholder - in real implementation, you'd look up the driver ID
        $tripData['driver_id'] = 'driver_placeholder';
    }
    
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
?>
