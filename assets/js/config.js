// Application Configuration
const CONFIG = {
    // Animation settings
    ANIMATION: {
        LOADING_DURATION: 2000,
        SCROLL_DURATION: 1200,
        HOVER_DURATION: 300,
        TRANSITION_EASING: 'cubic-bezier(0.23, 1, 0.32, 1)'
    },
    
    // API endpoints (for future backend integration)
    API: {
        BASE_URL: '/api',
        ENDPOINTS: {
            PRODUCTS: '/products',
            CATEGORIES: '/categories',
            CART: '/cart',
            ORDERS: '/orders',
            NEWSLETTER: '/newsletter',
            CONTACT: '/contact'
        }
    },
    
    // Cart settings
    CART: {
        MAX_ITEMS: 50,
        STORAGE_KEY: 'ecco_living_cart',
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // Form validation
    VALIDATION: {
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/
    },
    
    // Shopify configuration (for future integration)
    SHOPIFY: {
        DOMAIN: 'your-shop-name.myshopify.com',
        STOREFRONT_ACCESS_TOKEN: 'your-storefront-access-token',
        API_VERSION: '2023-04'
    },
    
    // Feature flags
    FEATURES: {
        CUSTOM_CURSOR: false, // Disabled for better UX
        SMOOTH_SCROLLING: false,
        PARALLAX_EFFECTS: false,
        LOADING_ANIMATION: true,
        NEWSLETTER_ENABLED: true,
        CART_ENABLED: true
    },
    
    // Error messages
    MESSAGES: {
        ERRORS: {
            GENERIC: 'An error occurred. Please try again.',
            NETWORK: 'Network error. Please check your connection.',
            VALIDATION: 'Please check your input and try again.',
            CART_FULL: 'Your cart is full. Please remove some items.',
            EMAIL_INVALID: 'Please enter a valid email address.',
            REQUIRED_FIELD: 'This field is required.'
        },
        SUCCESS: {
            NEWSLETTER: 'Thank you for subscribing!',
            CART_ADDED: 'Item added to cart',
            CART_REMOVED: 'Item removed from cart',
            ORDER_PLACED: 'Order placed successfully!'
        }
    }
};

// Environment detection
const ENV = {
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    IS_TOUCH: 'ontouchstart' in window,
    IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    SUPPORTS_WEBP: false,
    PREFERS_REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

// Check WebP support
const checkWebPSupport = () => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
        ENV.SUPPORTS_WEBP = (webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
};
checkWebPSupport();

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show error boundary if critical error
    if (event.error && event.error.stack) {
        const errorBoundary = document.getElementById('errorBoundary');
        if (errorBoundary) {
            errorBoundary.classList.remove('hidden');
        }
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ENV };
}