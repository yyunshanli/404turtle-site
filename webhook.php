<?php
$secret = 'a542526c1017d3d22c6186097ad8c056'; 

$github_payload = file_get_contents('php://input');
$github_signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'];
if (!isset($github_signature)) {
  exit('Webhook signature not set');
}
$local_signature = 'sha256=' . hash_hmac('sha256', $github_payload, $secret);

if (hash_equals($github_signature, $local_signature)) {
    // Execute the deployment script
    shell_exec('sudo /home/yunshan/deploy.sh > /dev/null 2>&1');
    echo "Deployment successful!";
} else {
    exit('Invalid signature');
}
?>
