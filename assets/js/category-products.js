// Universal Category Page Product Manager
class CategoryProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.perPage = 12;
        this.currentFilter = 'all';
        
        // Category mapping for filtering products
        this.categoryMap = {
            // BATHROOMS
            'bathrooms': ['100'],
            'tapware': ['140'],
            'basin-mixers': ['141'], 
            'tall-basin-mixers': ['142'],
            'freestanding-bath-mixers': ['143'],
            'bath-spout-wall-mixers': ['144'],
            'wall-mixers-diverters': ['145'],
            'wall-three-piece-sets': ['146'],
            'counter-three-piece-sets': ['147'],
            'bathroom-accessories': ['110'],
            'towel-rails': ['111'],
            'heated-towel-rails': ['112'],
            'robe-hooks': ['113'],
            'toilet-accessories': ['114'],
            'soap-dish-holders-shelves': ['115'],
            'showerware': ['120'],
            'shower-on-rails': ['121'],
            'hand-held-showers': ['122'],
            'shower-systems': ['123'],
            'outdoor-showers': ['124'],
            'rain-shower-arms': ['125'],
            'shower-mixers': ['126'],
            'wall-top-assemblies': ['127'],
            'waste-traps-grates': ['130'],
            'basin-wastes': ['131'],
            'bath-wastes': ['132'],
            'floor-strip-drains': ['133'],
            'custom-strip-drains': ['134'],
            'bottle-traps': ['135'],
            'vanities': ['150'],
            'wall-hung-vanities': ['151'],
            'floor-standing-vanities': ['152'],
            'space-saving-vanities': ['153'],
            'mirrored-shaving-cabinets': ['154'],
            'tall-boys': ['155'],
            'vanity-tops': ['156'],
            'basins': ['160'],
            'above-counter-basins': ['161'],
            'under-counter-basins': ['162'],
            'wall-hung-basins': ['163'],
            'semi-recessed-basins': ['164'],
            'freestanding-basins': ['165'],
            'cabinet-handles': ['170'],
            'knobs': ['171'],
            'pull-handles': ['172'],
            'toilets-bidets': ['180'],
            'smart-toilets': ['181'],
            'toilet-suites': ['182'],
            'wall-faced-pans': ['183'],
            'wall-hung-pans': ['184'],
            'bidet': ['185'],
            'inwall-cisterns': ['186'],
            'push-buttons': ['187'],
            'bathtubs': ['190'],
            'drop-in-pvc-bath': ['191'],
            'drop-in-steel-baths': ['192'],
            'freestanding-pvc-baths': ['193'],
            'freestanding-stone-baths': ['194'],
            
            // GLASS FENCING  
            'glass-fencing': ['300'],
            'frameless-glass-pool-fencing': ['310'],
            'build-pool-fence': ['311'],
            '2205-duplex-spigots': ['312'],
            'non-conductive-spigots': ['313'],
            'soft-close-hinges': ['314'],
            'latch': ['315'],
            'support-clamps': ['316'],
            'pool-fence-glass-panels': ['317'],
            'pool-fence-hinge-panels': ['318'],
            'pool-fence-gates': ['319'],
            'pool-fence-transition-panels': ['320'],
            'grout': ['321'],
            'custom-glass': ['322'],
            'frameless-glass-balustrades': ['330'],
            'frameless-glass-shower-screens': ['350'],
            
            // ALUMINIUM FENCING
            'aluminium-solutions': ['400'],
            'aluminium-pool-fencing': ['410'],
            'vista-aluminium-pool-fence': ['411'],
            'ray-aluminium-pool-fence': ['412'],
            'batten-aluminium-pool-fence': ['413'],
            'arc-aluminium-pool-fence': ['414'],
            'aluminium-balustrades': ['420'],
            
            // FLOORING
            'flooring': ['500'],
            'tiles': ['510'],
            'bathroom-tiles': ['511'],
            'kitchen-laundry-tiles': ['512'],
            'splashback-feature-tiles': ['513'],
            'living-tiles': ['514'],
            'outdoor-tiles': ['515'],
            'pool-tiles': ['516'],
            'porcelain-tiles': ['517'],
            'ceramic-tiles': ['518'],
            'natural-stone-tiles': ['519'],
            'mosaic-tiles': ['520'],
            'large-format-tiles': ['521'],
            'composite-decking': ['530'],
            'milboard-decking': ['531'],
            
            // COMPOSITE CLADDING
            'composite-cladding': ['600'],
            'milboard-envello-shadowline': ['601'],
            'milboard-envello-board-batten': ['602'],
            'woodevo-castellated-cladding': ['603']
        };
        
        this.init();
    }

    async init() {
        try {
            // Get page category from filename or URL
            this.pageCategory = this.detectPageCategory();
            console.log('🔍 Page category detected:', this.pageCategory);
            
            await this.loadProducts();
            this.setupFilterButtons();
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error initializing category products:', error);
            this.showError('Failed to initialize product page');
        }
    }

    detectPageCategory() {
        // Get category from current page filename
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        // Remove any query parameters
        return filename.split('?')[0];
    }

    async loadProducts() {
        try {
            console.log('Loading products for category:', this.pageCategory);
            
            // Load all products from API
            const response = await fetch('/api/products?per_page=1000'); // Get all products
            const data = await response.json();
            
            if (data.success) {
                this.products = data.data || [];
                console.log(`Loaded ${this.products.length} total products`);
                
                // Filter products for this category
                this.filterProductsByCategory();
                this.renderProducts();
            } else {
                throw new Error('Failed to load products');
            }
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    filterProductsByCategory() {
        const categoryIds = this.categoryMap[this.pageCategory];
        
        if (!categoryIds) {
            console.log('No category mapping found for:', this.pageCategory);
            this.filteredProducts = [];
            return;
        }
        
        console.log('Filtering products for category IDs:', categoryIds);
        console.log('Available products:', this.products.map(p => ({ name: p.name, categories: p.categories })));
        
        this.filteredProducts = this.products.filter(product => {
            // Check if product has any of the required category IDs
            if (product.categories && Array.isArray(product.categories)) {
                const hasDirectMatch = product.categories.some(catId => categoryIds.includes(catId));
                
                // For main category pages like 'bathrooms', also include subcategory products
                if (this.pageCategory === 'bathrooms') {
                    // Include any product that has bathroom-related categories (100-199 range)
                    const hasBathroomCategory = product.categories.some(catId => {
                        const numId = parseInt(catId);
                        return numId >= 100 && numId < 200;
                    });
                    return hasDirectMatch || hasBathroomCategory;
                }
                
                return hasDirectMatch;
            }
            return false;
        });
        
        console.log(`Found ${this.filteredProducts.length} products for ${this.pageCategory}`);
    }

    renderProducts() {
        console.log('🎨 Rendering products...', this.filteredProducts.length);
        
        // Force hide all loading states
        document.querySelectorAll('#loadingState, .loading-spinner, [class*="loading"]').forEach(el => {
            el.style.display = 'none';
            el.hidden = true;
        });
        
        const container = document.getElementById('productsGrid') || this.createProductsGrid();
        
        // Make sure container is visible
        container.style.display = 'grid';
        
        if (this.filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p class="text-gray-500">No products available in this category yet.</p>
                </div>
            `;
            return;
        }

        // Apply current filter
        let displayProducts = this.filteredProducts;
        if (this.currentFilter !== 'all') {
            displayProducts = this.filteredProducts.filter(product => {
                // Filter by subcategory or other criteria
                return product.subcategory === this.currentFilter || 
                       (product.categories && product.categories.includes(this.currentFilter));
            });
        }

        container.innerHTML = displayProducts.map(product => `
            <div class="product-card bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div class="aspect-square bg-gray-50 overflow-hidden">
                    <img src="${product.image || product.main_image || 'https://via.placeholder.com/400x400'}" 
                         alt="${product.name}"
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                
                <div class="p-4">
                    <div class="mb-2">
                        <h3 class="text-lg font-medium text-gray-900 mb-1">${product.name}</h3>
                        <p class="text-sm text-gray-600">${product.brand || 'Ecco Living'}</p>
                    </div>
                    
                    <div class="text-sm text-gray-500 mb-3">
                        <div>SKU: ${product.sku}</div>
                        ${product.originalSku ? `<div>Original: ${product.originalSku}</div>` : ''}
                    </div>
                    
                    ${product.short_description ? `
                        <p class="text-sm text-gray-700 mb-4 line-clamp-2">${product.short_description}</p>
                    ` : ''}
                    
                    <div class="flex items-center justify-between">
                        <div class="text-xl font-bold text-primary">
                            $${parseFloat(product.price || 0).toFixed(2)}
                            ${product.sale_price ? `<span class="text-sm text-gray-500 line-through ml-2">$${parseFloat(product.sale_price).toFixed(2)}</span>` : ''}
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button onclick="categoryProducts.viewProduct('${product.id}')" 
                                    class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                View Details
                            </button>
                            <button onclick="categoryProducts.addToCart('${product.id}')" 
                                    class="bg-accent hover:bg-accent-dark text-white px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${product.stock_quantity !== undefined ? `
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-500">Stock:</span>
                                <span class="font-medium ${product.stock_quantity > 10 ? 'text-green-600' : product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'}">
                                    ${product.stock_quantity > 0 ? `${product.stock_quantity} units` : 'Out of stock'}
                                </span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Update product count
        this.updateProductCount(displayProducts.length);
    }

    createProductsGrid() {
        console.log('Creating products grid...');
        
        // Find existing loading state and replace it
        const loadingState = document.getElementById('loadingState');
        if (loadingState && loadingState.parentNode) {
            console.log('Found loading state, replacing with products grid');
            const gridContainer = document.createElement('div');
            gridContainer.id = 'productsGrid';
            gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
            
            loadingState.parentNode.replaceChild(gridContainer, loadingState);
            return gridContainer;
        }
        
        // Check if products grid already exists
        let existingGrid = document.getElementById('productsGrid');
        if (existingGrid) {
            console.log('Found existing products grid');
            return existingGrid;
        }
        
        // Look for a container we can use
        const possibleContainers = [
            document.querySelector('.py-20 .max-w-7xl'),
            document.querySelector('section.py-20'),
            document.querySelector('main')
        ];
        
        for (const container of possibleContainers) {
            if (container) {
                console.log('Creating products grid in found container');
                const gridContainer = document.createElement('div');
                gridContainer.id = 'productsGrid';
                gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8';
                container.appendChild(gridContainer);
                return gridContainer;
            }
        }
        
        // Fallback: create new container
        console.log('Creating fallback products grid in body');
        const container = document.createElement('div');
        container.id = 'productsGrid';
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6';
        document.body.appendChild(container);
        return container;
    }

    setupFilterButtons() {
        // Setup filter button functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                this.applyFilter(filter);
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        this.renderProducts();
    }

    setupEventListeners() {
        // Add any additional event listeners for the page
        this.setupProductSearch();
    }

    setupProductSearch() {
        const searchInput = document.querySelector('#productSearch, .product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
    }

    searchProducts(query) {
        if (!query) {
            this.renderProducts();
            return;
        }

        const searchQuery = query.toLowerCase();
        const searchResults = this.filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.brand?.toLowerCase().includes(searchQuery) ||
            product.sku.toLowerCase().includes(searchQuery) ||
            product.originalSku?.toLowerCase().includes(searchQuery)
        );

        this.renderSearchResults(searchResults);
    }

    renderSearchResults(results) {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p class="text-gray-500">Try adjusting your search terms.</p>
                </div>
            `;
            return;
        }

        // Render search results (same as renderProducts but with results array)
        // ... (implementation similar to renderProducts)
    }

    viewProduct(productId) {
        // Navigate to individual product page
        window.location.href = `/product.html?id=${productId}`;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            console.log('Adding to cart:', product.name);
            // Integrate with existing cart system
            this.showSuccess(`${product.name} added to cart!`);
        }
    }

    updateProductCount(count) {
        // Update any product count displays on the page
        const countElements = document.querySelectorAll('.products-count');
        countElements.forEach(el => el.textContent = count);
        
        // Update page title if needed
        const title = document.querySelector('h1');
        if (title && count > 0) {
            const baseTitle = title.textContent.split('(')[0].trim();
            title.textContent = `${baseTitle} (${count})`;
        }
    }

    showSuccess(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showError(message) {
        console.error('Category Products Error:', message);
        
        const container = document.getElementById('productsGrid') || this.createProductsGrid();
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
                <p class="text-gray-500 mb-4">${message}</p>
                <button onclick="categoryProducts.loadProducts()" class="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Initialize when page loads
let categoryProducts;
document.addEventListener('DOMContentLoaded', () => {
    categoryProducts = new CategoryProductsManager();
});

// Add CSS for line-clamp
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .product-card {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);