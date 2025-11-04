// Handle menu background effect on scroll for home page
document.addEventListener('DOMContentLoaded', function() {
    // Only run on home page
    if (!document.body.classList.contains('home-page')) return;

    const nav = document.querySelector('.hero-nav');
    
    function handleScroll() {
        // Add background when page is scrolled
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    // Check initial scroll position
    handleScroll();

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll);
});