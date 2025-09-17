// Product Detail Page Management
class ProductDetailManager {
    constructor() {
        this.productId = null;
        this.productData = null;
        this.selectedVariant = null;
        this.selectedQuantity = 1;
        
        this.init();
    }

    async init() {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id') || urlParams.get('sku');
        
        if (!this.productId) {
            this.showError('Product not found');
            return;
        }

        await this.loadProduct();
        this.setupEventListeners();
        this.setupTabNavigation();
    }

    async loadProduct() {
        try {
            // For now, create a mock product structure using enhanced features
            // In production, this would fetch from: `/api/products/${this.productId}`
            
            this.productData = {
                id: this.productId,
                name: '316 Curved Wall Spout',
                sku: 'EL-01015178',
                originalSku: '316-CURVED-WALL-SPOUT',
                brand: 'Abey',
                manufacturer: 'Abey Australia',
                price: 899.00,
                sale_price: null,
                short_description: 'Transform your bathroom or kitchen space with this elegantly designed 316 Curved Wall Spout from Abey Australia.',
                long_description: `
                    <h3>Premium Australian Tapware Excellence</h3>
                    <p>Transform your bathroom or kitchen space with the elegantly designed 316 Curved Wall Spout from Abey Australia's premium tapware collection. This luxury wall-mounted spout combines sophisticated aesthetics with superior functionality.</p>
                    
                    <h4>Key Features:</h4>
                    <ul>
                        <li>Crafted from high-grade 316 marine-grade stainless steel</li>
                        <li>Curved design for elegant water flow</li>
                        <li>Wall-mounted installation</li>
                        <li>Australian designed and engineered</li>
                        <li>Suitable for bathroom and kitchen applications</li>
                        <li>Easy maintenance and cleaning</li>
                    </ul>
                    
                    <h4>Applications:</h4>
                    <p>Perfect for modern bathrooms, luxury powder rooms, and contemporary kitchen designs. The curved spout design adds a sophisticated touch while providing practical functionality.</p>
                `,
                images: [
                    'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png',
                    'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-1024x1024.png',
                    'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-300x300.png'
                ],
                colors: ['Chrome'],
                colorVariants: [
                    {
                        name: 'Chrome',
                        finish: 'Chrome',
                        sku: 'EL-01015179',
                        originalSku: '316-CURVED-WALL-SPOUT.00',
                        price: 899.00,
                        hex: '#C8C8C8',
                        image: 'https://abey-glamour-media.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2025/08/WSS001-316-800x800.png'
                    }
                ],
                specifications: {
                    'Installation Guide': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ii/Installation-Instructions_WSS001-316.pdf',
                    'Technical Specification': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ts/WSS001-316.pdf',
                    'Product Brochure': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_b/ABEY0478_Alfresco_Brochure_2025.pdf'
                },
                documents: [
                    {
                        name: 'Installation Guide',
                        url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ii/Installation-Instructions_WSS001-316.pdf',
                        type: 'installation guide'
                    },
                    {
                        name: 'Technical Specification',
                        url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_ts/WSS001-316.pdf',
                        type: 'technical specification'
                    },
                    {
                        name: 'Product Brochure',
                        url: 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://s3.ap-southeast-2.amazonaws.com/assets.abey.com.au/abey_extend/aef_b/ABEY0478_Alfresco_Brochure_2025.pdf',
                        type: 'brochure'
                    }
                ],
                categories: ['100', '140', '144'], // Bathrooms -> Tapware -> Bath Spout & Wall Mixers
                status: 'published',
                in_stock: true,
                stock_quantity: 50
            };

            this.renderProduct();
            
        } catch (error) {
            console.error('Failed to load product:', error);
            this.showError('Failed to load product details');
        }
    }

    renderProduct() {
        if (!this.productData) return;

        // Update page title and meta
        document.title = `${this.productData.name} - Ecco Living`;
        document.querySelector('meta[name="description"]').content = this.productData.short_description;

        // Update breadcrumbs
        document.getElementById('breadcrumbProduct').textContent = this.productData.name;

        // Update product information
        document.getElementById('productTitle').textContent = this.productData.name;
        document.getElementById('productSku').textContent = this.productData.sku;
        document.getElementById('originalSku').textContent = this.productData.originalSku;
        document.getElementById('productBrand').textContent = this.productData.brand;
        document.getElementById('productPrice').textContent = `$${this.productData.price.toFixed(2)}`;
        
        // Update descriptions
        document.getElementById('shortDescription').textContent = this.productData.short_description;
        document.getElementById('longDescription').innerHTML = this.productData.long_description;

        // Render images
        this.renderImages();
        
        // Render color options if available
        if (this.productData.colorVariants && this.productData.colorVariants.length > 1) {
            this.renderColorOptions();
        }

        // Render specifications
        this.renderSpecifications();
        
        // Render documents
        this.renderDocuments();
    }

    renderImages() {
        const mainImage = document.getElementById('mainProductImage');
        const thumbnailGallery = document.getElementById('thumbnailGallery');

        if (this.productData.images && this.productData.images.length > 0) {
            // Set main image
            mainImage.src = this.productData.images[0];
            mainImage.alt = this.productData.name;

            // Create thumbnails
            thumbnailGallery.innerHTML = this.productData.images.map((image, index) => `
                <div class="aspect-square bg-gray-50 rounded-lg overflow-hidden cursor-pointer thumbnail ${index === 0 ? 'thumbnail-active' : ''}" 
                     onclick="productDetail.switchMainImage('${image}', this)">
                    <img src="${image}" alt="${this.productData.name}" class="w-full h-full object-cover">
                </div>
            `).join('');
        }
    }

    switchMainImage(imageUrl, thumbnailElement) {
        // Update main image
        document.getElementById('mainProductImage').src = imageUrl;
        
        // Update thumbnail active state
        document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('thumbnail-active'));
        thumbnailElement.classList.add('thumbnail-active');
    }

    renderColorOptions() {
        const colorSelection = document.getElementById('colorSelection');
        const colorOptions = document.getElementById('colorOptions');
        
        colorSelection.classList.remove('hidden');
        
        colorOptions.innerHTML = this.productData.colorVariants.map((variant, index) => `
            <div class="flex flex-col items-center gap-2">
                <div class="color-swatch ${index === 0 ? 'active' : ''}" 
                     style="background-color: ${variant.hex}"
                     onclick="productDetail.selectColor(${index})"
                     title="${variant.name}">
                </div>
                <span class="text-xs text-gray-600">${variant.name}</span>
            </div>
        `).join('');

        // Set initial selection
        if (this.productData.colorVariants.length > 0) {
            this.selectedVariant = this.productData.colorVariants[0];
            document.getElementById('selectedFinish').textContent = this.selectedVariant.name;
        }
    }

    selectColor(index) {
        this.selectedVariant = this.productData.colorVariants[index];
        
        // Update UI
        document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('active'));
        document.querySelectorAll('.color-swatch')[index].classList.add('active');
        document.getElementById('selectedFinish').textContent = this.selectedVariant.name;
        
        // Update price if variant has different price
        if (this.selectedVariant.price) {
            document.getElementById('productPrice').textContent = `$${this.selectedVariant.price.toFixed(2)}`;
        }
        
        // Update image if variant has specific image
        if (this.selectedVariant.image) {
            document.getElementById('mainProductImage').src = this.selectedVariant.image;
        }
    }

    renderSpecifications() {
        const specificationsTable = document.getElementById('specificationsTable');
        
        if (this.productData.specifications && Object.keys(this.productData.specifications).length > 0) {
            specificationsTable.innerHTML = Object.entries(this.productData.specifications).map(([key, value]) => `
                <div class="specification-row flex justify-between items-center py-3 px-4 rounded">
                    <span class="font-medium text-gray-900">${key}</span>
                    <span class="text-gray-700">
                        ${value.startsWith('chrome-extension://') ? 
                            `<a href="${value}" target="_blank" class="inline-flex items-center text-blue-600 hover:text-blue-800">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                View ${key}
                            </a>` : 
                            value
                        }
                    </span>
                </div>
            `).join('');
        } else {
            specificationsTable.innerHTML = '<p class="text-gray-500">No specifications available</p>';
        }
    }

    renderDocuments() {
        const documentsContainer = document.getElementById('documentsContainer');
        
        if (this.productData.documents && this.productData.documents.length > 0) {
            documentsContainer.innerHTML = this.productData.documents.map(doc => `
                <div class="border border-gray-200 rounded-lg p-4 hover:border-accent transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">${doc.name}</h4>
                                <p class="text-sm text-gray-500 capitalize">${doc.type}</p>
                            </div>
                        </div>
                        <a href="${doc.url}" target="_blank" 
                           class="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            View PDF
                        </a>
                    </div>
                </div>
            `).join('');
        } else {
            documentsContainer.innerHTML = '<p class="text-gray-500">No documents available</p>';
        }
    }

    setupEventListeners() {
        // Add to cart button
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            this.addToCart();
        });

        // Quantity input
        document.getElementById('quantity').addEventListener('change', (e) => {
            this.selectedQuantity = parseInt(e.target.value) || 1;
        });
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.product-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update tab states
                tabs.forEach(t => {
                    t.classList.remove('active', 'border-accent', 'text-accent');
                    t.classList.add('border-transparent', 'text-gray-500');
                });
                
                tab.classList.add('active', 'border-accent', 'text-accent');
                tab.classList.remove('border-transparent', 'text-gray-500');
                
                // Update content visibility
                tabContents.forEach(content => content.classList.add('hidden'));
                document.getElementById(`${targetTab}Tab`).classList.remove('hidden');
            });
        });
    }

    addToCart() {
        const productToAdd = {
            id: this.productData.id,
            name: this.productData.name,
            sku: this.selectedVariant ? this.selectedVariant.sku : this.productData.sku,
            price: this.selectedVariant ? this.selectedVariant.price : this.productData.price,
            image: this.selectedVariant ? this.selectedVariant.image : this.productData.images[0],
            quantity: this.selectedQuantity,
            variant: this.selectedVariant ? this.selectedVariant.name : null
        };

        // Add to cart logic (would integrate with existing cart system)
        console.log('Adding to cart:', productToAdd);
        
        // Show success message
        this.showSuccess('Product added to cart!');
        
        // Update cart count (integrate with existing cart functionality)
        this.updateCartCount();
    }

    updateCartCount() {
        // This would integrate with your existing cart system
        const cartCount = document.getElementById('cartCount');
        const currentCount = parseInt(cartCount.textContent) || 0;
        cartCount.textContent = currentCount + this.selectedQuantity;
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
        const container = document.querySelector('main');
        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center">
                <div class="max-w-md mx-auto">
                    <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <a href="index.html" class="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium">
                        Return Home
                    </a>
                </div>
            </div>
        `;
    }
}

// Initialize when page loads
let productDetail;
document.addEventListener('DOMContentLoaded', () => {
    productDetail = new ProductDetailManager();
});

// CSS for active tab styling
const style = document.createElement('style');
style.textContent = `
    .product-tab.active {
        border-color: #c0c0c0;
        color: #c0c0c0;
    }
`;
document.head.appendChild(style);