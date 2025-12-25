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
// Fade-in Animation on Scroll
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.experience-card, .project-card');

    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
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
// View All Experience/Projects Functionality
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Experience View All
    const viewAllExperienceBtn = document.getElementById('viewAllExperience');
    const experienceCards = document.querySelectorAll('.experience-card');

    if (viewAllExperienceBtn && experienceCards.length <= 3) {
        viewAllExperienceBtn.classList.add('hidden');
    }

    if (viewAllExperienceBtn) {
        viewAllExperienceBtn.addEventListener('click', () => {
            experienceCards.forEach((card, index) => {
                if (index >= 3) {
                    card.classList.add('show');
                }
            });
            viewAllExperienceBtn.classList.add('hidden');
        });
    }

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
