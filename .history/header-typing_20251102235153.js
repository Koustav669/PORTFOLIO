const roles = [
  "Coder",
  "Editor",
  "Machine Learning Enthusiast",
  "Developer"
];

const typeSpeed = 90;   // typing speed
const eraseSpeed = 45;  // erasing speed
const holdDelay = 1800; // delay before erasing starts

let roleIndex = 0;
let charIndex = 0;
const roleText = document.getElementById("role-text");
const cursor = document.getElementById("role-cursor");

function typeRole() {
  if (charIndex < roles[roleIndex].length) {
    roleText.textContent += roles[roleIndex].charAt(charIndex);
    charIndex++;
    setTimeout(typeRole, typeSpeed);
  } else {
    setTimeout(eraseRole, holdDelay);
  }
}

function eraseRole() {
  if (charIndex > 0) {
    roleText.textContent = roles[roleIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(eraseRole, eraseSpeed);
  } else {
    roleIndex++;
    if (roleIndex >= roles.length) roleIndex = 0;
    setTimeout(typeRole, typeSpeed);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (roleText) typeRole();
});
