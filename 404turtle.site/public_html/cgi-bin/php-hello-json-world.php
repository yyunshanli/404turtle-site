
<?php
header('Cache-Control: no-cache');
header('Content-type: application/json');

echo json_encode([
  'title'   => 'Hello, PHP!',
  'heading' => '404Turtle was here - Hello, PHP!',
  'message' => 'This page was generated with the PHP programming language',
  'time'    => date('Y-m-d H:i:s'),
  'IP'      => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
]);
