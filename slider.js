// slider.js
let index = 0;
const slides = document.querySelector('.slides');
const images = document.querySelectorAll('.slides img');

function showSlide(i) {
  index = (i + images.length) % images.length;
  slides.style.transform = `translateX(-${index * 100}%)`;
}

document.querySelector('.prev').onclick = () => showSlide(index - 1);
document.querySelector('.next').onclick = () => showSlide(index + 1);

setInterval(() => showSlide(index + 1), 4000);