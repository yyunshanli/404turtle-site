#!/usr/bin/php-cgi
<?php
session_set_cookie_params(['path' => '/']);
session_start();

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Content-Type: text/html; charset=utf-8');

$name = $_SESSION['username'] ?? '';
?>
<!DOCTYPE html>
<html>
<head><title>PHP Sessions Page 2</title></head>
<body>
<h1>PHP Sessions Page 2</h1>
<p><b>Name:</b> <?= $name !== '' ? htmlspecialchars($name) : 'NAME' ?></p>

<p><a href="/cgi-bin/php-sessions-1.php">Session Page 1</a></p>
<p><a href="/php-state-demo.html">PHP CGI Form</a></p>

<form style="margin-top:30px" action="/cgi-bin/php-destroy-session.php" method="get">
  <button type="submit">Destroy Session</button>
</form>
</body>
</html>
