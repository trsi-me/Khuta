<?php
session_start();

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'khuta');

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('BASE_URL', 'http://localhost/khuta/');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: ' . BASE_URL . 'pages/login.html');
        exit();
    }
}

function checkRole($allowedRoles) {
    checkAuth();
    if (!in_array($_SESSION['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'غير مصرح لك بهذا الإجراء']);
        exit();
    }
}
?>

