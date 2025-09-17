// Animation Controller
class AnimationController {
    constructor() {
        this.lenis = null;
        this.isLoaded = false;
        this.init();
    }

    init() {
        if (ENV.PREFERS_REDUCED_MOTION) {
            this.disableAnimations();
            return;
        }

        this.initGSAP();
        this.initLenis();
        this.initCustomCursor();
        this.setupScrollTriggers();
    }

    initGSAP() {
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger, TextPlugin);
        
        // GSAP configuration
        gsap.config({ 
            force3D: true,
            nullTargetWarn: false 
        });
    }

    initLenis() {
        if (typeof Lenis === 'undefined' || !CONFIG.FEATURES.SMOOTH_SCROLLING) {
            console.warn('Lenis not loaded or smooth scrolling disabled - using normal scrolling');
            // Use normal scrolling behavior
            document.documentElement.style.scrollBehavior = 'auto';
            return;
        }

        try {
            this.lenis = new Lenis({
                duration: CONFIG.ANIMATION.SCROLL_DURATION / 1000,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
            });

            const raf = (time) => {
                this.lenis.raf(time);
                requestAnimationFrame(raf);
            };
            requestAnimationFrame(raf);
        } catch (error) {
            console.warn('Failed to initialize Lenis, using fallback:', error);
            document.documentElement.style.scrollBehavior = 'auto';
        }
    }

    initCustomCursor() {
        if (!CONFIG.FEATURES.CUSTOM_CURSOR || ENV.IS_MOBILE) {
            return;
        }

        const cursor = document.querySelector('.cursor');
        const cursorFollower = document.querySelector('.cursor-follower');

        if (!cursor || !cursorFollower) return;

        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1
            });
            gsap.to(cursorFollower, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.3
            });
        });

        // Cursor interactions
        document.querySelectorAll('a, button, .cursor-pointer').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 1.5, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, duration: 0.3 });
            });
        });
    }

    setupScrollTriggers() {
        if (typeof ScrollTrigger === 'undefined') return;

        // Navigation scroll effect
        ScrollTrigger.create({
            start: 'top -80',
            end: 99999,
            toggleClass: { className: 'nav-glass', targets: '#navbar' }
        });

        // Animate elements on scroll
        this.animateOnScroll();
        this.setupParallax();
        this.setupMagneticEffect();
    }

    animateOnScroll() {
        gsap.utils.toArray('[data-animate]').forEach(element => {
            const animationType = element.dataset.animate;
            const delay = parseFloat(element.dataset.delay) || 0;
            
            let animation = this.getAnimationConfig(animationType);
            
            if (animation) {
                gsap.to(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    },
                    ...animation,
                    delay: delay / 1000
                });
            }
        });
    }

    getAnimationConfig(type) {
        const animations = {
            'fadeInUp': { opacity: 1, y: 0, duration: 1 },
            'slideInLeft': { opacity: 1, x: 0, duration: 1 },
            'slideInRight': { opacity: 1, x: 0, duration: 1 },
            'slideUp': { opacity: 1, y: 0, duration: 0.8 },
            'reveal': { opacity: 1, y: 0, clipPath: 'inset(0 0 0 0)', duration: 1.2 },
            'scaleIn': { opacity: 1, scale: 1, duration: 0.8 }
        };
        
        return animations[type] || null;
    }

    setupParallax() {
        if (!CONFIG.FEATURES.PARALLAX_EFFECTS) return;

        gsap.utils.toArray('.parallax-element').forEach(element => {
            gsap.to(element, {
                yPercent: -50,
                ease: "none",
                scrollTrigger: {
                    trigger: element,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        });
    }

    setupMagneticEffect() {
        document.querySelectorAll('.magnetic-element, .category-card, .btn-advanced').forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                gsap.to(element, {
                    x: x * 0.1,
                    y: y * 0.1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        });
    }

    playLoadingSequence() {
        if (!CONFIG.FEATURES.LOADING_ANIMATION) {
            this.hideLoadingScreen();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => this.hideLoadingScreen()
        });
        
        tl.to('#loadingLogo', { opacity: 1, y: 0, duration: 1 })
          .to('#loadingBar', { width: '100%', duration: 1.5 }, '-=0.5')
          .to('#loadingScreen', { opacity: 0, duration: 0.8 }, '+=0.5');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        this.playEntranceAnimation();
        this.isLoaded = true;
    }

    playEntranceAnimation() {
        const tl = gsap.timeline();
        
        tl.to('#navbar', { y: 0, duration: 0.8 })
          .to('#heroTitle', { opacity: 1, y: 0, duration: 1 }, '-=0.5')
          .to('#heroSubtitle', { opacity: 1, y: 0, duration: 1 }, '-=0.7')
          .to('#heroCTA', { opacity: 1, scale: 1, duration: 0.8 }, '-=0.5')
          .to('#scrollIndicator', { opacity: 1, duration: 0.5 }, '-=0.3');
    }

    animateClick(element) {
        gsap.to(element, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });
    }

    animateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            gsap.to(cartCount, {
                scale: 1.3,
                duration: 0.2,
                yoyo: true,
                repeat: 1
            });
        }
    }

    slideToggle(element, show = true) {
        if (show) {
            gsap.to(element, { x: 0, duration: 0.5 });
        } else {
            gsap.to(element, { x: '100%', duration: 0.5 });
        }
    }

    disableAnimations() {
        // Disable all animations for users who prefer reduced motion
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility methods
    scrollTo(target, options = {}) {
        if (this.lenis) {
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            this.lenis.scrollTo(element, {
                offset: options.offset || -80,
                duration: options.duration || 2,
                ...options
            });
        } else {
            // Fallback for browsers without Lenis
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            if (element) {
                element.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    preloadImages() {
        const images = [
            'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

// Initialize animation controller when DOM is ready
let animationController;
document.addEventListener('DOMContentLoaded', () => {
    animationController = new AnimationController();
});

// Start loading sequence when window is fully loaded
window.addEventListener('load', () => {
    if (animationController) {
        animationController.playLoadingSequence();
        animationController.preloadImages();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}