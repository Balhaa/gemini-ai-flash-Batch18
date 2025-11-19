// Animasi scroll untuk elemen dengan kelas .animated
const animatedElements = document.querySelectorAll('.animated');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, {
    threshold: 0.2
});

animatedElements.forEach(el => observer.observe(el));

// Header transparency saat scroll
const header = document.querySelector('header');
const toggleHeaderState = () => {
    if (window.scrollY > 60) {
        header.classList.add('is-scrolled');
    } else {
        header.classList.remove('is-scrolled');
    }
};

toggleHeaderState();
window.addEventListener('scroll', toggleHeaderState);

// Counter animasi untuk statistik
const statValues = document.querySelectorAll('.stat-value');
const countersObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = Number(el.dataset.target || 0);
            let current = 0;
            const increment = target / 80;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    el.textContent = Math.round(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    el.textContent = target.toLocaleString('id-ID');
                }
            };

            updateCounter();
            countersObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statValues.forEach(value => countersObserver.observe(value));

// Slider sederhana untuk testimoni
const slider = document.querySelector('#reviews .reviews-slider');
if (slider) {
    const cards = Array.from(slider.querySelectorAll('.review-card'));
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');
    let currentIndex = 0;

    const activateCard = (index) => {
        cards.forEach((card, idx) => {
            if (idx === index) {
                card.classList.add('is-active');
            } else {
                card.classList.remove('is-active');
            }
        });
    };

    const goTo = (direction) => {
        currentIndex = (currentIndex + direction + cards.length) % cards.length;
        activateCard(currentIndex);
    };

    activateCard(currentIndex);

    prevBtn?.addEventListener('click', () => goTo(-1));
    nextBtn?.addEventListener('click', () => goTo(1));
}