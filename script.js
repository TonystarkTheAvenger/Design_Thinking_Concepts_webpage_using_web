document.addEventListener('DOMContentLoaded', () => {
    // Implement an Intersection Observer for smooth fade-in animations as the user scrolls
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the 'visible' class to trigger CSS transition
                entry.target.classList.add('visible');
                // Once visible, stop observing to keep it visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Target all sections with the 'fade-in' class
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    console.log("UX Case Study loaded and Intersection Observer initialized.");
});
