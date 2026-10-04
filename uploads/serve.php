<?php
require_once '../php/config.php';
checkAuth();

$filename = basename($_GET['file'] ?? '');

if (empty($filename)) {
    http_response_code(400);
    die('اسم الملف مطلوب');
}

$filepath = __DIR__ . '/' . $filename;

if (!file_exists($filepath)) {
    http_response_code(404);
    die('الملف غير موجود');
}

$stmt = $conn->prepare("SELECT d.*, a.goal_id, g.plan_id, p.department_id FROM documents d JOIN activities a ON d.activity_id = a.id JOIN goals g ON a.goal_id = g.id JOIN plans p ON g.plan_id = p.id WHERE d.file_path LIKE ?");
$relative_path = '%uploads/' . $filename;
$stmt->bind_param("s", $relative_path);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(403);
    die('غير مصرح لك بالوصول لهذا الملف');
}

$document = $result->fetch_assoc();

if ($_SESSION['role'] !== 'admin' && $_SESSION['department_id'] != $document['department_id']) {
    http_response_code(403);
    die('غير مصرح لك بالوصول لهذا الملف');
}

$stmt->close();
$conn->close();

$mime_type = mime_content_type($filepath);
header('Content-Type: ' . $mime_type);
header('Content-Disposition: inline; filename="' . $document['file_name'] . '"');
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit();
?>

