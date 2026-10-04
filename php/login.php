<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$email = sanitize($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'يرجى إدخال البريد الإلكتروني وكلمة المرور']);
    exit();
}

$stmt = $conn->prepare("SELECT id, name, email, password, role, department_id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة']);
    exit();
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة']);
    exit();
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['department_id'] = $user['department_id'];

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'department_id' => $user['department_id']
    ]
]);

$stmt->close();
$conn->close();
?>

