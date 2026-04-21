// Scroll fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .team-card, .step-item').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Animate score bars on load
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelectorAll('.score-fill').forEach(el => {
            const w = el.style.width;
            el.style.width = '0%';
            setTimeout(() => { el.style.width = w; }, 100);
        });
    }, 400);
});