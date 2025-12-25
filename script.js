// ===========================
// Smooth Scroll for Navigation Links
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const navHeight = document.querySelector('.nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===========================
// Active Navigation Link on Scroll
// ===========================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNavLink() {
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);

// ===========================
// Navbar Scroll Effect
// ===========================
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 50) {
        nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ===========================
// Cool Loading Animations
// ===========================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger delay for multiple elements
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

// Animate section titles with drawing underline
const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Animate section titles (draw underlines)
    const titles = document.querySelectorAll('.section-title');
    titles.forEach(title => {
        titleObserver.observe(title);
    });

    // Animate cards with stagger effect
    const cards = document.querySelectorAll('.experience-card, .project-card');
    cards.forEach((card, index) => {
        // Add transition delay based on index
        card.style.transitionDelay = `${index * 0.1}s`;
        animationObserver.observe(card);
    });

    // Animate other elements
    const fadeElements = document.querySelectorAll('.fade-in-element');
    fadeElements.forEach(element => {
        animationObserver.observe(element);
    });

    // Initial load animation for hero
    setTimeout(() => {
        const heroTitle = document.querySelector('.hero .section-title, .hero-name');
        if (heroTitle) {
            heroTitle.classList.add('animate-in');
        }
    }, 300);
});

// ===========================
// Contact Form Validation (if needed later)
// ===========================
// Add form validation here when contact form is implemented

// ===========================
// Performance: Reduce motion for users who prefer it
// ===========================
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
}

// ===========================
// View All Projects Functionality
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Projects View All
    const viewAllProjectsBtn = document.getElementById('viewAllProjects');
    const projectCards = document.querySelectorAll('.project-card');

    if (viewAllProjectsBtn && projectCards.length <= 3) {
        viewAllProjectsBtn.classList.add('hidden');
    }

    if (viewAllProjectsBtn) {
        viewAllProjectsBtn.addEventListener('click', () => {
            projectCards.forEach((card, index) => {
                if (index >= 3) {
                    card.classList.add('show');
                }
            });
            viewAllProjectsBtn.classList.add('hidden');
        });
    }
});
