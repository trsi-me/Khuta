<?php
require_once '../config.php';
checkRole(['admin']);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id ORDER BY u.name");
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    
    while ($row = $result->fetch_assoc()) {
        unset($row['password']);
        $users[] = $row;
    }
    
    echo json_encode($users);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = sanitize($_POST['role'] ?? '');
    $department_id = !empty($_POST['department_id']) ? intval($_POST['department_id']) : NULL;
    
    if (empty($name) || empty($email) || empty($password) || empty($role)) {
        http_response_code(400);
        echo json_encode(['error' => 'البيانات المطلوبة غير مكتملة']);
        exit();
    }
    
    if (!in_array($role, ['admin', 'committee_head', 'faculty_member', 'department_head'])) {
        http_response_code(400);
        echo json_encode(['error' => 'نوع المستخدم غير صحيح']);
        exit();
    }
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    if ($department_id === NULL) {
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, NULL)");
        $stmt->bind_param("ssss", $name, $email, $hashed_password, $role);
    } else {
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssi", $name, $email, $hashed_password, $role, $department_id);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل إضافة المستخدم']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0 || $id == $_SESSION['user_id']) {
        http_response_code(400);
        echo json_encode(['error' => 'لا يمكن حذف المستخدم الحالي']);
        exit();
    }
    
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف المستخدم']);
    }
    
    $stmt->close();
}

$conn->close();
?>

