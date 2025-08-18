
<?php
header('Cache-Control: no-cache');
header('Content-type: text/html');
?>
<!DOCTYPE html>
<html><head><title>Environment Variables</title></head>
<body><h1 align="center">Environment Variables</h1><hr>
<?php
// Show CGI/Server vars (similar to %ENV in Perl)
foreach ($_SERVER as $k => $v) {
  if (is_array($v)) $v = json_encode($v);
  echo '<b>'.htmlspecialchars($k).':</b> '.htmlspecialchars((string)$v)."<br />\n";
}
?>
</body></html>

