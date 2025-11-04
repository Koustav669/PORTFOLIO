// nav-active.js - marks the nav item matching current path as active
(function(){
  const links = document.querySelectorAll('.hero-nav a');
  if (!links.length) return;
  const current = window.location.pathname.split('/').pop().toLowerCase() || 'portfolio.html';
  links.forEach(a=>{
    const href = (a.getAttribute('href')||'').toLowerCase();
    if (href.includes(current) || (current === '' && href.includes('portfolio.html'))) {
      a.classList.add('active');
    }
  });
})();
