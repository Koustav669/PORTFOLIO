// header-typing.js
// Simple typewriter effect that types words from an array, then erases, loops.
(function(){
  const words = ['coder', 'editor', 'Developer'];
  const el = document.getElementById('role-text');
  const cursor = document.getElementById('role-cursor');
  if (!el) return;

  let wordIndex = 0;
  let charIndex = 0;
  let typing = true;

  const typeSpeed = 80;    // ms per character
  const eraseSpeed = 50;   // ms per character when erasing
  const holdDelay = 1200;  // ms word stays before erasing
  const nextDelay = 400;   // ms pause before typing next word

  function tick(){
    const word = words[wordIndex];
    if (typing) {
      el.textContent = word.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === word.length) {
        typing = false;
        setTimeout(tick, holdDelay);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      el.textContent = word.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        typing = true;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(tick, nextDelay);
        return;
      }
      setTimeout(tick, eraseSpeed);
    }
  }

  // cursor blink handled via CSS, but ensure it is visible
  if (cursor) cursor.style.opacity = '1';
  tick();
})();
