<?php

/**
 * Antaaya Villas — Site Visit Record Handler
 * 1. Sends a styled HTML email with PHPMailer over Gmail SMTP
 * 2. Forwards the same data to a Google Sheet via Apps Script
 *
 * Requires PHPMailer installed via Composer:
 *   composer require phpmailer/phpmailer
 * Upload the generated /vendor folder alongside this file to Bluehost.
 */

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ===================== CONFIG =====================
// Real values live in config.php (gitignored). Copy config.example.php -> config.php.
require __DIR__ . '/config.php';
// ===================================================

// ----- Read & sanitize incoming JSON -----
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Invalid or empty submission data.']);
  exit;
}

function clean($v)
{
  return htmlspecialchars(trim((string)($v ?? '')), ENT_QUOTES, 'UTF-8');
}

$date               = clean($data['date'] ?? '');
$time_in            = clean($data['time_in'] ?? '');
$time_out           = clean($data['time_out'] ?? '');
$assigned_executive = clean($data['assigned_executive'] ?? '');
$client_name        = clean($data['client_name'] ?? '');
$client_contact     = clean($data['client_contact'] ?? '');
$client_alt_contact = clean($data['client_alt_contact'] ?? '');
$maharera_no        = clean($data['maharera_no'] ?? '');
$source              = clean($data['source'] ?? '');
$requirement         = clean($data['requirement'] ?? '');
$budget              = clean($data['budget'] ?? '');
$visit_status        = clean($data['visit_status'] ?? '');
$lead_status         = clean($data['lead_status'] ?? '');
$feedback            = clean($data['feedback'] ?? '');
$submitted_at        = clean($data['submitted_at'] ?? date('d-m-Y h:i A'));

// ----- Basic required-field validation -----
if (!$date || !$assigned_executive || !$client_name || !$client_contact || !$source || !$requirement) {
  http_response_code(422);
  echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
  exit;
}

// ----- Lead status color for the email badge -----
$leadColors = [
  'Hot'  => '#3ca812',
  'Warm' => '#ffc15e',
  'Cold' => '#7ec8ff',
  'New'  => '#c9a6ff',
];
$leadColor = $leadColors[$lead_status] ?? '#8dc63f';

// ===================== Build HTML Email =====================
$row = function ($label, $value) {
  if ($value === '') return '';
  return "
    <tr>
      <td style='padding:10px 14px;border-bottom:1px solid #e7ece2;font-size:12px;font-weight:600;letter-spacing:.06em;color:#6f8a5a;text-transform:uppercase;width:38%;vertical-align:top;'>{$label}</td>
      <td style='padding:10px 14px;border-bottom:1px solid #e7ece2;font-size:14px;color:#1a1f17;vertical-align:top;'>{$value}</td>
    </tr>";
};

$htmlBody = "
<div style='background:transparent;padding:32px 16px;font-family:Montserrat,Arial,sans-serif;'>
  <table role='presentation' width='100%' style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8df;'>
    <tr>
      <td style='background:linear-gradient(135deg,#8dc63f,#6fa52f);padding:24px 28px;'>
        <p style='margin:0;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#10150d;opacity:.75;font-weight:700;'>Antaaya Villas · Lonavala</p>
        <h1 style='margin:6px 0 0;font-size:24px;color:#10150d;font-weight:700;'>New Site Visit Recorded</h1>
      </td>
    </tr>
    <tr>
      <td style='padding:20px 28px 4px;'>
        <span style='display:inline-block;background:{$leadColor};color:#10150d;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:30px;'>{$lead_status} Lead</span>
        " . ($visit_status ? "<span style='display:inline-block;margin-left:8px;background:#eef3e7;color:#3a4a30;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:30px;'>{$visit_status}</span>" : "") . "
      </td>
    </tr>
    <tr>
      <td style='padding:18px 28px 28px;'>
        <table role='presentation' width='100%' style='border-collapse:collapse;'>
          {$row('Date',$date)}
          {$row('Time In',$time_in)}
          {$row('Time Out',$time_out)}
          {$row('Assigned Executive',$assigned_executive)}
          {$row('Client Name',$client_name)}
          {$row('Primary Contact',$client_contact)}
          {$row('Alternative Contact',$client_alt_contact)}
          {$row('Source',$source)}
          {$row('MahaRERA No.',$maharera_no)}
          {$row('Requirement',$requirement)}
          {$row('Budget',$budget)}
          {$row('Feedback / Remarks', nl2br($feedback))}
        </table>
      </td>
    </tr>
    <tr>
      <td style='background:#f4f7f1;padding:16px 28px;text-align:center;'>
        <p style='margin:0;font-size:11px;color:#8a9a7c;letter-spacing:.04em;'>Submitted on {$submitted_at} &middot; Antaaya Villas, Lonavala</p>
      </td>
    </tr>
  </table>
</div>";

$plainBody = "New Site Visit Recorded\n\n"
  . "Date: $date\nTime In: $time_in\nTime Out: $time_out\n"
  . "Assigned Executive: $assigned_executive\n\n"
  . "Client Name: $client_name\nPrimary Contact: $client_contact\nAlternative Contact: $client_alt_contact\n\n"
  . "Source: $source\nMahaRERA No.: $maharera_no\nRequirement: $requirement\nBudget: $budget\n\n"
  . "Visit Status: $visit_status\nLead Status: $lead_status\n\n"
  . "Feedback: $feedback\n\nSubmitted at: $submitted_at";

// ===================== Send Email via PHPMailer =====================
$mailSent = false;
$mailError = '';
$mail = null;

try {
  $mail = new PHPMailer(true);
  $mail->CharSet = 'UTF-8';
  $mail->Encoding = 'base64';
  $mail->isSMTP();
  $mail->Host       = $SMTP_HOST;
  $mail->SMTPAuth   = true;
  $mail->Username   = $SMTP_USERNAME;
  $mail->Password   = $SMTP_APP_PASSWORD;
  $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  $mail->Port       = $SMTP_PORT;

  $mail->setFrom($SMTP_USERNAME, $MAIL_FROM_NAME);
  $mail->addAddress($MAIL_TO, $MAIL_TO_NAME);
  foreach ($MAIL_CC as $cc) {
    $mail->addCC($cc);
  }
  $mail->addReplyTo($SMTP_USERNAME, $MAIL_FROM_NAME);

  $mail->isHTML(true);
  $mail->Subject = "New Site Visit — {$client_name} ({$lead_status})";
  $mail->Body    = $htmlBody;
  $mail->AltBody = $plainBody;

  $mail->send();
  $mailSent = true;
} catch (Exception $e) {
  $mailError = $e->getMessage();
  if ($mail !== null) {
    $mailError .= ' ' . $mail->ErrorInfo;
  }
}

// ===================== Forward to Google Sheet =====================
$sheetSent = false;
if ($GAS_SHEET_URL && strpos($GAS_SHEET_URL, 'YOUR_DEPLOYMENT_ID') === false) {
  $params = http_build_query([
    'date'               => $date,
    'time_in'            => $time_in,
    'time_out'           => $time_out,
    'assigned_executive' => $assigned_executive,
    'client_name'        => $client_name,
    'client_contact'     => $client_contact,
    'client_alt_contact' => $client_alt_contact,
    'maharera_no'        => $maharera_no,
    'source'             => $source,
    'requirement'        => $requirement,
    'budget'             => $budget,
    'visit_status'       => $visit_status,
    'lead_status'        => $lead_status,
    'feedback'           => $feedback,
    'submitted_at'       => $submitted_at,
  ]);

  $ch = curl_init($GAS_SHEET_URL . '?' . $params);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 8);          // keep short so the form doesn't hang
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
  $resp = curl_exec($ch);
  $sheetSent = ($resp !== false);
  curl_close($ch);
}

// ===================== Response =====================
if ($mailSent) {
  echo json_encode([
    'success'    => true,
    'message'    => 'Site visit recorded successfully.',
    'mail_sent'  => $mailSent,
    'sheet_sent' => $sheetSent,
  ]);
} else {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Failed to send email: ' . $mailError,
  ]);
}
