<?php
// Ensure we target the SAME cookie (Path=/)
session_set_cookie_params(['path' => '/']);
session_start();

// Clear session data
$_SESSION = [];

// Remove the session cookie
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000,
           $p['path'] ?: '/', $p['domain'] ?? '',
           $p['secure'] ?? false, $p['httponly'] ?? false);
}

// Destroy server-side session storage
session_destroy();

// Send cache-busting headers and redirect (prevents stale page)
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Location: /cgi-bin/php-sessions-2.php');
exit;
