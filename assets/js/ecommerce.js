// Ecommerce Manager for Product Pages
class EcommerceManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.shopifyClient = null;
        this.apiBase = '/api';
    }

    async init() {
        this.setupFilters();
        this.setupProductGrid();
        await this.initializeShopify();
    }

    // Initialize Shopify Buy SDK
    async initializeShopify() {
        try {
            // Initialize Shopify client (using environment variables)
            this.shopifyClient = ShopifyBuy.buildClient({
                domain: process.env.SHOPIFY_DOMAIN || 'your-shop.myshopify.com',
                storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN || 'your-storefront-token'
            });
            console.log('Shopify client initialized');
        } catch (error) {
            console.warn('Shopify initialization failed, using local cart:', error);
        }
    }

    // Load tapware products from admin API
    async loadTapwareProducts() {
        try {
            this.showLoading();
            
            // Fetch products from your admin API
            const response = await fetch(`${this.apiBase}/products?category=tapware`);
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            const data = await response.json();
            this.products = data.data || [];
            this.filteredProducts = [...this.products];
            
            this.renderProducts();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to mock data if API fails
            this.loadMockProducts();
        }
    }

    // Mock products for development (matches your admin structure)
    loadMockProducts() {
        this.products = [
            {
                id: 'tap-001',
                name: 'Premium Basin Mixer - Chrome',
                slug: 'premium-basin-mixer-chrome',
                price: 299,
                image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Luxury chrome basin mixer with ceramic disc technology',
                category: 'basin-mixers',
                subcategory: 'basin-mixers',
                status: 'published',
                shopify_id: 'gid://shopify/Product/123456789',
                features: ['Ceramic disc cartridge', 'Chrome finish', 'WELS 5-star rating'],
                specifications: {
                    'Finish': 'Chrome',
                    'Material': 'Solid Brass',
                    'Height': '180mm',
                    'WELS Rating': '5 Star'
                }
            },
            {
                id: 'tap-002',
                name: 'Tall Basin Mixer - Brushed Gold',
                slug: 'tall-basin-mixer-brushed-gold',
                price: 449,
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Contemporary tall basin mixer in premium brushed gold finish',
                category: 'tall-basin-mixers',
                subcategory: 'tall-basin-mixers',
                status: 'published',
                shopify_id: 'gid://shopify/Product/123456790',
                features: ['Extended height design', 'Brushed gold finish', 'Premium ceramic cartridge'],
                specifications: {
                    'Finish': 'Brushed Gold',
                    'Material': 'Solid Brass',
                    'Height': '280mm',
                    'WELS Rating': '4 Star'
                }
            },
            {
                id: 'tap-003',
                name: 'Freestanding Bath Mixer - Matte Black',
                slug: 'freestanding-bath-mixer-matte-black',
                price: 899,
                image: 'https://images.unsplash.com/photo-1595515106975-1472e2e0c8c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Statement freestanding bath mixer in sophisticated matte black',
                category: 'freestanding-bath-mixers',
                subcategory: 'freestanding-bath-mixers',
                status: 'published',
                shopify_id: 'gid://shopify/Product/123456791',
                features: ['Freestanding design', 'Matte black finish', 'Hand shower included'],
                specifications: {
                    'Finish': 'Matte Black',
                    'Material': 'Solid Brass',
                    'Height': '1100mm',
                    'WELS Rating': '4 Star'
                }
            },
            {
                id: 'tap-004',
                name: 'Wall Three Piece Set - Polished Chrome',
                slug: 'wall-three-piece-set-chrome',
                price: 649,
                image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                description: 'Classic wall-mounted three piece tapware set in polished chrome',
                category: 'wall-three-piece-sets',
                subcategory: 'wall-three-piece-sets',
                status: 'published',
                shopify_id: 'gid://shopify/Product/123456792',
                features: ['Wall mounted', 'Three piece design', 'Polished chrome finish'],
                specifications: {
                    'Finish': 'Polished Chrome',
                    'Material': 'Solid Brass',
                    'Projection': '200mm',
                    'WELS Rating': '5 Star'
                }
            }
        ];
        
        this.filteredProducts = [...this.products];
        this.renderProducts();
        this.hideLoading();
    }

    // Setup filter functionality
    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Filter products
                const filter = e.target.dataset.filter;
                this.filterProducts(filter);
            });
        });
    }

    // Filter products by category
    filterProducts(category) {
        this.currentCategory = category;
        
        if (category === 'all') {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => 
                product.category === category || product.subcategory === category
            );
        }
        
        this.renderProducts();
    }

    // Render products grid
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredProducts.length === 0) {
            grid.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }
        
        noResults.classList.add('hidden');
        grid.classList.remove('hidden');
        
        grid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Animate product cards
        setTimeout(() => {
            const cards = grid.querySelectorAll('.product-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 100);
            });
        }, 50);
        
        // Setup add to cart buttons
        this.setupAddToCartButtons();
    }

    // Create product card HTML
    createProductCard(product) {
        const formatter = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });

        return `
            <article class="product-card group cursor-pointer" data-product-id="${product.id}">
                <div class="relative h-80 bg-gray-50 rounded-2xl overflow-hidden mb-6">
                    <img src="${product.image}" 
                         alt="${product.name}" 
                         class="product-image w-full h-full object-cover"
                         loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                        <button class="add-to-cart-btn w-full bg-white text-primary py-3 rounded-full font-medium hover:bg-accent hover:text-white transition-all duration-300" 
                                data-product-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs uppercase tracking-wider text-text-light font-medium">${this.getCategoryDisplayName(product.category)}</span>
                        <span class="text-lg font-display font-medium text-primary">${formatter.format(product.price)}</span>
                    </div>
                    <h3 class="text-xl font-display font-light text-primary group-hover:text-accent transition-colors duration-300">
                        ${product.name}
                    </h3>
                    <p class="text-text-light text-sm leading-relaxed line-clamp-2">
                        ${product.description}
                    </p>
                    
                    ${product.colors ? `
                        <div class="flex items-center justify-between mt-3">
                            <div class="flex space-x-1">
                                ${product.colors.slice(0, 4).map(color => `
                                    <div class="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                                         style="background-color: ${color.code}" 
                                         title="${color.name}"></div>
                                `).join('')}
                                ${product.colors.length > 4 ? `<span class="text-xs text-text-light ml-1">+${product.colors.length - 4}</span>` : ''}
                            </div>
                            <span class="text-xs text-text-light">${product.colors.length} colors</span>
                        </div>
                    ` : ''}
                    
                    ${product.features ? `
                        <div class="flex flex-wrap gap-1 mt-3">
                            ${product.features.slice(0, 2).map(feature => `
                                <span class="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                                    ${feature}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    }

    // Get display name for category
    getCategoryDisplayName(category) {
        const categoryMap = {
            'basin-mixers': 'Basin Mixers',
            'tall-basin-mixers': 'Tall Basin Mixers',
            'freestanding-bath-mixers': 'Freestanding Bath Mixers',
            'bath-spout-wall-mixers': 'Bath Spout & Wall Mixers',
            'wall-mixers-diverters': 'Wall Mixers With Diverters',
            'wall-three-piece-sets': 'Wall Three Piece Sets',
            'counter-three-piece-sets': 'Counter Top Three Piece Sets'
        };
        return categoryMap[category] || category;
    }

    // Setup add to cart button functionality
    setupAddToCartButtons() {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Product card click for product details
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-to-cart-btn')) {
                    const productId = card.dataset.productId;
                    this.showProductDetails(productId);
                }
            });
        });
    }

    // Add product to cart
    async addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            if (this.shopifyClient && product.shopify_id) {
                // Add to Shopify cart
                await this.addToShopifyCart(product);
            } else {
                // Add to local cart
                if (window.CartManager) {
                    window.CartManager.addItem(product);
                }
            }

            // Show success feedback
            this.showAddToCartSuccess(product.name);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showError('Failed to add item to cart');
        }
    }

    // Add product to cart with specific color
    async addToCartWithColor(product, colorIndex) {
        if (!product) return;

        let cartProduct = { ...product };
        
        // If color is selected, update product with color-specific details
        if (product.colors && colorIndex !== undefined) {
            const selectedColor = product.colors[parseInt(colorIndex)];
            cartProduct = {
                ...product,
                id: product.id + '-' + selectedColor.sku,
                name: product.name + ' - ' + selectedColor.name,
                price: selectedColor.price,
                image: selectedColor.image,
                sku: selectedColor.sku,
                selectedColor: selectedColor.name
            };
        }

        try {
            if (this.shopifyClient && product.shopify_id) {
                // Add to Shopify cart with variant
                await this.addToShopifyCart(cartProduct);
            } else {
                // Add to local cart
                if (window.CartManager) {
                    window.CartManager.addItem(cartProduct);
                }
            }

            // Show success feedback
            this.showAddToCartSuccess(cartProduct.name);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showError('Failed to add item to cart');
        }
    }

    // Add to Shopify cart
    async addToShopifyCart(product) {
        try {
            // Create checkout if it doesn't exist
            if (!this.shopifyCheckout) {
                this.shopifyCheckout = await this.shopifyClient.checkout.create();
            }

            // Add line item
            const lineItemsToAdd = [{
                variantId: product.shopify_variant_id || product.shopify_id,
                quantity: 1
            }];

            this.shopifyCheckout = await this.shopifyClient.checkout.addLineItems(
                this.shopifyCheckout.id, 
                lineItemsToAdd
            );

            console.log('Added to Shopify cart:', this.shopifyCheckout);
            
        } catch (error) {
            console.error('Shopify cart error:', error);
            throw error;
        }
    }

    // Show product details modal
    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Create and show product details modal
        this.createProductModal(product);
    }

    // Create product details modal
    createProductModal(product) {
        const formatter = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });

        // Set default selected color
        const selectedColor = product.colors ? product.colors[0] : null;
        const displayPrice = selectedColor ? selectedColor.price : product.price;
        const displayImage = selectedColor ? selectedColor.image : product.image;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
                <!-- Modal Header -->
                <div class="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-8 py-6 flex items-center justify-between z-10">
                    <div>
                        <h2 class="text-2xl font-display font-light text-primary">${product.name}</h2>
                        <span class="text-sm uppercase tracking-wider text-text-light font-medium">${this.getCategoryDisplayName(product.category)}</span>
                    </div>
                    <button class="modal-close p-3 hover:bg-gray-100 rounded-full transition-colors duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
                    <!-- Left Column: Images (3/5 width) -->
                    <div class="lg:col-span-3 space-y-6">
                        <div class="sticky top-4">
                            <img id="modalProductImage" src="${displayImage}" alt="${product.name}" class="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-lg transition-all duration-300">
                            
                            ${product.sizes ? `
                                <div class="mt-6 space-y-4">
                                    <h4 class="text-lg font-display font-medium text-primary">Size Options</h4>
                                    <div class="grid grid-cols-1 gap-3">
                                        ${product.sizes.map((size, index) => `
                                            <button class="size-option ${index === 0 ? 'active border-accent bg-accent/5' : 'border-gray-200'} flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:border-accent hover:bg-accent/5" 
                                                    data-size-index="${index}">
                                                <div class="flex items-center space-x-3">
                                                    <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                                    </svg>
                                                    <div>
                                                        <span class="font-medium text-primary">${size.name}</span>
                                                        <div class="text-sm text-text-light">${size.height} height</div>
                                                    </div>
                                                </div>
                                                <span class="text-sm text-accent">+${formatter.format(size.price_modifier)}</span>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${product.colors ? `
                                <div class="mt-6 space-y-4">
                                    <h4 class="text-lg font-display font-medium text-primary">Available Finishes</h4>
                                    <div class="grid grid-cols-1 gap-3">
                                        ${product.colors.map((color, index) => `
                                            <button class="color-option ${index === 0 ? 'active border-accent bg-accent/5' : 'border-gray-200'} flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:border-accent hover:bg-accent/5" 
                                                    data-color-index="${index}">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-6 h-6 rounded-full border-2 border-white shadow-md" style="background-color: ${color.code}"></div>
                                                    <span class="font-medium text-primary">${color.name}</span>
                                                </div>
                                                <span class="text-lg font-display font-medium text-accent">${formatter.format(color.price)}</span>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Right Column: Details (2/5 width) -->
                    <div class="lg:col-span-2 space-y-8">
                        <!-- Price and Basic Info -->
                        <div class="bg-gradient-to-br from-accent/5 to-accent-light/10 rounded-2xl p-6">
                            <p id="modalPrice" class="text-3xl font-display font-medium text-accent mb-2">${formatter.format(displayPrice)}</p>
                            ${selectedColor ? `<p class="text-sm text-text-light">SKU: <span id="modalSku" class="font-mono">${selectedColor.sku}</span></p>` : ''}
                            ${product.supplier_code ? `<p class="text-sm text-text-light">Supplier Code: <span class="font-mono">${product.supplier_code}</span></p>` : ''}
                        </div>
                        
                        <!-- Description -->
                        <div>
                            <h3 class="text-lg font-display font-medium text-primary mb-3">Description</h3>
                            <p class="text-text-light leading-relaxed">${product.description}</p>
                        </div>
                        
                        <!-- Features -->
                        ${product.features ? `
                            <div>
                                <h3 class="text-lg font-display font-medium text-primary mb-4">Key Features</h3>
                                <div class="grid grid-cols-1 gap-3">
                                    ${product.features.map(feature => `
                                        <div class="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100">
                                            <div class="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                                            <span class="text-sm text-text-dark leading-relaxed">${feature}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Technical Specifications -->
                        ${product.specifications ? `
                            <div>
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-display font-medium text-primary">Technical Specifications</h3>
                                    ${product.downloads ? `
                                        <div class="flex items-center space-x-2">
                                            <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span class="text-sm text-accent">Spec sheets available</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        ${Object.entries(product.specifications).map(([key, value]) => `
                                            <div class="flex items-center justify-between py-3 border-b border-white/60 last:border-0">
                                                <span class="text-text-light font-medium">${key}</span>
                                                <span class="text-primary font-semibold bg-white px-3 py-1 rounded-full text-sm">${value}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Downloads Section -->
                        ${product.downloads ? `
                            <div>
                                <h3 class="text-lg font-display font-medium text-primary mb-4">Technical Resources</h3>
                                <div class="grid grid-cols-1 gap-3">
                                    ${Object.entries(product.downloads).map(([key, value]) => `
                                        <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all duration-300 cursor-pointer">
                                            <div class="flex items-center space-x-3">
                                                <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                </svg>
                                                <span class="font-medium text-primary">${key.replace('_', ' ')}</span>
                                            </div>
                                            <span class="text-sm text-text-light">${value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Add to Cart Section -->
                        <div class="sticky bottom-0 bg-white border-t border-gray-100 pt-6 mt-8">
                            <button id="modalAddToCart" class="w-full bg-accent text-white py-4 rounded-xl font-medium hover:bg-accent-dark transition-all duration-300 shadow-lg hover:shadow-xl" 
                                    data-product-id="${product.id}" data-selected-color="0">
                                <span id="addToCartText" class="text-lg">Add to Cart - ${formatter.format(displayPrice)}</span>
                            </button>
                            <p class="text-xs text-text-light text-center mt-3">Free shipping on orders over $500 | 10-year manufacturer warranty</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Color selection functionality
        if (product.colors) {
            const colorOptions = modal.querySelectorAll('.color-option');
            const modalImage = modal.querySelector('#modalProductImage');
            const modalPrice = modal.querySelector('#modalPrice');
            const modalSku = modal.querySelector('#modalSku');
            const addToCartBtn = modal.querySelector('#modalAddToCart');
            const addToCartText = modal.querySelector('#addToCartText');

            colorOptions.forEach((option, index) => {
                option.addEventListener('click', () => {
                    // Update active state
                    colorOptions.forEach(opt => opt.classList.remove('active', 'border-accent'));
                    option.classList.add('active', 'border-accent');
                    
                    // Update product display
                    const color = product.colors[index];
                    if (modalImage) modalImage.src = color.image;
                    if (modalPrice) modalPrice.textContent = formatter.format(color.price);
                    if (modalSku) modalSku.textContent = color.sku;
                    if (addToCartText) addToCartText.textContent = `Add to Cart - ${formatter.format(color.price)}`;
                    if (addToCartBtn) addToCartBtn.dataset.selectedColor = index;
                });
            });
        }

        modal.querySelector('#modalAddToCart').addEventListener('click', (e) => {
            const selectedColorIndex = e.target.dataset.selectedColor;
            this.addToCartWithColor(product, selectedColorIndex);
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Animate modal in
        gsap.fromTo(modal.querySelector('div'), {
            opacity: 0,
            scale: 0.9,
            y: 20
        }, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    // Show loading state
    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('productsGrid').classList.add('hidden');
        document.getElementById('noResults').classList.add('hidden');
    }

    // Hide loading state
    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    // Show success message
    showAddToCartSuccess(productName) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        toast.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Added "${productName}" to cart
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show error message
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Setup product grid interactions
    setupProductGrid() {
        // This will be called after products are rendered
    }
}

// Cart Manager
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('ecco_cart') || '[]');
        this.isOpen = false;
    }

    init() {
        this.setupCartUI();
        this.updateCartDisplay();
    }

    setupCartUI() {
        const cartBtn = document.getElementById('cartBtn');
        const cartSidebar = document.getElementById('cartSidebar');
        const closeCart = document.getElementById('closeCart');
        const cartOverlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggleCart());
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCart());
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
    }

    addItem(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                ...product,
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.updateCartCount();
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.updateCartCount();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
                this.updateCartCount();
            }
        }
    }

    saveCart() {
        localStorage.setItem('ecco_cart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (this.cart.length === 0) {
            if (cartItems) cartItems.classList.add('hidden');
            if (emptyCart) emptyCart.classList.remove('hidden');
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            if (cartItems) {
                cartItems.classList.remove('hidden');
                cartItems.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
            }
            if (emptyCart) emptyCart.classList.add('hidden');
            if (checkoutBtn) checkoutBtn.disabled = false;
        }

        // Update total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotal) {
            const formatter = new Intl.NumberFormat('en-AU', {
                style: 'currency',
                currency: 'AUD'
            });
            cartTotal.textContent = formatter.format(total);
        }

        this.updateCartCount();
    }

    createCartItemHTML(item) {
        const formatter = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        });

        return `
            <div class="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-primary truncate">${item.name}</h4>
                    <p class="text-sm text-text-light">${formatter.format(item.price)}</p>
                    <div class="flex items-center mt-2">
                        <button class="quantity-btn minus p-1 hover:bg-gray-100 rounded" data-product-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                            </svg>
                        </button>
                        <span class="mx-3 font-medium">${item.quantity}</span>
                        <button class="quantity-btn plus p-1 hover:bg-gray-100 rounded" data-product-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <button class="remove-item p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" data-product-id="${item.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    toggleCart() {
        if (this.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    openCart() {
        this.isOpen = true;
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSidebar) {
            cartSidebar.classList.remove('translate-x-full');
        }
        if (cartOverlay) {
            cartOverlay.classList.remove('opacity-0', 'invisible');
        }
        
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        this.isOpen = false;
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        
        if (cartSidebar) {
            cartSidebar.classList.add('translate-x-full');
        }
        if (cartOverlay) {
            cartOverlay.classList.add('opacity-0', 'invisible');
        }
        
        document.body.style.overflow = '';
    }

    async checkout() {
        if (this.cart.length === 0) return;

        try {
            if (window.EcommerceManager?.shopifyClient && window.EcommerceManager?.shopifyCheckout) {
                // Redirect to Shopify checkout
                window.location.href = window.EcommerceManager.shopifyCheckout.webUrl;
            } else {
                // Fallback: redirect to contact with cart info
                const cartData = encodeURIComponent(JSON.stringify(this.cart));
                window.location.href = `#contact?cart=${cartData}`;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('There was an error processing your checkout. Please try again.');
        }
    }
}

// Initialize managers
window.EcommerceManager = new EcommerceManager();
window.CartManager = new CartManager();