// Hero Carousel Component
class HeroCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.dots = document.querySelectorAll('.carousel-dot');
        this.totalSlides = this.slides.length;
        this.autoplayInterval = null;
        
        if (this.totalSlides > 0) {
            this.init();
        }
    }
    
    init() {
        this.bindEvents();
        this.startAutoplay();
        
        // Pause autoplay on hover
        const carousel = document.querySelector('.hero-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopAutoplay());
            carousel.addEventListener('mouseleave', () => this.startAutoplay());
        }
    }
    
    bindEvents() {
        // Bind dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });
    }
    
    goToSlide(index) {
        if (index === this.currentSlide) return;
        
        // Remove active class from current slide and dot
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.remove('active');
        }
        if (this.dots[this.currentSlide]) {
            this.dots[this.currentSlide].classList.remove('active');
        }
        
        // Update current slide
        this.currentSlide = index;
        
        // Add active class to new slide and dot
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.add('active');
        }
        if (this.dots[this.currentSlide]) {
            this.dots[this.currentSlide].classList.add('active');
        }
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevIndex);
    }
    
    startAutoplay() {
        this.stopAutoplay(); // Clear any existing interval
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
    
    destroy() {
        this.stopAutoplay();
        // Remove event listeners if needed
    }
}

// Enhanced Navigation Component with Multi-level Support
class NavigationComponent {
    constructor() {
        this.mobileMenuOpen = false;
        this.activeDropdowns = new Set();
        this.activeSubmenus = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMobileInteractions();
        this.setupDesktopHovers();
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMobileMenu = document.getElementById('closeMobileMenu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', () => this.closeMobileMenu());
        }

        // Click outside to close mobile menu
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen && !e.target.closest('#mobileMenu') && !e.target.closest('#mobileMenuBtn')) {
                this.closeMobileMenu();
            }
        });

        // Navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleAnchorClick(e));
        });
        
        // Escape key to close menus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMenus();
            }
        });
    }
    
    setupMobileInteractions() {
        // Mobile dropdown triggers
        const mobileNavTriggers = document.querySelectorAll('.mobile-nav-trigger');
        mobileNavTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const target = trigger.getAttribute('data-target');
                this.toggleMobileDropdown(target, trigger);
            });
        });
        
        // Mobile submenu triggers
        const mobileSubmenuTriggers = document.querySelectorAll('.mobile-submenu-trigger');
        mobileSubmenuTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const target = trigger.getAttribute('data-target');
                this.toggleMobileSubmenu(target, trigger);
            });
        });
    }
    
    setupDesktopHovers() {
        // Enhanced desktop mega menu interactions
        const megaMenuItems = document.querySelectorAll('.mega-menu-item');
        
        megaMenuItems.forEach(item => {
            const megaMenu = item.querySelector('.mega-menu');
            let hoverTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                this.showDesktopMenu(megaMenu);
            });
            
            item.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    this.hideDesktopMenu(megaMenu);
                }, 100);
            });
        });
    }
    
    showDesktopMenu(menu) {
        if (menu) {
            menu.classList.add('nav-fade-in');
            // Remove animation class after completion
            setTimeout(() => {
                menu.classList.remove('nav-fade-in');
            }, 300);
        }
    }
    
    hideDesktopMenu(menu) {
        // Desktop menus are handled via CSS hover states
    }
    
    toggleMobileDropdown(targetId, trigger) {
        const dropdown = trigger.closest('.mobile-dropdown');
        const content = document.getElementById(targetId);
        const arrow = dropdown.querySelector('.mobile-dropdown-arrow');
        
        if (dropdown && content) {
            const isActive = this.activeDropdowns.has(targetId);
            
            if (isActive) {
                // Close dropdown
                dropdown.classList.remove('active');
                content.classList.add('hidden');
                this.activeDropdowns.delete(targetId);
                
                // Close all submenus in this dropdown
                const submenus = dropdown.querySelectorAll('.mobile-submenu');
                submenus.forEach(submenu => {
                    const submenuId = submenu.querySelector('.mobile-submenu-trigger').getAttribute('data-target');
                    this.closeMobileSubmenu(submenuId, submenu.querySelector('.mobile-submenu-trigger'));
                });
            } else {
                // Open dropdown
                dropdown.classList.add('active');
                content.classList.remove('hidden');
                this.activeDropdowns.add(targetId);
                
                // Add slide animation
                content.classList.add('nav-slide-in');
                setTimeout(() => {
                    content.classList.remove('nav-slide-in');
                }, 400);
            }
        }
    }
    
    toggleMobileSubmenu(targetId, trigger) {
        const submenu = trigger.closest('.mobile-submenu');
        const content = document.getElementById(targetId);
        
        if (submenu && content) {
            const isActive = this.activeSubmenus.has(targetId);
            
            if (isActive) {
                this.closeMobileSubmenu(targetId, trigger);
            } else {
                this.openMobileSubmenu(targetId, submenu, content);
            }
        }
    }
    
    openMobileSubmenu(targetId, submenu, content) {
        submenu.classList.add('active');
        content.classList.remove('hidden');
        this.activeSubmenus.add(targetId);
        
        // Add slide animation
        content.classList.add('nav-slide-in');
        setTimeout(() => {
            content.classList.remove('nav-slide-in');
        }, 300);
    }
    
    closeMobileSubmenu(targetId, trigger) {
        const submenu = trigger.closest('.mobile-submenu');
        const content = document.getElementById(targetId);
        
        if (submenu && content) {
            submenu.classList.remove('active');
            content.classList.add('hidden');
            this.activeSubmenus.delete(targetId);
        }
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (mobileMenu) {
            if (this.mobileMenuOpen) {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent body scroll
            } else {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = ''; // Restore body scroll
                this.closeAllMobileMenus();
            }
        }
        
        // Update button state
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', this.mobileMenuOpen.toString());
            
            // Animate hamburger menu
            if (this.mobileMenuOpen) {
                gsap.to(mobileMenuBtn.children, { 
                    rotation: 45, 
                    y: [0, 6, -6], 
                    duration: 0.3 
                });
            } else {
                gsap.to(mobileMenuBtn.children, { 
                    rotation: 0, 
                    y: 0, 
                    duration: 0.3 
                });
            }
        }
    }
    
    closeAllMobileMenus() {
        // Close all dropdowns and submenus
        this.activeDropdowns.forEach(dropdownId => {
            const dropdown = document.querySelector(`[data-target="${dropdownId}"]`)?.closest('.mobile-dropdown');
            const content = document.getElementById(dropdownId);
            
            if (dropdown && content) {
                dropdown.classList.remove('active');
                content.classList.add('hidden');
            }
        });
        
        this.activeSubmenus.forEach(submenuId => {
            const submenu = document.querySelector(`[data-target="${submenuId}"]`)?.closest('.mobile-submenu');
            const content = document.getElementById(submenuId);
            
            if (submenu && content) {
                submenu.classList.remove('active');
                content.classList.add('hidden');
            }
        });
        
        this.activeDropdowns.clear();
        this.activeSubmenus.clear();
    }
    
    closeAllMenus() {
        this.closeMobileMenu();
    }

    handleAnchorClick(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement && animationController) {
            animationController.scrollTo(targetElement);
        }
        
        // Close mobile menu if open
        if (this.mobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        if (this.mobileMenuOpen) {
            this.mobileMenuOpen = false;
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
                this.closeAllMobileMenus();
            }
            
            if (mobileMenuBtn) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                gsap.to(mobileMenuBtn.children, { 
                    rotation: 0, 
                    y: 0, 
                    duration: 0.3 
                });
            }
        }
    }
}

class ShoppingCartComponent {
    constructor() {
        this.isOpen = false;
        this.items = [];
        this.total = 0;
        this.init();
    }

    init() {
        this.loadCart();
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const cartBtn = document.getElementById('cartBtn');
        const cartSidebar = document.getElementById('cartSidebar');
        const cartBackdrop = document.getElementById('cartBackdrop');
        const closeCart = document.getElementById('closeCart');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggle());
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => this.close());
        }

        if (cartBackdrop) {
            cartBackdrop.addEventListener('click', () => this.close());
        }

        // Listen for cart updates
        document.addEventListener('cart:update', () => this.updateDisplay());
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        const cartSidebar = document.getElementById('cartSidebar');
        const cartBackdrop = document.getElementById('cartBackdrop');

        if (cartSidebar && animationController) {
            animationController.slideToggle(cartSidebar, true);
        }

        if (cartBackdrop) {
            gsap.to(cartBackdrop, { 
                opacity: 1, 
                pointerEvents: 'auto', 
                duration: 0.3 
            });
        }

        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        const cartSidebar = document.getElementById('cartSidebar');
        const cartBackdrop = document.getElementById('cartBackdrop');

        if (cartSidebar && animationController) {
            animationController.slideToggle(cartSidebar, false);
        }

        if (cartBackdrop) {
            gsap.to(cartBackdrop, { 
                opacity: 0, 
                pointerEvents: 'none', 
                duration: 0.3 
            });
        }

        document.body.style.overflow = '';
    }

    addItem(product) {
        if (this.items.length >= CONFIG.CART.MAX_ITEMS) {
            this.showMessage(CONFIG.MESSAGES.ERRORS.CART_FULL, 'error');
            return false;
        }

        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateDisplay();
        
        if (animationController) {
            animationController.animateCartCount();
        }

        this.showMessage(CONFIG.MESSAGES.SUCCESS.CART_ADDED, 'success');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:add', { detail: product }));
        
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateDisplay();
        
        this.showMessage(CONFIG.MESSAGES.SUCCESS.CART_REMOVED, 'success');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:remove', { detail: { id: productId } }));
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateDisplay();
            }
        }
    }

    clear() {
        this.items = [];
        this.saveCart();
        this.updateDisplay();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:clear'));
    }

    updateDisplay() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartTotal();
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems.toString();
        }
    }

    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-8 0h8"></path>
                    </svg>
                    <p>Your cart is empty</p>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="flex gap-4 mb-6 pb-6 border-b" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium mb-2">${item.name}</h4>
                    <p class="text-sm text-gray-500 mb-2">${item.description || ''}</p>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <button class="quantity-btn w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50" 
                                    data-action="decrease" data-id="${item.id}">-</button>
                            <span class="w-8 text-center">${item.quantity}</span>
                            <button class="quantity-btn w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50" 
                                    data-action="increase" data-id="${item.id}">+</button>
                        </div>
                        <div class="text-right">
                            <p class="text-accent font-medium">$${(item.price * item.quantity).toFixed(2)}</p>
                            <button class="text-red-500 text-sm hover:underline remove-item" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind quantity and remove buttons
        cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                const action = e.target.dataset.action;
                const item = this.items.find(item => item.id === itemId);
                
                if (item) {
                    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                    this.updateQuantity(itemId, newQuantity);
                }
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                this.removeItem(itemId);
            });
        });
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `$${this.total.toFixed(2)}`;
        }
    }

    saveCart() {
        try {
            const cartData = {
                items: this.items,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(CONFIG.CART.STORAGE_KEY, JSON.stringify(cartData));
        } catch (error) {
            console.error('Failed to save cart:', error);
        }
    }

    loadCart() {
        try {
            const cartData = localStorage.getItem(CONFIG.CART.STORAGE_KEY);
            if (cartData) {
                const parsed = JSON.parse(cartData);
                
                // Check if cart is still valid (not expired)
                const lastUpdated = new Date(parsed.lastUpdated);
                const now = new Date();
                const timeDiff = now.getTime() - lastUpdated.getTime();
                
                if (timeDiff < CONFIG.CART.SESSION_TIMEOUT) {
                    this.items = parsed.items || [];
                } else {
                    // Cart expired, clear it
                    this.clear();
                }
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.items = [];
        }
    }

    showMessage(message, type = 'info') {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'error' ? 'bg-red-500 text-white' : 
            type === 'success' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Get cart summary for checkout
    getSummary() {
        return {
            items: this.items,
            itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: this.total,
            total: this.total // Add tax/shipping calculation here
        };
    }
}

class NewsletterComponent {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('newsletterForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!emailInput || !submitBtn) return;

        const email = emailInput.value.trim();
        
        // Validate email
        if (!this.validateEmail(email)) {
            this.showError(emailInput, CONFIG.MESSAGES.ERRORS.EMAIL_INVALID);
            return;
        }

        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';

        try {
            // Simulate API call (replace with actual implementation)
            await this.submitToNewsletter(email);
            
            // Success
            this.showSuccess(form);
            form.reset();
            
        } catch (error) {
            console.error('Newsletter subscription failed:', error);
            this.showError(emailInput, CONFIG.MESSAGES.ERRORS.GENERIC);
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    validateEmail(email) {
        return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
    }

    async submitToNewsletter(email) {
        // This would be replaced with actual API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({ success: true });
                } else {
                    reject(new Error('API Error'));
                }
            }, 1000);
        });
    }

    showError(input, message) {
        // Remove existing error
        this.clearError(input);
        
        // Add error styling
        input.classList.add('border-red-500', 'focus:ring-red-500');
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'absolute top-full left-0 mt-1 text-red-500 text-sm';
        errorDiv.textContent = message;
        errorDiv.id = 'newsletter-error';
        
        // Insert error message
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(errorDiv);
    }

    clearError(input) {
        input.classList.remove('border-red-500', 'focus:ring-red-500');
        const existingError = document.getElementById('newsletter-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showSuccess(form) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'text-accent text-center mt-4';
        successDiv.textContent = CONFIG.MESSAGES.SUCCESS.NEWSLETTER;
        
        form.appendChild(successDiv);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);

        // Animate form
        if (animationController) {
            animationController.animateClick(form);
        }
    }
}

// Initialize components when DOM is ready
let navigationComponent, cartComponent, newsletterComponent, heroCarousel;

document.addEventListener('DOMContentLoaded', () => {
    navigationComponent = new NavigationComponent();
    cartComponent = new ShoppingCartComponent();
    newsletterComponent = new NewsletterComponent();
    heroCarousel = new HeroCarousel();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NavigationComponent,
        ShoppingCartComponent,
        NewsletterComponent
    };
}