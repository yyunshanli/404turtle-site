<?php
// ===== CONFIGURATION =====
$secret       = '85297b01f0d4178480b48fa7d6ea417b155db2101cd9495f1d2f1ba517762c9c';
$repoDir      = '/var/www'; // path to your production code
$branch       = 'main';     // branch to deploy
$deployUser   = 'yunshan';  // user that owns the repo

// ===== VERIFY WEBHOOK =====
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!$signature) {
    http_response_code(400);
    echo "Missing signature";
    exit;
}

$hash = 'sha256=' . hash_hmac('sha256', $payload, $secret);
if (!hash_equals($hash, $signature)) {
    http_response_code(403);
    echo "Invalid signature";
    exit;
}

// ===== DEPLOY =====
$output = [];
$returnVar = 0;

$cmd = "cd {$repoDir} && git fetch origin {$branch} && git reset --hard origin/{$branch} 2>&1";
exec($cmd, $output, $returnVar);

// ===== LOG RESULT =====
$logFile = '/var/log/deploy.log';
file_put_contents($logFile, date('Y-m-d H:i:s') . " Deploy result:\n" . implode("\n", $output) . "\n\n", FILE_APPEND);

// ===== RESPONSE =====
if ($returnVar === 0) {
    echo "Deployment successful";
} else {
    http_response_code(500);
    echo "Deployment failed — check logs.";
}
?>
