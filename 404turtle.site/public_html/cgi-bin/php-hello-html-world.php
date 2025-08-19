
<?php
header('Cache-Control: no-cache');
header('Content-type: text/html');

$time = date('Y-m-d H:i:s');
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
?>
<!DOCTYPE html>
<html>
<head><title>Hello, PHP!</title></head>
<body>
<h1>404Turtle was here - Hello, PHP!</h1>
<p>This page was generated with the PHP programming language</p>
<p>Current Time: <?= htmlspecialchars($time) ?></p>
<p>Your IP Address: <?= htmlspecialchars($ip) ?></p>
</body>
</html>
