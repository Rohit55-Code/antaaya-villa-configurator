<?php
// Copy this file to config.php and fill in your real values.
// config.php is gitignored and must NEVER be committed.

$SMTP_HOST         = 'smtp.gmail.com';
$SMTP_PORT         = 587;                               // TLS port
$SMTP_USERNAME     = 'your-email@example.com';          // sender Gmail / Google Workspace address
$SMTP_APP_PASSWORD = 'your-16-char-app-password';       // Gmail App Password
$MAIL_FROM_NAME    = 'Antaaya Villas — Site Visit';
$MAIL_TO           = 'sales-team@example.com';          // who receives the visit record
$MAIL_TO_NAME      = 'Sales Team';
$MAIL_CC           = [];                                // e.g. ['manager@example.com']

$GAS_SHEET_URL     = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // Apps Script Web App URL
