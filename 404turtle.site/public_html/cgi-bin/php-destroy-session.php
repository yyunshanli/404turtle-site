
<?php
session_start();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();

header('Cache-Control: no-cache');
header('Content-type: text/html');
?>
<!DOCTYPE html>
<html>
<head><title>Session Destroyed</title></head>
<body>
<h1>Session Destroyed</h1>
<p><a href="/php-state-demo.html">Back to the PHP CGI Form</a></p>
<p><a href="/cgi-bin/php-sessions-1.php">Back to Page 1</a></p>
<p><a href="/cgi-bin/php-sessions-2.php">Back to Page 2</a></p>
</body>
</html>
