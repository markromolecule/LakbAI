<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/SearchController.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$searchController = new SearchController($pdo);

// Parse the path correctly - we need to get the part after 'search'
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim($requestUri, '/'));

// Find the 'search' index and get the next part
$searchIndex = array_search('search', $pathParts);
$searchType = null;

if ($searchIndex !== false && isset($pathParts[$searchIndex + 1])) {
    $searchType = $pathParts[$searchIndex + 1];
    // Remove query parameters from searchType
    $searchType = explode('?', $searchType)[0];
}

$method = $_SERVER['REQUEST_METHOD'];

// Debug logging
error_log("Search API Debug - REQUEST_URI: " . $requestUri);
error_log("Search API Debug - pathParts: " . print_r($pathParts, true));
error_log("Search API Debug - searchIndex: " . $searchIndex);
error_log("Search API Debug - searchType: " . $searchType);

// Expected paths:
// /search/routes?q=query
// /search/fares?q=query
// /search/checkpoints?q=query
// /search/all?q=query

if ($searchType) {
    $query = $_GET['q'] ?? '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

    if (empty($query)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Search query is required'
        ]);
        exit;
    }

    switch ($searchType) {
        case 'routes':
            $result = $searchController->searchRoutes($query, $limit);
            break;
            
        case 'fares':
        case 'fare-matrix':
            $result = $searchController->searchFareMatrix($query, $limit);
            break;
            
        case 'checkpoints':
            $result = $searchController->searchCheckpoints($query, $limit);
            break;
            
        case 'all':
            $result = $searchController->searchAll($query, $limit);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid search type'
            ]);
            exit;
    }

    echo json_encode($result);
    exit;
}

// If no specific search type, return available endpoints
http_response_code(404);
echo json_encode([
    'status' => 'error',
    'message' => 'Search endpoint not found',
    'available_endpoints' => [
        'GET /search/routes?q=query' => 'Search routes',
        'GET /search/fares?q=query' => 'Search fare matrix',
        'GET /search/checkpoints?q=query' => 'Search checkpoints',
        'GET /search/all?q=query' => 'Search all types'
    ]
]);
?>
