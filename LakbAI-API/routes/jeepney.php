<?php
/**
 * Jeepney Management API - Admin Only
 * CRUD operations for jeepneys
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Admin-ID');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS preflight OK']);
    exit;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load database config + Jeepney model
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../src/models/Jeepney.php';

// Init model
$jeepneyModel = new Jeepney($pdo);

/**
 * Helper: get request body
 */
function getRequestData() {
    $data = json_decode(file_get_contents("php://input"), true);
    return $data ?: $_POST;
}

/**
 * Helper: get ID from URL
 */
function getIdFromPath($entity) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts = explode('/', trim($path, '/'));
    foreach ($parts as $i => $part) {
        if ($part === $entity && isset($parts[$i + 1]) && is_numeric($parts[$i + 1])) {
            return (int)$parts[$i + 1];
        }
    }
    return null;
}

// Route
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts  = explode('/', trim($path, '/'));

    switch ($method) {
        case 'GET':
            if (in_array('jeepneys', $parts)) {
                $id = getIdFromPath('jeepneys');
                if ($id) {
                    $result = $jeepneyModel->getJeepneyById($id);
                } else {
                    $result = $jeepneyModel->getAllJeepneys();
                }
                http_response_code(200);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['status'=>'error','message'=>'Endpoint not found']);
            }
            break;

        case 'POST':
            if (in_array('create', $parts)) {
                $data = getRequestData();
                $result = $jeepneyModel->createJeepney($data);
                http_response_code($result['status']==='success' ? 201 : 400);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['status'=>'error','message'=>'Endpoint not found']);
            }
            break;

        case 'PUT':
            if (in_array('update', $parts)) {
                $id = getIdFromPath('update');
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['status'=>'error','message'=>'Jeepney ID required']);
                    break;
                }
                $data = getRequestData();
                $result = $jeepneyModel->updateJeepney($id, $data);
                http_response_code($result['status']==='success' ? 200 : 400);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['status'=>'error','message'=>'Endpoint not found']);
            }
            break;

        case 'DELETE':
            if (in_array('delete', $parts)) {
                $id = getIdFromPath('delete');
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['status'=>'error','message'=>'Jeepney ID required']);
                    break;
                }
                $result = $jeepneyModel->deleteJeepney($id);
                http_response_code($result['status']==='success' ? 200 : 400);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['status'=>'error','message'=>'Endpoint not found']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['status'=>'error','message'=>'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Server error: '.$e->getMessage()]);
}
