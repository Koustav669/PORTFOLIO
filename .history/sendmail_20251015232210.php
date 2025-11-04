<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
  $mail->isSMTP();
  $mail->Host = 'smtp.gmail.com';
  $mail->SMTPAuth = true;
  $mail->Username = 'daskoustav88@gmail.com'; // 🔁 Replace with your Gmail
  $mail->Password = 'your-app-password';   // 🔁 Replace with Gmail app password
  $mail->SMTPSecure = 'tls';
  $mail->Port = 587;

  $mail->setFrom($_POST['email'], $_POST['name']);
  $mail->addAddress('daskoustav88@gmail.com'); // 🔁 Your receiving email

  $mail->Subject = 'New message from portfolio';
  $mail->Body = "Name: {$_POST['name']}\nEmail: {$_POST['email']}\n\nMessage:\n{$_POST['message']}";

  $mail->send();
  echo 'Message sent successfully!';
} catch (Exception $e) {
  echo 'Failed to send: ', $mail->ErrorInfo;
}
?>