<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// PHPMailer files ko include karo — path server ke hisaab se resolve hota hai
require __DIR__ . '/phpmailer/src/Exception.php';
require __DIR__ . '/phpmailer/src/PHPMailer.php';
require __DIR__ . '/phpmailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
  // SMTP settings
  $mail->isSMTP();
  $mail->Host = 'smtp.gmail.com';
  $mail->SMTPAuth = true;
  $mail->Username = 'daskoustav88@gmail.com';         // ✅ Tera Gmail ID
  $mail->Password = 'ihyymxdphchtblhm';               // ✅ Tera App Password (no spaces)
  $mail->SMTPSecure = 'tls';
  $mail->Port = 587;

  // Sender and receiver
  $mail->setFrom($_POST['email'], $_POST['name']);    // Visitor ka email aur naam
  $mail->addAddress('daskoustav88@gmail.com');        // ✅ Tera receiving email

  // Email content
  $mail->Subject = 'New message from portfolio';
  $mail->Body = "Name: {$_POST['name']}\nEmail: {$_POST['email']}\n\nMessage:\n{$_POST['message']}";

  // Send the email
  $mail->send();
  echo 'Message sent successfully!';
} catch (Exception $e) {
  echo 'Failed to send: ', $mail->ErrorInfo;
}
?>