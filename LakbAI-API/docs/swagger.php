<?php
/**
 * Swagger API Documentation Generator
 * Generates OpenAPI documentation for LakbAI API
 */

require_once __DIR__ . '/../vendor/autoload.php';

use OpenApi\Generator;

// Set content type for JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Generate OpenAPI documentation
    $openapi = Generator::scan([
        __DIR__ . '/../controllers',
        __DIR__ . '/../routes',
        __DIR__ . '/../src',
        __DIR__ . '/api-docs.php' // Main API info file
    ]);

    // Output the JSON
    echo $openapi->toJson();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to generate API documentation',
        'message' => $e->getMessage()
    ]);
}
?>
