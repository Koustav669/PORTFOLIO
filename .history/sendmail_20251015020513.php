<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $to = "daskoustav88@gmail.com"; // Your email
  $subject = "New message from your portfolio site";

  $name = htmlspecialchars($_POST["name"]);
  $email = htmlspecialchars($_POST["email"]);
  $message = htmlspecialchars($_POST["message"]);

  $headers = "From: $name <$email>\r\n";
  $headers .= "Reply-To: $email\r\n";

  $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";

  if (mail($to, $subject, $body, $headers)) {
    echo "Message sent successfully!";
  } else {
    echo "Failed to send message.";
  }
}
?>