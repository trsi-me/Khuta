<?php
require_once '../config.php';
checkAuth();

header('Content-Type: application/json; charset=utf-8');

function updateGoalProgress($conn, $goal_id) {
    $stmt = $conn->prepare("SELECT AVG(progress) as avg_progress FROM activities WHERE goal_id = ?");
    $stmt->bind_param("i", $goal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $progress = $row['avg_progress'] ?? 0;
    $stmt->close();
    
    $stmt = $conn->prepare("UPDATE goals SET progress = ? WHERE id = ?");
    $stmt->bind_param("di", $progress, $goal_id);
    $stmt->execute();
    $stmt->close();
    
    $stmt = $conn->prepare("SELECT plan_id FROM goals WHERE id = ?");
    $stmt->bind_param("i", $goal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $goal = $result->fetch_assoc();
        $plan_id = $goal['plan_id'];
        $stmt->close();
        
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
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $goal_id = intval($_GET['goal_id'] ?? 0);
    
    if ($goal_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف الهدف مطلوب']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT * FROM activities WHERE goal_id = ? ORDER BY deadline ASC");
    $stmt->bind_param("i", $goal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $activities = [];
    
    while ($row = $result->fetch_assoc()) {
        $deadline = new DateTime($row['deadline']);
        $today = new DateTime();
        $days_diff = $today->diff($deadline)->days;
        
        if ($row['progress'] >= 100) {
            $status = 'completed';
            $status_color = 'green';
        } elseif ($deadline < $today) {
            $status = 'overdue';
            $status_color = 'red';
        } elseif ($days_diff <= 7) {
            $status = 'approaching';
            $status_color = 'orange';
        } else {
            $status = 'on_track';
            $status_color = 'green';
        }
        
        $row['status'] = $status;
        $row['status_color'] = $status_color;
        $activities[] = $row;
    }
    
    echo json_encode($activities);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkRole(['admin', 'committee_head']);
    
    $goal_id = intval($_POST['goal_id'] ?? 0);
    $title = sanitize($_POST['title'] ?? '');
    $deadline = sanitize($_POST['deadline'] ?? '');
    
    if (empty($title) || empty($deadline) || $goal_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'البيانات المطلوبة غير مكتملة']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO activities (goal_id, title, deadline) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $goal_id, $title, $deadline);
    
    if ($stmt->execute()) {
        updateGoalProgress($conn, $goal_id);
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل إضافة النشاط']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    $progress = floatval($data['progress'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف النشاط غير صحيح']);
        exit();
    }
    
    if ($progress < 0 || $progress > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'نسبة الإنجاز يجب أن تكون بين 0 و 100']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT goal_id FROM activities WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'النشاط غير موجود']);
        exit();
    }
    
    $activity = $result->fetch_assoc();
    $goal_id = $activity['goal_id'];
    $stmt->close();
    
    $stmt = $conn->prepare("UPDATE activities SET progress = ? WHERE id = ?");
    $stmt->bind_param("di", $progress, $id);
    
    if ($stmt->execute()) {
        updateGoalProgress($conn, $goal_id);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل تحديث النشاط']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkRole(['admin', 'committee_head']);
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف النشاط غير صحيح']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT goal_id FROM activities WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'النشاط غير موجود']);
        exit();
    }
    
    $activity = $result->fetch_assoc();
    $goal_id = $activity['goal_id'];
    $stmt->close();
    
    $stmt = $conn->prepare("DELETE FROM activities WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        updateGoalProgress($conn, $goal_id);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف النشاط']);
    }
    
    $stmt->close();
}

$conn->close();
?>

