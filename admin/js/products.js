// Product management for admin dashboard
class ProductsManager {
    constructor() {
        this.products = [];
        this.currentPage = 1;
        this.perPage = 10;
        this.totalProducts = 0;
        this.filters = {};
    }

    // Load products
    async loadProducts(page = 1, filters = {}) {
        try {
            this.currentPage = page;
            this.filters = filters;

            const params = {
                page: page,
                per_page: this.perPage,
                ...filters
            };

            const response = await API.getProducts(params);
            
            // Handle both paginated and simple array responses
            if (Array.isArray(response)) {
                this.products = response;
                this.totalProducts = response.length;
            } else {
                this.products = response.data || [];
                this.totalProducts = response.total || this.products.length;
            }

            this.renderProductsTable();
            this.updatePagination();
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('Failed to load products');
        }
    }

    // Render products table organized by categories
    renderProductsTable() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (!this.products || this.products.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow-sm border p-8 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p class="text-gray-500 mb-4">Get started by adding your first product</p>
                    <a href="add-product.html" class="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium">
                        Add Product
                    </a>
                </div>
            `;
            return;
        }

        // Group products by main category
        const groupedProducts = this.groupProductsByCategory(this.products);
        
        container.innerHTML = Object.entries(groupedProducts).map(([categoryName, products]) => `
            <div class="bg-white rounded-lg shadow-sm border mb-6">
                <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                            <span class="w-2 h-2 bg-accent rounded-full mr-3"></span>
                            ${categoryName}
                            <span class="ml-2 bg-accent text-white text-xs px-2 py-1 rounded-full">${products.length}</span>
                        </h3>
                        <button class="text-sm text-gray-500 hover:text-gray-700" onclick="productsManager.toggleCategory('${categoryName}')">
                            <i class="fas fa-chevron-up category-toggle" data-category="${categoryName}"></i>
                        </button>
                    </div>
                </div>
                
                <div class="category-content" data-category="${categoryName}">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${products.map(product => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-12 w-12">
                                                    <img class="h-12 w-12 rounded-lg object-cover" 
                                                         src="${product.image || product.main_image || 'https://via.placeholder.com/48x48'}" 
                                                         alt="${product.name}">
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">${product.name}</div>
                                                    <div class="text-sm text-gray-500">
                                                        EL: ${product.sku} | Original: ${product.originalSku || product.original_sku || 'N/A'}
                                                    </div>
                                                    <div class="text-xs text-gray-400">${product.brand || 'Unknown Brand'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div class="font-mono">${product.sku || 'N/A'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            $${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock_quantity > 10 ? 'bg-green-100 text-green-800' : product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                                                ${product.stock_quantity || 0} units
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(product.status)}">
                                                ${product.status || 'draft'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center gap-2 justify-end">
                                                <button onclick="window.ProductsManager.viewOnSite('${product.id}')" 
                                                        class="text-green-600 hover:text-green-900 px-2 py-1 border border-green-200 rounded hover:bg-green-50"
                                                        title="View on website">
                                                    <i class="fas fa-external-link-alt mr-1"></i>View
                                                </button>
                                                <button onclick="window.ProductsManager.editProduct('${product.id}')" 
                                                        class="text-indigo-600 hover:text-indigo-900 px-2 py-1 border border-indigo-200 rounded hover:bg-indigo-50"
                                                        title="Edit product">
                                                    <i class="fas fa-edit mr-1"></i>Edit
                                                </button>
                                                <button onclick="window.ProductsManager.deleteProduct('${product.id}')" 
                                                        class="text-red-600 hover:text-red-900 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                                                        title="Delete product">
                                                    <i class="fas fa-trash mr-1"></i>Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add category toggle functionality
        this.setupCategoryToggles();
    }

    // Group products by main category
    groupProductsByCategory(products) {
        const categoryMap = {
            '100': 'Bathrooms',
            '300': 'Glass Fencing', 
            '400': 'Aluminium Fencing',
            '500': 'Flooring',
            '600': 'Composite Cladding'
        };

        const grouped = {};
        
        products.forEach(product => {
            let categoryName = 'Uncategorized';
            
            // Check if product has categories array
            if (product.categories && Array.isArray(product.categories)) {
                // Find main category (100s, 300s, 400s, 500s, 600s)
                const mainCategoryId = product.categories.find(catId => 
                    ['100', '300', '400', '500', '600'].includes(catId)
                );
                
                if (mainCategoryId && categoryMap[mainCategoryId]) {
                    categoryName = categoryMap[mainCategoryId];
                }
            } else if (product.category) {
                // Fallback to category string
                categoryName = product.category.charAt(0).toUpperCase() + product.category.slice(1);
            }
            
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(product);
        });

        return grouped;
    }

    // Setup category toggle functionality
    setupCategoryToggles() {
        document.querySelectorAll('.category-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const categoryName = e.target.dataset.category;
                this.toggleCategory(categoryName);
            });
        });
    }

    // Toggle category visibility
    toggleCategory(categoryName) {
        const content = document.querySelector(`[data-category="${categoryName}"]`);
        const toggle = document.querySelector(`.category-toggle[data-category="${categoryName}"]`);
        
        if (content && toggle) {
            content.classList.toggle('hidden');
            toggle.classList.toggle('fa-chevron-up');
            toggle.classList.toggle('fa-chevron-down');
        }
    }

    // Get status CSS class
    getStatusClass(status) {
        const classes = {
            'published': 'bg-green-100 text-green-800',
            'draft': 'bg-yellow-100 text-yellow-800',
            'archived': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    // Update pagination
    updatePagination() {
        const start = (this.currentPage - 1) * this.perPage + 1;
        const end = Math.min(this.currentPage * this.perPage, this.totalProducts);
        const totalPages = Math.ceil(this.totalProducts / this.perPage);

        // Update pagination info
        const elements = {
            productsStart: start,
            productsEnd: end,
            productsTotal: this.totalProducts
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update pagination buttons
        const prevBtn = document.getElementById('productsPrevBtn');
        const nextBtn = document.getElementById('productsNextBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.loadProducts(this.currentPage - 1, this.filters);
                }
            };
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
            nextBtn.onclick = () => {
                if (this.currentPage < totalPages) {
                    this.loadProducts(this.currentPage + 1, this.filters);
                }
            };
        }
    }

    // View product on website
    viewOnSite(productId) {
        console.log('Viewing product on site:', productId);
        const product = this.products.find(p => p.id == productId);
        
        if (product) {
            // Open product detail page in new tab
            const productUrl = `/product.html?id=${productId}`;
            window.open(productUrl, '_blank');
        } else {
            this.showError('Product not found');
        }
    }

    // Edit product
    editProduct(productId) {
        console.log('Edit product:', productId);
        const product = this.products.find(p => p.id == productId);
        
        if (product) {
            // Navigate to add-product page with product data for editing
            const editUrl = `add-product.html?edit=${productId}`;
            window.location.href = editUrl;
        } else {
            this.showError('Product not found');
        }
    }

    // Delete product
    async deleteProduct(productId) {
        const product = this.products.find(p => p.id == productId);
        
        if (!product) {
            this.showError('Product not found');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            console.log('Deleting product:', productId);
            
            // Call delete API
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.showSuccess(`Product "${product.name}" deleted successfully`);
                // Reload products list
                this.loadProducts(this.currentPage, this.filters);
            } else {
                throw new Error('Delete request failed');
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
            this.showError('Failed to delete product. Please try again.');
        }
    }

    // Filter products
    async filterProducts() {
        const search = document.getElementById('productSearch')?.value || '';
        const status = document.getElementById('productStatusFilter')?.value || '';

        const filters = {};
        if (search) filters.search = search;
        if (status) filters.status = status;

        await this.loadProducts(1, filters);
    }

    // Show success message
    showSuccess(message) {
        if (window.AdminApp && window.AdminApp.showNotification) {
            window.AdminApp.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    // Show error message
    showError(message) {
        if (window.AdminApp && window.AdminApp.showNotification) {
            window.AdminApp.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    // Show success notification
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show notification helper
    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.admin-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `admin-notification fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success' ? 
                        '<i class="fas fa-check-circle"></i>' :
                        type === 'error' ? 
                        '<i class="fas fa-exclamation-circle"></i>' :
                        '<i class="fas fa-info-circle"></i>'
                    }
                </div>
                <div class="flex-1">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // View product on website
    viewOnSite(productId) {
        console.log('Viewing product on site:', productId);
        const product = this.products.find(p => p.id == productId);
        
        if (product) {
            // Open product detail page in new tab
            const productUrl = `/product.html?id=${productId}`;
            window.open(productUrl, '_blank');
            this.showSuccess(`Opening product page for ${product.name}`);
        } else {
            this.showError('Product not found');
        }
    }
}

window.ProductsManager = new ProductsManager();

// Initialize filter button event
document.addEventListener('DOMContentLoaded', () => {
    const filterBtn = document.getElementById('filterProductsBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            window.ProductsManager.filterProducts();
        });
    }

    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            window.location.href = 'add-product.html';
        });
    }
});