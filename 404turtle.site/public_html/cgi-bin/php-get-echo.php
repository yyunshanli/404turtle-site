
<?php
header('Cache-Control: no-cache');
header('Content-type: text/html');

$qs = $_SERVER['QUERY_STRING'] ?? '';
parse_str($qs, $pairs);
?>
<!DOCTYPE html>
<html><head><title>GET Request Echo</title></head>
<body><h1 align="center">Get Request Echo</h1><hr>
<b>Query String:</b> <?= htmlspecialchars($qs) ?><br /><br />
<?php
if ($pairs) {
  foreach ($pairs as $k => $v) {
    $v = is_array($v) ? implode(',', $v) : $v;
    echo htmlspecialchars($k).' = '.htmlspecialchars($v)."<br/>\n";
  }
}
?>
</body></html>
