<?php
require_once '../config.php';
checkAuth();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $department_id = intval($_GET['department_id'] ?? 0);
    
    if ($_SESSION['role'] === 'admin') {
        if ($department_id > 0) {
            $stmt = $conn->prepare("SELECT * FROM plans WHERE department_id = ? ORDER BY created_at DESC");
            $stmt->bind_param("i", $department_id);
        } else {
            $stmt = $conn->prepare("SELECT * FROM plans ORDER BY created_at DESC");
        }
    } else {
        if ($_SESSION['department_id']) {
            $stmt = $conn->prepare("SELECT * FROM plans WHERE department_id = ? ORDER BY created_at DESC");
            $stmt->bind_param("i", $_SESSION['department_id']);
        } else {
            echo json_encode([]);
            exit();
        }
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $plans = [];
    
    while ($row = $result->fetch_assoc()) {
        $plans[] = $row;
    }
    
    echo json_encode($plans);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkRole(['admin', 'committee_head']);
    
    $department_id = intval($_POST['department_id'] ?? 0);
    $title = sanitize($_POST['title'] ?? '');
    
    if ($_SESSION['role'] === 'committee_head') {
        $department_id = $_SESSION['department_id'];
    }
    
    if (empty($title) || $department_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'البيانات المطلوبة غير مكتملة']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO plans (department_id, title) VALUES (?, ?)");
    $stmt->bind_param("is", $department_id, $title);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل إضافة الخطة']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkRole(['admin', 'committee_head']);
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف الخطة غير صحيح']);
        exit();
    }
    
    if ($_SESSION['role'] === 'committee_head') {
        $stmt = $conn->prepare("DELETE FROM plans WHERE id = ? AND department_id = ?");
        $stmt->bind_param("ii", $id, $_SESSION['department_id']);
    } else {
        $stmt = $conn->prepare("DELETE FROM plans WHERE id = ?");
        $stmt->bind_param("i", $id);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف الخطة']);
    }
    
    $stmt->close();
}

$conn->close();
?>

