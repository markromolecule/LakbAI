<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../bootstrap/app.php';
require_once __DIR__ . '/../controllers/JeepneyController.php';

$database = $app->get("Database");
$controller = new JeepneyController($database);

$method = $_SERVER["REQUEST_METHOD"];
$id = $_GET["id"] ?? null;

switch ($method) {
    case "GET":
        if ($id) {
            $result = $controller->getJeepneyById($id);
        } else {
            $result = $controller->getAllJeepneys();
        }
        echo json_encode($result);
        break;

    case "POST":
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            echo json_encode(["status" => "error", "message" => "Invalid input"]);
            exit;
        }
        $result = $controller->createJeepney($data);
        echo json_encode($result);
        break;

    case "PUT":
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "ID required"]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $controller->updateJeepney($id, $data);
        echo json_encode($result);
        break;

    case "DELETE":
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "ID required"]);
            exit;
        }
        $result = $controller->deleteJeepney($id);
        echo json_encode($result);
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
