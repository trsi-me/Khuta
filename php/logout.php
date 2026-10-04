<?php
require_once 'config.php';

session_destroy();
header('Location: ' . BASE_URL . 'pages/login.html');
exit();
?>

