
<?php
header('Cache-Control: no-cache');
header('Content-type: text/html');

$proto  = $_SERVER['SERVER_PROTOCOL'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$qs     = $_SERVER['QUERY_STRING'] ?? '';
$raw    = file_get_contents('php://input');
?>
<!DOCTYPE html>
<html><head><title>General Request Echo</title></head>
<body><h1 align="center">General Request Echo</h1><hr>
<p><b>HTTP Protocol:</b> <?= htmlspecialchars($proto) ?></p>
<p><b>HTTP Method:</b> <?= htmlspecialchars($method) ?></p>
<p><b>Query String:</b> <?= htmlspecialchars($qs) ?></p>
<p><b>Message Body:</b> <?= htmlspecialchars($raw) ?></p>
</body></html>

