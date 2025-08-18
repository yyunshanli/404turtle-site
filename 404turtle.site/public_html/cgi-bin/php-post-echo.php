
<?php
header('Cache-Control: no-cache');
header('Content-type: text/html');

$raw = file_get_contents('php://input');   // raw body
parse_str($raw, $pairs);                   // parse x-www-form-urlencoded

?>
<!DOCTYPE html>
<html><head><title>POST Request Echo</title></head>
<body><h1 align="center">POST Request Echo</h1><hr>
<b>Message Body:</b><br />
<ul>
<?php
if ($pairs) {
  foreach ($pairs as $k => $v) {
    $v = is_array($v) ? implode(',', $v) : $v;
    echo '<li>'.htmlspecialchars($k).' = '.htmlspecialchars($v)."</li>\n";
  }
}
?>
</ul>
</body></html>
