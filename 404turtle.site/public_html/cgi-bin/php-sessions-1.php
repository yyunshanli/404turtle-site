#!/usr/bin/php-cgi
<?php
// Make the PHPSESSID cookie live at the site root
session_set_cookie_params(['path' => '/']);
session_start();

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Content-Type: text/html; charset=utf-8');

// Save name if posted
if (!empty($_POST['username'])) {
  $_SESSION['username'] = $_POST['username'];
}

$name = $_SESSION['username'] ?? '';
?>
<!DOCTYPE html>
<html>
<head><title>PHP Sessions Page 1</title></head>
<body>
<h1>PHP Sessions Page 1</h1>
<p><b>Name:</b> <?= $name !== '' ? htmlspecialchars($name) : 'You do not have a name set' ?></p>

<p><a href="/cgi-bin/php-sessions-2.php">Session Page 2</a></p>
<p><a href="/php-state-demo.html">PHP CGI Form</a></p>

<form style="margin-top:30px" action="/cgi-bin/php-destroy-session.php" method="get">
  <button type="submit">Destroy Session</button>
</form>
</body>
</html>
