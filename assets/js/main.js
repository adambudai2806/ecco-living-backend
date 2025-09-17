// Main Application Logic
class EccoLivingApp {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        this.init();
    }

    async init() {
        try {
            await this.waitForDOMReady();
            this.bindGlobalEvents();
            this.initializeComponents();
            this.setupCategoryInteractions();
            this.setupAccessibility();
            this.isInitialized = true;
            
            console.log('Ecco Living App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorBoundary();
        }
    }

    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    bindGlobalEvents() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 16); // ~60fps
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Global error handling
        window.addEventListener('error', (event) => {
            this.handleError(event);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    initializeComponents() {
        // Store references to global components
        this.components = {
            navigation: window.navigationComponent,
            cart: window.cartComponent,
            newsletter: window.newsletterComponent,
            animation: window.animationController
        };

        // Initialize product interactions
        this.initProductInteractions();
    }

    initHeroCarousel() {
        // Hero Carousel functionality
        this.heroCarousel = new HeroCarousel();
    }

    initProductInteractions() {
        // Sample product data (this would come from API in real implementation)
        this.sampleProducts = {
            'glass-shower-screen': {
                id: 'glass-shower-screen-001',
                name: 'Premium Glass Shower Screen',
                price: 850,
                image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Luxury tempered glass shower screen',
                category: 'bathrooms'
            },
            'aluminium-fence': {
                id: 'aluminium-fence-001',
                name: 'Modern Aluminium Pool Fence',
                price: 1200,
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Safety-compliant pool fencing',
                category: 'fencing'
            },
            'composite-decking': {
                id: 'composite-decking-001',
                name: 'Premium Composite Decking',
                price: 95,
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Weather-resistant composite decking per sqm',
                category: 'flooring'
            }
        };

        // Add "Add to Cart" buttons to product cards (demo functionality)
        this.addProductButtons();
    }

    addProductButtons() {
        document.querySelectorAll('.category-card').forEach((card, index) => {
            const productKeys = Object.keys(this.sampleProducts);
            const productKey = productKeys[index];
            const product = this.sampleProducts[productKey];

            if (product) {
                // Create add to cart button
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300';
                buttonContainer.innerHTML = `
                    <button class="add-to-cart-btn bg-accent text-white p-3 rounded-full shadow-lg hover:bg-accent-dark transition-colors duration-300" 
                            data-product="${productKey}"
                            aria-label="Add ${product.name} to cart">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-8 0h8"></path>
                        </svg>
                    </button>
                `;

                card.querySelector('.relative').appendChild(buttonContainer);

                // Bind click event
                const button = buttonContainer.querySelector('.add-to-cart-btn');
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleAddToCart(productKey);
                });
            }
        });
    }

    handleAddToCart(productKey) {
        const product = this.sampleProducts[productKey];
        if (product && this.components.cart) {
            this.components.cart.addItem(product);
        }
    }

    setupCategoryInteractions() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Skip if clicking on add to cart button
                if (e.target.closest('.add-to-cart-btn')) {
                    return;
                }

                const categoryName = card.querySelector('h3').textContent.toLowerCase()
                    .replace(/ & /g, '-')
                    .replace(/ /g, '-');
                
                this.handleCategoryClick(categoryName, card);
            });

            // Add keyboard navigation
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    handleCategoryClick(categoryName, element) {
        if (this.components.animation) {
            this.components.animation.animateClick(element);
        }
        
        // In a real implementation, this would navigate to category page
        console.log(`Navigating to ${categoryName} category`);
        
        // Show demo modal or redirect
        this.showCategoryModal(categoryName);
    }

    showCategoryModal(categoryName) {
        // Create a simple modal to demonstrate category interaction
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 relative">
                <button class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" onclick="this.closest('.fixed').remove()">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <h3 class="text-2xl font-display font-medium mb-4 capitalize">${categoryName.replace('-', ' & ')}</h3>
                <p class="text-gray-600 mb-6">Explore our curated collection of premium ${categoryName.replace('-', ' & ').toLowerCase()} solutions.</p>
                <div class="flex gap-4">
                    <button class="flex-1 bg-accent text-white py-3 px-6 rounded-full hover:bg-accent-dark transition-colors" onclick="this.closest('.fixed').remove()">
                        View Collection
                    </button>
                    <button class="flex-1 border border-gray-300 py-3 px-6 rounded-full hover:bg-gray-50 transition-colors" onclick="this.closest('.fixed').remove()">
                        Get Quote
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        gsap.fromTo(modal, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.3 }
        );
        
        gsap.fromTo(modal.querySelector('.bg-white'), 
            { scale: 0.8, y: 50 }, 
            { scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
        );
    }

    setupAccessibility() {
        // Add keyboard navigation for interactive elements
        document.querySelectorAll('button, a, [tabindex]').forEach(element => {
            if (!element.hasAttribute('aria-label') && !element.textContent.trim()) {
                console.warn('Interactive element missing aria-label:', element);
            }
        });

        // Add focus outline for keyboard navigation
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible:focus {
                outline: 2px solid #c9a96e !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);

        // Handle skip link
        const skipLink = document.querySelector('a[href="#main-content"]');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    handleResize() {
        // Close mobile menu on desktop resize
        if (window.innerWidth >= 768 && this.components.navigation) {
            this.components.navigation.closeMobileMenu();
        }

        // Close cart on mobile resize
        if (window.innerWidth < 480 && this.components.cart && this.components.cart.isOpen) {
            this.components.cart.close();
        }

        // Refresh ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }

    handleScroll() {
        // Add any scroll-based functionality here
        // For example, updating active navigation state
        this.updateActiveNavigation();
    }

    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSection}`) {
                link.classList.add('text-accent');
            } else {
                link.classList.remove('text-accent');
            }
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause animations or videos
            this.pauseAnimations();
        } else {
            // Page is visible, resume animations
            this.resumeAnimations();
        }
    }

    pauseAnimations() {
        if (this.components.animation && this.components.animation.lenis) {
            // Pause smooth scrolling when tab is not active
            this.components.animation.lenis.stop();
        }
    }

    resumeAnimations() {
        if (this.components.animation && this.components.animation.lenis) {
            // Resume smooth scrolling when tab becomes active
            this.components.animation.lenis.start();
        }
    }

    handleKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    // Future: Open search modal
                    break;
            }
        }

        // Escape key handling
        if (e.key === 'Escape') {
            // Close any open modals or menus
            if (this.components.cart && this.components.cart.isOpen) {
                this.components.cart.close();
            }
            if (this.components.navigation && this.components.navigation.mobileMenuOpen) {
                this.components.navigation.closeMobileMenu();
            }
            
            // Close any modals
            const modal = document.querySelector('.fixed.inset-0.z-50');
            if (modal && modal.remove) {
                modal.remove();
            }
        }
    }

    handleError(event) {
        console.error('Application error:', event.error);
        
        // Track error for analytics (in real implementation)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: event.error.message,
                fatal: false
            });
        }
    }

    showErrorBoundary() {
        const errorBoundary = document.getElementById('errorBoundary');
        if (errorBoundary) {
            errorBoundary.classList.remove('hidden');
        }
    }

    // Utility methods
    async loadProducts(category = null) {
        // This would fetch products from API
        try {
            const url = category ? 
                `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.PRODUCTS}?category=${category}` : 
                `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.PRODUCTS}`;
            
            // Simulated API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return Object.values(this.sampleProducts).filter(product => 
                !category || product.category === category
            );
        } catch (error) {
            console.error('Failed to load products:', error);
            return [];
        }
    }

    async subscribeToNewsletter(email) {
        // This would integrate with actual newsletter service
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.NEWSLETTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error('Newsletter subscription failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error;
        }
    }

    // Public API methods
    getCartSummary() {
        return this.components.cart ? this.components.cart.getSummary() : null;
    }

    addToCart(product) {
        return this.components.cart ? this.components.cart.addItem(product) : false;
    }

    navigateToSection(sectionId) {
        if (this.components.animation) {
            this.components.animation.scrollTo(`#${sectionId}`);
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EccoLivingApp();
});

// Make app globally accessible for debugging
window.EccoLiving = {
    app: () => app,
    config: CONFIG,
    env: ENV
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EccoLivingApp;
}