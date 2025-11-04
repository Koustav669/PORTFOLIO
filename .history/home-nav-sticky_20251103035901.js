// Handle sticky navigation for home page
document.addEventListener('DOMContentLoaded', function() {
    if (!document.body.classList.contains('home-page')) return;

    const nav = document.querySelector('.hero-nav');
    const navTop = nav.offsetTop;

    function handleScroll() {
        if (window.scrollY >= navTop) {
            nav.classList.add('is-sticky');
        } else {
            nav.classList.remove('is-sticky');
        }
    }

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
});