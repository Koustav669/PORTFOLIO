<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ✅ Correct path based on your folder name
require __DIR__ . '/PHPMailer-master/src/Exception.php';
require __DIR__ . '/PHPMailer-master/src/PHPMailer.php';
require __DIR__ . '/PHPMailer-master/src/SMTP.php';

$mail = new PHPMailer(true);

try {
  // SMTP settings
  $mail->isSMTP();
  $mail->Host = 'smtp.gmail.com';
  $mail->SMTPAuth = true;
  $mail->Username = 'daskoustav88@gmail.com';         // ✅ Your Gmail ID
  $mail->Password = 'ihyymxdphchtblhm';               // ✅ Your App Password (no spaces)
  $mail->SMTPSecure = 'tls';
  $mail->Port = 587;

  // Sender and receiver
  $mail->setFrom($_POST['email'], $_POST['name']);    // Visitor's email and name
  $mail->addAddress('daskoustav88@gmail.com');        // ✅ Your receiving email

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