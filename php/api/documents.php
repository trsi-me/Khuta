<?php
require_once '../config.php';
checkAuth();

header('Content-Type: application/json; charset=utf-8');

if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $activity_id = intval($_GET['activity_id'] ?? 0);
    
    if ($activity_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف النشاط مطلوب']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT d.*, u.name as user_name FROM documents d JOIN users u ON d.user_id = u.id WHERE d.activity_id = ? ORDER BY d.upload_date DESC");
    $stmt->bind_param("i", $activity_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $documents = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['file_url'] = BASE_URL . 'uploads/serve.php?file=' . basename($row['file_path']);
        $documents[] = $row;
    }
    
    echo json_encode($documents);
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkRole(['admin', 'committee_head', 'faculty_member']);
    
    $activity_id = intval($_POST['activity_id'] ?? 0);
    
    if ($activity_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف النشاط مطلوب']);
        exit();
    }
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'لم يتم رفع الملف']);
        exit();
    }
    
    $file = $_FILES['file'];
    $allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    $max_size = 10 * 1024 * 1024;
    
    if (!in_array($file['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(['error' => 'نوع الملف غير مسموح']);
        exit();
    }
    
    if ($file['size'] > $max_size) {
        http_response_code(400);
        echo json_encode(['error' => 'حجم الملف كبير جداً']);
        exit();
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = UPLOAD_DIR . $filename;
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        http_response_code(500);
        echo json_encode(['error' => 'فشل رفع الملف']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO documents (activity_id, user_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?, ?)");
    $relative_path = 'uploads/' . $filename;
    $stmt->bind_param("iissi", $activity_id, $_SESSION['user_id'], $relative_path, $file['name'], $file['size']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id, 'filename' => $file['name']]);
    } else {
        unlink($filepath);
        http_response_code(500);
        echo json_encode(['error' => 'فشل حفظ معلومات الملف']);
    }
    
    $stmt->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkRole(['admin', 'committee_head']);
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'معرف الملف غير صحيح']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT file_path FROM documents WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'الملف غير موجود']);
        exit();
    }
    
    $document = $result->fetch_assoc();
    $file_path = __DIR__ . '/../' . $document['file_path'];
    
    if (file_exists($file_path)) {
        unlink($file_path);
    }
    
    $stmt->close();
    
    $stmt = $conn->prepare("DELETE FROM documents WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'فشل حذف الملف']);
    }
    
    $stmt->close();
}

$conn->close();
?>

