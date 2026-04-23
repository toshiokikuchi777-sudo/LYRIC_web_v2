<?php
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: https://n-lyric.com/company.html#Form');
    exit();
}

const MAX_ATTACHMENT_COUNT = 3;
const MAX_ORIGINAL_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB（アップロード受け入れ上限）
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB（メール添付最終上限）
const MAX_IMAGE_WIDTH = 2000;
const MAX_IMAGE_HEIGHT = 2000;
const JPEG_QUALITY = 82;
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
];

function cleanupTempFiles(array $files): void
{
    foreach ($files as $filePath) {
        if (is_string($filePath) && $filePath !== '' && file_exists($filePath)) {
            @unlink($filePath);
        }
    }
}

function resizeDimensions(int $width, int $height): array
{
    $scale = min(MAX_IMAGE_WIDTH / $width, MAX_IMAGE_HEIGHT / $height, 1);
    return [
        max(1, (int)floor($width * $scale)),
        max(1, (int)floor($height * $scale)),
    ];
}

function sanitizeAttachmentName(string $name): string
{
    $base = basename($name);
    return preg_replace('/[^A-Za-z0-9._-]/', '_', $base) ?: 'attachment.jpg';
}

function detectMimeType(string $path): string
{
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    if (function_exists('mime_content_type')) {
        $mime = mime_content_type($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return 'application/octet-stream';
}

function processWithImagick(string $tmpName, string $originalName): array
{
    if (!class_exists('Imagick')) {
        exit('HEIC/HEIF画像の処理に必要なサーバー設定が不足しています。JPG/PNGで再送してください。');
    }

    try {
        $image = new Imagick();
        $image->readImage($tmpName);
        $image->setIteratorIndex(0);
        $image->setImageOrientation(Imagick::ORIENTATION_UNDEFINED);
        $image->autoOrient();
        $image->thumbnailImage(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, true, true);
        $image->setImageFormat('jpeg');
        $image->setImageCompressionQuality(JPEG_QUALITY);
    } catch (Throwable $e) {
        exit('HEIC/HEIF画像の変換に失敗しました。iPhone設定で「互換性優先」に変更するか、JPG/PNGで再送してください。');
    }

    $tmpOutput = tempnam(sys_get_temp_dir(), 'lyric_img_');
    if ($tmpOutput === false) {
        exit('添付画像の一時ファイル作成に失敗しました。');
    }

    $image->writeImage($tmpOutput);
    $image->clear();
    $image->destroy();

    if (filesize($tmpOutput) > MAX_ATTACHMENT_SIZE) {
        @unlink($tmpOutput);
        exit('画像サイズが大きすぎます。解像度を下げて再送してください。');
    }

    $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
    $safeName = sanitizeAttachmentName($nameWithoutExt . '.jpg');

    return [
        'tmp_name' => $tmpOutput,
        'name' => $safeName,
        'mime' => 'image/jpeg',
        'converted' => true,
    ];
}

function processWithGd(string $tmpName, string $mime, string $originalName): array
{
    if (!function_exists('imagecreatetruecolor')) {
        if (filesize($tmpName) <= MAX_ATTACHMENT_SIZE) {
            return [
                'tmp_name' => $tmpName,
                'name' => sanitizeAttachmentName($originalName),
                'mime' => $mime,
                'converted' => false,
            ];
        }
        exit('画像圧縮に必要なサーバー設定が不足しています。画像を小さくして再送してください。');
    }

    switch ($mime) {
        case 'image/jpeg':
            if (!function_exists('imagecreatefromjpeg')) {
                exit('JPEG画像処理に失敗しました。');
            }
            $source = @imagecreatefromjpeg($tmpName);
            break;
        case 'image/png':
            if (!function_exists('imagecreatefrompng')) {
                exit('PNG画像処理に失敗しました。');
            }
            $source = @imagecreatefrompng($tmpName);
            break;
        case 'image/gif':
            if (!function_exists('imagecreatefromgif')) {
                exit('GIF画像処理に失敗しました。');
            }
            $source = @imagecreatefromgif($tmpName);
            break;
        case 'image/webp':
            if (!function_exists('imagecreatefromwebp')) {
                exit('WebP画像処理に失敗しました。');
            }
            $source = @imagecreatefromwebp($tmpName);
            break;
        default:
            exit('対応していない画像形式です。');
    }

    if (!$source) {
        exit('画像の読み込みに失敗しました。別の画像でお試しください。');
    }

    $width = imagesx($source);
    $height = imagesy($source);
    [$newWidth, $newHeight] = resizeDimensions($width, $height);

    $canvas = imagecreatetruecolor($newWidth, $newHeight);
    if (!$canvas) {
        imagedestroy($source);
        exit('画像処理用メモリの確保に失敗しました。');
    }

    $white = imagecolorallocate($canvas, 255, 255, 255);
    imagefill($canvas, 0, 0, $white);
    imagecopyresampled($canvas, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $tmpOutput = tempnam(sys_get_temp_dir(), 'lyric_img_');
    if ($tmpOutput === false) {
        imagedestroy($source);
        imagedestroy($canvas);
        exit('添付画像の一時ファイル作成に失敗しました。');
    }

    if (!imagejpeg($canvas, $tmpOutput, JPEG_QUALITY)) {
        imagedestroy($source);
        imagedestroy($canvas);
        @unlink($tmpOutput);
        exit('画像変換に失敗しました。別の画像でお試しください。');
    }
    imagedestroy($source);
    imagedestroy($canvas);

    if (filesize($tmpOutput) > MAX_ATTACHMENT_SIZE) {
        @unlink($tmpOutput);
        exit('画像サイズが大きすぎます。解像度を下げて再送してください。');
    }

    $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
    $safeName = sanitizeAttachmentName($nameWithoutExt . '.jpg');

    return [
        'tmp_name' => $tmpOutput,
        'name' => $safeName,
        'mime' => 'image/jpeg',
        'converted' => true,
    ];
}

function processAttachment(string $tmpName, string $mime, string $originalName): array
{
    if (in_array($mime, ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'], true)) {
        return processWithImagick($tmpName, $originalName);
    }
    return processWithGd($tmpName, $mime, $originalName);
}

function getClientIp(): string
{
    $candidates = [
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? null,
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
        $_SERVER['HTTP_X_REAL_IP'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null,
    ];

    foreach ($candidates as $candidate) {
        if (!is_string($candidate) || $candidate === '') {
            continue;
        }

        $ips = array_map('trim', explode(',', $candidate));
        foreach ($ips as $ip) {
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }

    return 'unknown';
}

function appendJsonLog(array $record): void
{
    $logPath = __DIR__ . '/contact_log.jsonl';
    file_put_contents(
        $logPath,
        json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

// 入力値を取得（POST）
$category = trim($_POST['category'] ?? '');
$last_name = trim($_POST['last_name'] ?? '');
$first_name = trim($_POST['first_name'] ?? '');
$last_kana = trim($_POST['last_kana'] ?? '');
$first_kana = trim($_POST['first_kana'] ?? '');
$postcode = trim($_POST['postcode'] ?? '');
$prefecture = trim($_POST['prefecture'] ?? '');
$address = trim($_POST['address'] ?? '');
$building = trim($_POST['building'] ?? '');
$tel = trim($_POST['tel'] ?? '');
$fax = trim($_POST['fax'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$clientIp = getClientIp();

// 必須チェック
if (!$category || !$last_name || !$first_name || !$last_kana || !$first_kana || !$tel || !$email || !$message) {
    exit('必須項目が未入力です。');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit('メールアドレスが不正です。');
}

// Turnstile検証
$token = $_POST['cf-turnstile-response'] ?? '';
$ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'secret' => '0x4AAAAAABiz_Xhe-J0-EB9ypk53QvLFwt8',
    'response' => $token,
]));
$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
if (empty($result['success'])) {
    exit('Turnstile認証に失敗しました。戻ってやり直してください。');
}

// 添付ファイル検証
$attachments = [];
$generatedTempFiles = [];
if (isset($_FILES['attachments'])) {
    $names = $_FILES['attachments']['name'] ?? [];
    $tmpNames = $_FILES['attachments']['tmp_name'] ?? [];
    $errors = $_FILES['attachments']['error'] ?? [];
    $sizes = $_FILES['attachments']['size'] ?? [];

    $validIndexes = [];
    foreach ($names as $i => $name) {
        if ($name !== '' || ($errors[$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $validIndexes[] = $i;
        }
    }

    if (count($validIndexes) > MAX_ATTACHMENT_COUNT) {
        exit('画像添付は最大3ファイルまでです。');
    }

    foreach ($validIndexes as $i) {
        $error = $errors[$i] ?? UPLOAD_ERR_NO_FILE;
        if ($error !== UPLOAD_ERR_OK) {
            cleanupTempFiles($generatedTempFiles);
            exit('画像アップロードに失敗しました。別の画像でお試しください。');
        }

        $tmpName = $tmpNames[$i] ?? '';
        $size = (int)($sizes[$i] ?? 0);
        $name = (string)($names[$i] ?? '');

        if ($size <= 0 || $size > MAX_ORIGINAL_ATTACHMENT_SIZE) {
            cleanupTempFiles($generatedTempFiles);
            exit('画像サイズは1ファイル20MB以下にしてください。');
        }

        $mime = detectMimeType($tmpName);
        if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
            cleanupTempFiles($generatedTempFiles);
            exit('対応していない画像形式です。jpg / png / gif / webp / heic / heif をご利用ください。');
        }

        try {
            $processed = processAttachment($tmpName, $mime, $name);
        } catch (Throwable $e) {
            cleanupTempFiles($generatedTempFiles);
            exit('画像処理中にエラーが発生しました。画像を変更して再度お試しください。');
        }

        if (!empty($processed['converted'])) {
            $generatedTempFiles[] = $processed['tmp_name'];
        }
        $attachments[] = $processed;
    }
}

// メール送信
$mail = new PHPMailer(true);

try {
    $mail->CharSet = 'UTF-8';
    $mail->isMail();
    $mail->setFrom('info@n-lyric.com', '株式会社リリック');
    $mail->Sender = 'info@n-lyric.com';
    $mail->addReplyTo($email, $last_name . ' ' . $first_name);
    $mail->addAddress('info@n-lyric.com', 'お問い合わせ担当者');
    $mail->addBCC('tomglassesc@gmail.com');
    $mail->Subject = '【株式会社リリック】お問い合わせを受け付けました';

    foreach ($attachments as $attachment) {
        $mail->addAttachment($attachment['tmp_name'], $attachment['name']);
    }

    $attachmentInfo = 'なし';
    $attachmentNames = [];
    if (!empty($attachments)) {
        $attachmentNames = array_map(static fn($file) => $file['name'], $attachments);
        $attachmentInfo = implode(', ', $attachmentNames);
    }

    // 本文（テキスト）
    $body = <<<EOT
以下の内容でお問い合わせがありました。

【項目】
{$category}

【お名前】
{$last_name} {$first_name}

【フリガナ】
{$last_kana} {$first_kana}

【住所】
〒{$postcode}
{$prefecture}{$address}
{$building}

【電話番号】
{$tel}

【FAX番号】
{$fax}

【メールアドレス】
{$email}

【送信元IP】
{$clientIp}

【添付画像】
{$attachmentInfo}

【お問い合わせ内容】
{$message}
EOT;

    $mail->Body = $body;
    $mail->send();
    cleanupTempFiles($generatedTempFiles);

    // ログファイル記録
    file_put_contents(
        __DIR__ . '/contact_log.txt',
        date('Y-m-d H:i:s') . " 送信成功: {$email} IP: {$clientIp}\n",
        FILE_APPEND
    );

    appendJsonLog([
        'timestamp' => date(DATE_ATOM),
        'status' => 'success',
        'email' => $email,
        'ip' => $clientIp,
        'category' => $category,
        'attachments' => $attachmentNames,
    ]);

    // サンキューページにリダイレクト
    header('Location: https://n-lyric.com/thanks.html');
    exit();
} catch (Exception $e) {
    cleanupTempFiles($generatedTempFiles);

    // ログ記録
    file_put_contents(
        __DIR__ . '/contact_log.txt',
        date('Y-m-d H:i:s') . " 送信失敗: {$email} IP: {$clientIp} エラー: {$mail->ErrorInfo}\n",
        FILE_APPEND
    );

    appendJsonLog([
        'timestamp' => date(DATE_ATOM),
        'status' => 'error',
        'email' => $email,
        'ip' => $clientIp,
        'category' => $category,
        'error' => $mail->ErrorInfo,
    ]);

    exit("メール送信エラー: {$mail->ErrorInfo}");
}
