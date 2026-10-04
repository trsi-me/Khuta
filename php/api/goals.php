<?php
require_once '../config.php';
checkAuth();

header('Content-Type: application/json; charset=utf-8');

function updatePlanProgress($conn, $plan_id) {
    $stmt = $conn->prepare("SELECT AVG(progress) as avg_progress FROM goals WHERE plan_id = ?");
    $stmt->bind_param("i", $plan_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $progress = $row['avg_progress'] ?? 0;
    $stmt->close();
    
    $stmt = $conn->prepare("UPDATE plans SET progress = ? WHERE id = ?");
    $stmt->bind_param("di", $progress, $plan_id);
    $stmt->execute();
    $stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $plan_id = intval($_GET['plan_id'] ?? 0);
    
    if ($plan_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف الخطة مطلوب']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT * FROM goals WHERE plan_id = ? ORDER BY created_at ASC");
    $stmt->bind_param("i", $plan_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $goals = [];
    
    while ($row = $result->fetch_assoc()) {
        $goals[] = $row;
    }
    
    echo json_encode($goals);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkRole(['admin', 'committee_head']);
    
    $plan_id = intval($_POST['plan_id'] ?? 0);
    $title = sanitize($_POST['title'] ?? '');
    
    if (empty($title) || $plan_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'البيانات المطلوبة غير مكتملة']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO goals (plan_id, title) VALUES (?, ?)");
    $stmt->bind_param("is", $plan_id, $title);
    
    if ($stmt->execute()) {
        updatePlanProgress($conn, $plan_id);
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل إضافة الهدف']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkRole(['admin', 'committee_head']);
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف الهدف غير صحيح']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT plan_id FROM goals WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'الهدف غير موجود']);
        exit();
    }
    
    $goal = $result->fetch_assoc();
    $plan_id = $goal['plan_id'];
    $stmt->close();
    
    $stmt = $conn->prepare("DELETE FROM goals WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        updatePlanProgress($conn, $plan_id);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف الهدف']);
    }
    
    $stmt->close();
}

$conn->close();
?>

