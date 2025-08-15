
<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$auth = new AuthController($conn);

// 1️ Get POST body (form-data or x-www-form-urlencoded)
$input = $_POST;

// 2️ If POST body is empty, try reading JSON payload
if (empty($input)) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// 3️ Check if 'action' exists
if (!empty($input) && isset($input['action'])) {

    $action = strtolower($input['action']); // normalize

    if ($action === 'register') {
        echo json_encode($auth->register($input));
        exit;
    }

    if ($action === 'login') {
        echo json_encode($auth->login($input));
        exit;
    }

    // Invalid action
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid action: ' . $input['action']
    ]);
    exit;
}

// 4️ No action provided
http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'No action provided'
]);
exit;
