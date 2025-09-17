// Shopify Cart Integration for Ecco Living
class ShopifyCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('ecco_cart')) || [];
        this.checkoutId = localStorage.getItem('ecco_checkout_id');
        this.baseApiUrl = 'http://localhost:3001/api/shopify';
        
        this.init();
    }

    init() {
        this.renderCartCount();
        this.setupEventListeners();
        
        // Clear expired checkout (24 hours)
        this.clearExpiredCheckout();
    }

    // Add product to cart
    async addToCart(productData) {
        try {
            // Validate required fields
            if (!productData.variantId || !productData.quantity) {
                throw new Error('Product variant ID and quantity are required');
            }

            // Check if product already in cart
            const existingItemIndex = this.cart.findIndex(item => 
                item.variantId === productData.variantId
            );

            if (existingItemIndex >= 0) {
                // Update quantity
                this.cart[existingItemIndex].quantity += productData.quantity;
            } else {
                // Add new item
                this.cart.push({
                    variantId: productData.variantId,
                    quantity: productData.quantity,
                    productId: productData.productId,
                    name: productData.name,
                    price: productData.price,
                    image: productData.image,
                    addedAt: new Date().toISOString()
                });
            }

            // Save to localStorage
            this.saveCart();
            
            // Update UI
            this.renderCartCount();
            this.showAddToCartNotification(productData.name);

            return { success: true, cartCount: this.getCartCount() };
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showError('Failed to add item to cart');
            return { success: false, error: error.message };
        }
    }

    // Remove item from cart
    removeFromCart(variantId) {
        this.cart = this.cart.filter(item => item.variantId !== variantId);
        this.saveCart();
        this.renderCartCount();
        this.renderCartItems();
    }

    // Update item quantity
    updateQuantity(variantId, quantity) {
        const item = this.cart.find(item => item.variantId === variantId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(variantId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCartItems();
            }
        }
    }

    // Get cart count
    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Get cart total
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Create Shopify checkout and redirect using direct URL method
    async proceedToCheckout() {
        try {
            if (this.cart.length === 0) {
                this.showError('Your cart is empty');
                return;
            }

            this.showCheckoutLoading(true);

            // Create direct checkout URL for Shopify
            // Format: https://shop.myshopify.com/cart/variant1:qty1,variant2:qty2
            const cartItems = this.cart.map(item => {
                // Extract variant ID from full GID format
                const variantId = item.variantId.includes('ProductVariant/') 
                    ? item.variantId.split('ProductVariant/')[1]
                    : item.variantId;
                return `${variantId}:${item.quantity}`;
            }).join(',');

            const shopifyDomain = 'f0rwd1-sw.myshopify.com'; // Your store domain
            
            // Extract just the numeric ID from the variant ID
            const firstItem = this.cart[0];
            const numericVariantId = firstItem.variantId.includes('ProductVariant/') 
                ? firstItem.variantId.split('ProductVariant/')[1]
                : firstItem.variantId;
            
            // Direct add to cart and redirect to checkout
            const checkoutUrl = `https://${shopifyDomain}/cart/add?id=${numericVariantId}&quantity=${firstItem.quantity}&return_to=/checkout`;
            
            console.log('🛒 Cart contents:', this.cart);
            console.log('🛒 First item variant ID:', firstItem.variantId);
            console.log('🛒 Extracted numeric ID:', numericVariantId);
            console.log('🛒 Final checkout URL:', checkoutUrl);

            // Clear local cart after successful checkout redirect
            this.clearCart();

            // Redirect to Shopify checkout
            window.location.href = checkoutUrl;

        } catch (error) {
            console.error('Checkout error:', error);
            this.showError('Failed to proceed to checkout. Please try again.');
        } finally {
            this.showCheckoutLoading(false);
        }
    }

    // Create new Shopify checkout
    async createNewCheckout(lineItems) {
        const response = await fetch(`${this.baseApiUrl}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: lineItems })
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout');
        }

        return await response.json();
    }

    // Clear expired checkout (older than 24 hours)
    clearExpiredCheckout() {
        const checkoutCreated = localStorage.getItem('ecco_checkout_created');
        if (checkoutCreated) {
            const createdDate = new Date(checkoutCreated);
            const now = new Date();
            const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                localStorage.removeItem('ecco_checkout_id');
                localStorage.removeItem('ecco_checkout_created');
                this.checkoutId = null;
            }
        }
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('ecco_cart', JSON.stringify(this.cart));
    }

    // Setup event listeners
    setupEventListeners() {
        // Cart button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#cartBtn, #cartBtn *')) {
                e.preventDefault();
                this.toggleCartModal();
            }
            
            // Add to cart buttons
            if (e.target.matches('.add-to-cart-btn')) {
                e.preventDefault();
                this.handleAddToCartClick(e.target);
            }

            // Cart modal close
            if (e.target.matches('.cart-modal-close, .cart-modal-backdrop')) {
                this.closeCartModal();
            }

            // Proceed to checkout
            if (e.target.matches('#proceedToCheckoutBtn')) {
                e.preventDefault();
                this.proceedToCheckout();
            }

            // Quantity controls
            if (e.target.matches('.cart-qty-plus')) {
                const variantId = e.target.dataset.variantId;
                const currentQty = parseInt(e.target.parentElement.querySelector('.cart-qty-input').value);
                this.updateQuantity(variantId, currentQty + 1);
            }

            if (e.target.matches('.cart-qty-minus')) {
                const variantId = e.target.dataset.variantId;
                const currentQty = parseInt(e.target.parentElement.querySelector('.cart-qty-input').value);
                this.updateQuantity(variantId, Math.max(0, currentQty - 1));
            }

            // Remove item
            if (e.target.matches('.remove-cart-item')) {
                const variantId = e.target.dataset.variantId;
                this.removeFromCart(variantId);
            }
        });

        // Quantity input change
        document.addEventListener('change', (e) => {
            if (e.target.matches('.cart-qty-input')) {
                const variantId = e.target.dataset.variantId;
                const quantity = parseInt(e.target.value) || 0;
                this.updateQuantity(variantId, quantity);
            }
        });
    }

    // Handle add to cart button click
    async handleAddToCartClick(button) {
        const productData = {
            productId: button.dataset.productId,
            variantId: button.dataset.variantId,
            name: button.dataset.productName,
            price: parseFloat(button.dataset.price) || 0,
            image: button.dataset.image,
            quantity: 1
        };

        // Get quantity from form if available
        const quantityInput = button.closest('form')?.querySelector('.quantity-input');
        if (quantityInput) {
            productData.quantity = parseInt(quantityInput.value) || 1;
        }

        const result = await this.addToCart(productData);
        
        if (result.success) {
            // Optionally show cart modal
            if (button.dataset.showModal !== 'false') {
                setTimeout(() => this.openCartModal(), 300);
            }
        }
    }

    // Render cart count
    renderCartCount() {
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        const count = this.getCartCount();
        
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    // Toggle cart modal
    toggleCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal && modal.style.display === 'block') {
            this.closeCartModal();
        } else {
            this.openCartModal();
        }
    }

    // Open cart modal
    openCartModal() {
        this.createCartModal();
        this.renderCartItems();
        
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Animate in
            setTimeout(() => {
                modal.classList.add('modal-open');
            }, 10);
        }
    }

    // Close cart modal
    closeCartModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.classList.remove('modal-open');
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Create cart modal HTML
    createCartModal() {
        let modal = document.getElementById('cartModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cartModal';
            modal.className = 'cart-modal';
            modal.innerHTML = `
                <div class="cart-modal-backdrop cart-modal-close"></div>
                <div class="cart-modal-content">
                    <div class="cart-modal-header">
                        <h3>Your Cart</h3>
                        <button class="cart-modal-close">&times;</button>
                    </div>
                    <div class="cart-modal-body" id="cartModalBody">
                        <!-- Cart items will be rendered here -->
                    </div>
                    <div class="cart-modal-footer">
                        <div class="cart-total">
                            Total: $<span id="cartTotalAmount">0.00</span>
                        </div>
                        <button id="proceedToCheckoutBtn" class="checkout-btn">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    }

    // Render cart items
    renderCartItems() {
        const cartBody = document.getElementById('cartModalBody');
        const totalElement = document.getElementById('cartTotalAmount');
        
        if (!cartBody) return;

        if (this.cart.length === 0) {
            cartBody.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <button class="cart-modal-close">Continue Shopping</button>
                </div>
            `;
            if (totalElement) totalElement.textContent = '0.00';
            return;
        }

        cartBody.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-variant-id="${item.variantId}">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="cart-qty-minus" data-variant-id="${item.variantId}">-</button>
                    <input type="number" class="cart-qty-input" data-variant-id="${item.variantId}" value="${item.quantity}" min="0">
                    <button class="cart-qty-plus" data-variant-id="${item.variantId}">+</button>
                </div>
                <div class="cart-item-total">
                    $${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="remove-cart-item" data-variant-id="${item.variantId}">×</button>
            </div>
        `).join('');

        if (totalElement) {
            totalElement.textContent = this.getCartTotal().toFixed(2);
        }
    }

    // Show loading state for checkout
    showCheckoutLoading(isLoading) {
        const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
        if (checkoutBtn) {
            if (isLoading) {
                checkoutBtn.disabled = true;
                checkoutBtn.innerHTML = 'Processing...';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = 'Proceed to Checkout';
            }
        }
    }

    // Show add to cart notification
    showAddToCartNotification(productName) {
        const notification = document.createElement('div');
        notification.className = 'add-to-cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>Added "${productName}" to cart</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Show error message
    showError(message) {
        alert(message); // Replace with your preferred notification system
    }

    // Clear cart (useful for testing)
    clearCart() {
        this.cart = [];
        this.checkoutId = null;
        localStorage.removeItem('ecco_cart');
        localStorage.removeItem('ecco_checkout_id');
        localStorage.removeItem('ecco_checkout_created');
        this.renderCartCount();
        this.renderCartItems();
        console.log('Cart cleared successfully');
    }

    // Get cart for debugging
    getCart() {
        return this.cart;
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shopifyCart = new ShopifyCart();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShopifyCart;
}