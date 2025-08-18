
<?php
session_start();
header('Cache-Control: no-cache');
header('Content-type: text/html');

if (isset($_POST['username']) && $_POST['username'] !== '') {
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
<p><a href="/php-cgiform.html">PHP CGI Form</a></p>

<form style="margin-top:30px" action="/cgi-bin/php-destroy-session.php" method="get">
  <button type="submit">Destroy Session</button>
</form>
</body>
</html>
