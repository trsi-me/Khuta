<?php
require_once '../config.php';
checkAuth();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT d.*, COUNT(DISTINCT p.id) as plans_count FROM departments d LEFT JOIN plans p ON d.id = p.department_id GROUP BY d.id ORDER BY d.name");
    $stmt->execute();
    $result = $stmt->get_result();
    $departments = [];
    
    while ($row = $result->fetch_assoc()) {
        $departments[] = $row;
    }
    
    echo json_encode($departments);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkRole(['admin']);
    
    $name = sanitize($_POST['name'] ?? '');
    
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'اسم القسم مطلوب']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO departments (name) VALUES (?)");
    $stmt->bind_param("s", $name);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل إضافة القسم']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkRole(['admin']);
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف القسم غير صحيح']);
        exit();
    }
    
    $stmt = $conn->prepare("DELETE FROM departments WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف القسم']);
    }
    
    $stmt->close();
}

$conn->close();
?>

