// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Hide canvas initially (hero section only shows video)
canvas.style.opacity = '0';

// Camera positioning
camera.position.z = 5;
camera.position.y = 1;

// Add particles for visual effect (STARS!)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.025,
    color: 0x667eea,
    transparent: true,
    opacity: 0.8
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Scroll Animation Variables
let scrollY = window.scrollY;
const heroSection = document.querySelector('.hero');

// Update scroll position and canvas visibility
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;

    // Show/hide 3D canvas based on scroll position
    // Only show after scrolling past hero section
    if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrollPastHero = scrollY / heroHeight;

        if (scrollPastHero > 0.9) {
            // Fade in canvas as we approach end of hero section
            const fadeProgress = Math.min((scrollPastHero - 0.2) / 0.1, 1);
            canvas.style.opacity = fadeProgress.toString();
        } else {
            // Keep canvas hidden in hero section
            canvas.style.opacity = '0';
        }
    }
});

// Animation function
function animateOnScroll() {
    // Calculate scroll progress (0 to 1)
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrollY / scrollHeight, 1);

    // Animate camera
    camera.position.y = 1 - scrollProgress * 0.5;
    camera.position.z = 5 - scrollProgress * 1;

    // Rotate particles
    particlesMesh.rotation.y = scrollProgress * Math.PI * 2;
    particlesMesh.rotation.x = scrollProgress * Math.PI;

    // Add subtle rotation to entire scene
    scene.rotation.y = Math.sin(scrollProgress * Math.PI) * 0.1;
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    animateOnScroll();
    renderer.render(scene, camera);
}

animate();

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('✨ Starfield background loaded');

// ========================================
// 3D MODEL VIEWER MODAL
// ========================================

let modelScene, modelCamera, modelRenderer, modelControls;
let model3DAnimationId;
let modelLoaded = false;

const modal = document.getElementById('model3DModal');
const openBtn = document.getElementById('view3DModelBtn');
const closeBtn = document.getElementById('closeModalBtn');
const modelCanvas = document.getElementById('model3DCanvas');
const loadingText = document.getElementById('modelLoadingText');

// Open modal and initialize 3D viewer (button removed, but keeping code for potential future use)
if (openBtn) {
    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (!modelLoaded) {
            init3DModelViewer();
        } else {
            animate3DModel();
        }
    });
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    if (model3DAnimationId) {
        cancelAnimationFrame(model3DAnimationId);
        model3DAnimationId = null;
    }
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Close on background click
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Initialize 3D Model Viewer
function init3DModelViewer() {
    // Create scene
    modelScene = new THREE.Scene();
    modelScene.background = new THREE.Color(0x0a0a0a);

    // Create camera
    const container = modelCanvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    modelCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    modelCamera.position.set(2, 2, 5);

    // Create renderer
    modelRenderer = new THREE.WebGLRenderer({
        canvas: modelCanvas,
        antialias: true,
        alpha: true
    });
    modelRenderer.setSize(width, height);
    modelRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    modelRenderer.shadowMap.enabled = true;
    modelRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    modelScene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    modelScene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x667eea, 0.4);
    directionalLight2.position.set(-5, 3, -5);
    modelScene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x764ba2, 0.3);
    directionalLight3.position.set(0, -5, 0);
    modelScene.add(directionalLight3);

    // Add OrbitControls
    modelControls = new THREE.OrbitControls(modelCamera, modelRenderer.domElement);
    modelControls.enableDamping = true;
    modelControls.dampingFactor = 0.05;
    modelControls.autoRotate = true;
    modelControls.autoRotateSpeed = 2.0;
    modelControls.minDistance = 2;
    modelControls.maxDistance = 10;

    // Load 3D Model
    const loader = new THREE.GLTFLoader();

    // Try to load the model - update 'model.gltf' with actual filename when provided
    loader.load(
        'FullCAD.gltf', // 3D model file
        function (gltf) {
            const model = gltf.scene;

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.multiplyScalar(scale);

            model.position.sub(center.multiplyScalar(scale));

            // Enable shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Enhance materials
                    if (child.material) {
                        child.material.metalness = 0.3;
                        child.material.roughness = 0.6;
                    }
                }
            });

            model.rotation.z = Math.PI / 2;

            modelScene.add(model);
            modelLoaded = true;
            loadingText.style.display = 'none';

            animate3DModel();
        },
        function (xhr) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
            loadingText.querySelector('div:first-child').textContent = `Loading 3D Model... ${percent}%`;
        },
        function (error) {
            console.error('Error loading 3D model:', error);
            loadingText.innerHTML = '<div style="color: #ff6b6b;">Model not found. Please add your 3D model file to the project.</div><div style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 1rem;">Expected filename: FullCAD.gltf</div>';
        }
    );

    // Handle window resize
    window.addEventListener('resize', onModelWindowResize, false);

    animate3DModel();
}

function onModelWindowResize() {
    if (!modelCamera || !modelRenderer) return;

    const container = modelCanvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    modelCamera.aspect = width / height;
    modelCamera.updateProjectionMatrix();
    modelRenderer.setSize(width, height);
}

function animate3DModel() {
    model3DAnimationId = requestAnimationFrame(animate3DModel);

    if (modelControls) {
        modelControls.update();
    }

    if (modelRenderer && modelScene && modelCamera) {
        modelRenderer.render(modelScene, modelCamera);
    }
}

// Add hover effect to button (if it exists)
if (openBtn) {
    openBtn.addEventListener('mouseenter', () => {
        openBtn.style.transform = 'translateY(-3px)';
        openBtn.style.boxShadow = '0 15px 40px rgba(99, 102, 241, 0.4)';
    });

    openBtn.addEventListener('mouseleave', () => {
        openBtn.style.transform = 'translateY(0)';
        openBtn.style.boxShadow = 'none';
    });
}

// Add hover effect to close button (if it exists)
if (closeBtn) {
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        closeBtn.style.transform = 'scale(1) rotate(0deg)';
    });
}

console.log('✨ 3D Model Viewer initialized');

// ========================================
// MECHANICAL SLIDESHOW
// ========================================

let mechSlideIndex = 1;
let mechSlideTimer;

// Initialize slideshow
function initMechSlideshow() {
    mechShowSlides(mechSlideIndex);
    // Auto-play every 4 seconds
    mechSlideTimer = setInterval(() => {
        mechChangeslide(1);
    }, 4000);
}

// Next/previous controls
function mechChangeslide(n) {
    clearInterval(mechSlideTimer);
    mechShowSlides(mechSlideIndex += n);
    // Restart auto-play
    mechSlideTimer = setInterval(() => {
        mechChangeslide(1);
    }, 4000);
}

// Thumbnail image controls
function mechCurrentSlide(n) {
    clearInterval(mechSlideTimer);
    mechShowSlides(mechSlideIndex = n);
    // Restart auto-play
    mechSlideTimer = setInterval(() => {
        mechChangeslide(1);
    }, 4000);
}

function mechShowSlides(n) {
    let slides = document.getElementsByClassName("mech-slide");
    let dots = document.getElementsByClassName("mech-dot");

    if (n > slides.length) { mechSlideIndex = 1 }
    if (n < 1) { mechSlideIndex = slides.length }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        slides[i].style.opacity = "0";
    }

    for (let i = 0; i < dots.length; i++) {
        dots[i].style.background = "rgba(255,255,255,0.5)";
        dots[i].style.transform = "scale(1)";
    }

    if (slides[mechSlideIndex - 1]) {
        slides[mechSlideIndex - 1].style.display = "block";
        setTimeout(() => {
            slides[mechSlideIndex - 1].style.opacity = "1";
        }, 10);
    }

    if (dots[mechSlideIndex - 1]) {
        dots[mechSlideIndex - 1].style.background = "rgba(99, 102, 241, 1)";
        dots[mechSlideIndex - 1].style.transform = "scale(1.2)";
    }
}

// Add hover effects to arrows
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.querySelector('.mech-prev');
    const nextBtn = document.querySelector('.mech-next');

    if (prevBtn) {
        prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.background = 'rgba(99, 102, 241, 1)';
            prevBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.background = 'rgba(99, 102, 241, 0.8)';
            prevBtn.style.transform = 'translateY(-50%) scale(1)';
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.background = 'rgba(99, 102, 241, 1)';
            nextBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.background = 'rgba(99, 102, 241, 0.8)';
            nextBtn.style.transform = 'translateY(-50%) scale(1)';
        });
    }

    // Initialize slideshow
    initMechSlideshow();
});

console.log('✨ Mechanical slideshow initialized');

// ========================================
// EMBEDDED 3D MODEL VIEWER
// ========================================

let embeddedScene, embeddedCamera, embeddedRenderer, embeddedControls;
let embeddedAnimationId;

function initEmbedded3DViewer() {
    const canvas = document.getElementById('embedded3DCanvas');
    const loadingText = document.getElementById('embedded3DLoadingText');
    const overlay = document.getElementById('embedded3DOverlay');

    if (!canvas) return;

    // Create scene
    embeddedScene = new THREE.Scene();
    embeddedScene.background = new THREE.Color(0x0a0a0a);

    // Get container dimensions
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create camera
    embeddedCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    embeddedCamera.position.set(3, 2, 4);

    // Create renderer
    embeddedRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    embeddedRenderer.setSize(width, height);
    embeddedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    embeddedRenderer.shadowMap.enabled = true;
    embeddedRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lights with purple/blue accent matching the theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    embeddedScene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    embeddedScene.add(mainLight);

    const accentLight1 = new THREE.DirectionalLight(0x667eea, 0.5);
    accentLight1.position.set(-5, 3, -5);
    embeddedScene.add(accentLight1);

    const accentLight2 = new THREE.DirectionalLight(0x764ba2, 0.4);
    accentLight2.position.set(0, -3, 5);
    embeddedScene.add(accentLight2);

    // Add OrbitControls (initially disabled to prevent scroll hijacking)
    embeddedControls = new THREE.OrbitControls(embeddedCamera, embeddedRenderer.domElement);
    embeddedControls.enableDamping = true;
    embeddedControls.dampingFactor = 0.05;
    embeddedControls.autoRotate = true;
    embeddedControls.autoRotateSpeed = 1.5;
    embeddedControls.minDistance = 2;
    embeddedControls.maxDistance = 15;
    embeddedControls.target.set(0, 0, 0);

    // Disable user interaction until overlay is clicked (but keep auto-rotate working)
    embeddedControls.enableRotate = false;
    embeddedControls.enableZoom = false;
    embeddedControls.enablePan = false;

    // Load 3D Model
    const loader = new THREE.GLTFLoader();

    console.log('Starting to load FullCAD.gltf...');
    loader.load(
        'FullCAD.gltf',
        function (gltf) {
            console.log('GLTF file loaded successfully!');
            const model = gltf.scene;

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim;
            model.scale.multiplyScalar(scale);

            model.position.sub(center.multiplyScalar(scale));

            // Enable shadows and enhance materials
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        child.material.metalness = 0.3;
                        child.material.roughness = 0.6;
                    }
                }
            });

            embeddedScene.add(model);
            if (loadingText) loadingText.style.display = 'none';

            // Show overlay once model is loaded
            if (overlay) {
                overlay.style.display = 'flex';
            }

            animateEmbedded3D();
        },
        function (xhr) {
            console.log(`Loading progress: ${xhr.loaded} / ${xhr.total} bytes`);
            if (loadingText) {
                if (xhr.total > 0) {
                    const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                    loadingText.querySelector('div:first-child').textContent = `Loading 3D Model... ${percent}%`;
                } else {
                    const mb = (xhr.loaded / 1024 / 1024).toFixed(2);
                    loadingText.querySelector('div:first-child').textContent = `Loading 3D Model... ${mb}MB`;
                }
            }
        },
        function (error) {
            console.error('Error loading embedded 3D model:', error);
            if (loadingText) {
                loadingText.innerHTML = '<div style="color: #ff6b6b;">Model not found</div><div style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 1rem;">Add FullCAD.gltf to load the 3D model</div>';
            }
        }
    );

    // Handle window resize
    function onEmbeddedResize() {
        if (!embeddedCamera || !embeddedRenderer) return;

        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        embeddedCamera.aspect = width / height;
        embeddedCamera.updateProjectionMatrix();
        embeddedRenderer.setSize(width, height);
    }

    window.addEventListener('resize', onEmbeddedResize, false);

    // Handle overlay click to enable controls
    if (overlay) {
        overlay.addEventListener('click', () => {
            // Enable user controls
            if (embeddedControls) {
                embeddedControls.enableRotate = true;
                embeddedControls.enableZoom = true;
                embeddedControls.enablePan = true;
            }

            // Fade out overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        });
    }

    animateEmbedded3D();
}

function animateEmbedded3D() {
    embeddedAnimationId = requestAnimationFrame(animateEmbedded3D);

    if (embeddedControls) {
        embeddedControls.update();
    }

    if (embeddedRenderer && embeddedScene && embeddedCamera) {
        embeddedRenderer.render(embeddedScene, embeddedCamera);
    }
}

// Initialize embedded viewer when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is fully ready
    setTimeout(initEmbedded3DViewer, 100);
});

console.log('✨ Embedded 3D viewer initialized');
