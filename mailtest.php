<?php
// SMTP疎通確認用の開発向けスクリプト。
// 本番環境に残さないこと。アクセスは localhost / 特定IPに限定する。
$allowedIps = ['127.0.0.1', '::1'];
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($clientIp, $allowedIps, true)) {
    http_response_code(404);
    exit();
}

require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$to = getenv('LYRIC_MAILTEST_TO') ?: 'info@n-lyric.com';

$mail = new PHPMailer(true);

try {
    $mail->CharSet = 'UTF-8';
    $mail->isMail();
    $mail->setFrom('no-reply@n-lyric.com', '株式会社リリック');
    $mail->addAddress($to, 'テスト受信者');
    $mail->Subject = 'テスト送信';
    $mail->Body = "これはテスト送信です。\n改行もそのまま表示されます。";
    $mail->send();

    echo "OK: テストメールを送信しました (to={$to})";
} catch (Exception $e) {
    echo "ERROR: {$mail->ErrorInfo}";
}
