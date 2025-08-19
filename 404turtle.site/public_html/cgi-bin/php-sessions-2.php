
<?php
session_start();
header('Cache-Control: no-cache');
header('Content-type: text/html');
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
