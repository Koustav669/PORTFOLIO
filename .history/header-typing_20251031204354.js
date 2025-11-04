// header-typing.js
// ⚡ Smooth Typewriter Animation for the header role text ⚡
// Cycles seamlessly through all titles — fast, clean, visible everywhere.

document.addEventListener("DOMContentLoaded", () => {
  const words = [
    "Developer",
    "Machine Learning Enthusiast",
    "Coder",
    "Editor"
  ];

  const el = document.getElementById("role-text");
  const cursor = document.getElementById("role-cursor");
  if (!el) return;

  let wordIndex = 0;
  let charIndex = 0;
  let isTyping = true;

  // ⏱️ Animation Speeds (your custom values)
  const typeSpeed = 90;     // ms per character while typing
  const eraseSpeed = 45;    // ms per character while erasing
  const holdDelay = 1800;   // ms to hold full word before erasing
  const nextDelay = 400;    // pause before next word starts

  function typeEffect() {
    const currentWord = words[wordIndex];

    if (isTyping) {
      el.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex < currentWord.length) {
        setTimeout(typeEffect, typeSpeed);
      } else {
        isTyping = false;
        setTimeout(typeEffect, holdDelay);
      }

    } else {
      el.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex > 0) {
        setTimeout(typeEffect, eraseSpeed);
      } else {
        isTyping = true;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(typeEffect, nextDelay);
      }
    }
  }

  // Make sure cursor is visible
  if (cursor) cursor.style.opacity = "1";

  typeEffect();
});
