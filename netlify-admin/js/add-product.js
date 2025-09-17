// Add Product functionality for admin dashboard
class AddProductManager {
    constructor() {
        this.uploadedImages = {
            main: null,
            gallery: []
        };
        this.variations = [];
        this.specifications = [];
        this.categories = [];
        this.quillEditor = null;
        
        this.init();
    }

    async init() {
        // Check if we're in edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId) {
            console.log('🔧 Edit mode detected for product ID:', editId);
            this.isEditMode = true;
            this.editProductId = editId;
            
            // Update page title safely
            const pageTitle = document.querySelector('h1') || document.querySelector('.text-2xl') || document.querySelector('[class*="text-"]');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Product';
                console.log('✅ Updated page title to Edit Product');
            } else {
                console.log('⚠️ Could not find page title element to update');
            }
        }

        await this.loadCategories();
        this.setupRichTextEditor();
        this.setupImageUploads();
        this.setupFormValidation();
        this.setupEventListeners();
        this.setupSlugGeneration();
        this.setupStockManagement();
        this.setupSmartImport();
        this.setupCategorySearch();
        this.setupAiEnhancement();
        
        // Load existing product data if in edit mode
        if (this.isEditMode) {
            await this.loadProductForEdit();
        }
    }

    // Load existing product data for editing
    async loadProductForEdit() {
        try {
            console.log('📖 Loading product data for edit...', this.editProductId);
            
            // Fetch product data from API
            const response = await fetch(`/api/products/${this.editProductId}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                const product = data.data;
                console.log('📦 Loaded product for edit:', product.name);
                
                // Helper function to safely set field values
                const setFieldValue = (fieldId, value) => {
                    const field = document.getElementById(fieldId);
                    if (field && value !== null && value !== undefined) {
                        field.value = value;
                        console.log(`✅ Set ${fieldId}:`, value);
                    } else if (!field) {
                        console.log(`⚠️ Field not found: ${fieldId}`);
                    }
                };

                // Populate form fields with existing data (using correct field IDs)
                setFieldValue('name', product.name); // Correct field ID
                setFieldValue('slug', product.slug);
                setFieldValue('sku', product.sku);
                setFieldValue('original_sku', product.original_sku); // Correct field ID
                setFieldValue('brand', product.brand);
                setFieldValue('price', product.price);
                setFieldValue('costPrice', product.cost_price);
                setFieldValue('salePrice', product.sale_price);
                setFieldValue('stockQuantity', product.stock_quantity);
                setFieldValue('weight', product.weight);
                setFieldValue('status', product.status || 'published');
                
                // Set descriptions safely
                setFieldValue('shortDescription', product.short_description);
                
                if (product.long_description && this.quillEditor) {
                    this.quillEditor.root.innerHTML = product.long_description;
                    console.log('✅ Set long description in Quill editor');
                }
                
                // Set categories
                if (product.categories && Array.isArray(product.categories)) {
                    product.categories.forEach(categoryId => {
                        const checkbox = document.getElementById(`category_${categoryId}`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }
                
                // Set specifications
                if (product.specifications) {
                    this.specifications = [];
                    Object.entries(product.specifications).forEach(([key, value]) => {
                        this.specifications.push({
                            id: Date.now() + Math.random(),
                            name: key,
                            value: value
                        });
                    });
                    this.renderSpecifications();
                }
                
                // Set images
                if (product.images && Array.isArray(product.images)) {
                    this.uploadedImages.gallery = product.images;
                    console.log('📷 Setting product images:', product.images);
                    
                    // Check if the method exists before calling it
                    if (typeof this.renderUploadedImages === 'function') {
                        this.renderUploadedImages();
                        console.log('✅ Rendered uploaded images');
                    } else {
                        console.log('⚠️ renderUploadedImages method not found, skipping image rendering');
                        
                        // Simple image display fallback
                        const imageContainer = document.querySelector('#imagePreview, .image-preview, .uploaded-images');
                        if (imageContainer) {
                            imageContainer.innerHTML = product.images.map(img => `
                                <div class="image-preview">
                                    <img src="${img}" alt="Product image" class="w-20 h-20 object-cover rounded">
                                </div>
                            `).join('');
                        }
                    }
                }
                
                console.log('✅ Product data loaded into form successfully');
                
            } else {
                throw new Error('Product not found');
            }
            
        } catch (error) {
            console.error('❌ Failed to load product for edit:', error);
            alert('Failed to load product data for editing. Please try again.');
        }
    }

    // Load categories from API
    async loadCategories() {
        try {
            const categories = await API.getCategories();
            this.categories = Array.isArray(categories) ? categories : categories.data || [];
            this.renderCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = [];
            this.renderCategories();
        }
    }

    // Render categories checkboxes
    renderCategories(filteredCategories = null) {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        const categoriesToRender = filteredCategories || this.categories;

        if (categoriesToRender.length === 0) {
            container.innerHTML = filteredCategories 
                ? `<p class="text-gray-500 text-sm">No categories match your search.</p>`
                : `<p class="text-gray-500 text-sm">No categories available.</p>
                   <button type="button" class="text-accent text-sm hover:underline mt-2">Create Category</button>`;
            return;
        }

        // Organize categories by hierarchy for better display
        const categoryHtml = this.buildCategoryHierarchy(categoriesToRender);
        container.innerHTML = categoryHtml;
    }

    // Build hierarchical category display
    buildCategoryHierarchy(categories) {
        const categoryMap = new Map();
        const rootCategories = [];

        // Create a map and find root categories
        categories.forEach(category => {
            categoryMap.set(category.id, { ...category, children: [] });
            if (!category.parent_id) {
                rootCategories.push(category.id);
            }
        });

        // Build hierarchy
        categories.forEach(category => {
            if (category.parent_id && categoryMap.has(category.parent_id)) {
                categoryMap.get(category.parent_id).children.push(category.id);
            }
        });

        // Render hierarchy
        let html = '';
        rootCategories.forEach(rootId => {
            html += this.renderCategoryTree(categoryMap.get(rootId), categoryMap, 0);
        });

        return html;
    }

    // Render category tree recursively
    renderCategoryTree(category, categoryMap, level) {
        const indent = level * 20; // 20px per level
        const isParent = category.children.length > 0;
        
        let html = `
            <div class="flex items-center py-1" style="margin-left: ${indent}px">
                <input type="checkbox" 
                       id="category_${category.id}" 
                       name="categories" 
                       value="${category.id}"
                       class="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded">
                <label for="category_${category.id}" class="ml-2 text-sm text-gray-700 ${isParent ? 'font-medium' : ''}">
                    ${isParent ? '📁 ' : '📄 '}${category.name}
                </label>
            </div>
        `;

        // Render children
        category.children.forEach(childId => {
            const child = categoryMap.get(childId);
            if (child) {
                html += this.renderCategoryTree(child, categoryMap, level + 1);
            }
        });

        return html;
    }

    // Setup rich text editor
    setupRichTextEditor() {
        const editorElement = document.getElementById('longDescriptionEditor');
        if (!editorElement) return;

        this.quillEditor = new Quill(editorElement, {
            theme: 'snow',
            placeholder: 'Write detailed product description...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link'],
                    ['clean']
                ]
            }
        });

        // Update hidden textarea when content changes
        this.quillEditor.on('text-change', () => {
            const hiddenTextarea = document.getElementById('longDescription');
            if (hiddenTextarea) {
                hiddenTextarea.value = this.quillEditor.root.innerHTML;
            }
        });
    }

    // Setup image upload functionality
    setupImageUploads() {
        this.setupMainImageUpload();
        this.setupGalleryUpload();
    }

    // Setup main image upload
    setupMainImageUpload() {
        const uploadArea = document.getElementById('mainImageUpload');
        const fileInput = document.getElementById('mainImageInput');
        const preview = document.getElementById('mainImagePreview');

        if (!uploadArea || !fileInput || !preview) return;

        // Click to browse
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.handleMainImageUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleMainImageUpload(e.target.files[0]);
            }
        });
    }

    // Handle main image upload
    async handleMainImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showError('Image file size must be less than 5MB');
            return;
        }

        try {
            const imageUrl = await this.uploadImage(file);
            this.uploadedImages.main = imageUrl;
            this.renderMainImagePreview(imageUrl);
        } catch (error) {
            console.error('Failed to upload main image:', error);
            this.showError('Failed to upload image');
        }
    }

    // Render main image preview
    renderMainImagePreview(imageUrl) {
        const preview = document.getElementById('mainImagePreview');
        if (!preview) return;

        preview.innerHTML = `
            <div class="image-preview">
                <img src="${imageUrl}" alt="Main product image" class="w-32 h-32 object-cover rounded-lg border">
                <button type="button" class="remove-btn" onclick="addProductManager.removeMainImage()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    // Remove main image
    removeMainImage() {
        this.uploadedImages.main = null;
        document.getElementById('mainImagePreview').innerHTML = '';
    }

    // Setup gallery upload
    setupGalleryUpload() {
        const uploadArea = document.getElementById('galleryUpload');
        const fileInput = document.getElementById('galleryInput');
        const preview = document.getElementById('galleryPreview');

        if (!uploadArea || !fileInput || !preview) return;

        // Click to browse
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.handleGalleryUpload(files);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleGalleryUpload(Array.from(e.target.files));
            }
        });
    }

    // Handle gallery upload
    async handleGalleryUpload(files) {
        const maxImages = 10;
        const currentCount = this.uploadedImages.gallery.length;
        
        if (currentCount + files.length > maxImages) {
            this.showError(`Maximum ${maxImages} gallery images allowed`);
            return;
        }

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                this.showError(`${file.name} is not a valid image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                this.showError(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            try {
                const imageUrl = await this.uploadImage(file);
                this.uploadedImages.gallery.push(imageUrl);
            } catch (error) {
                console.error('Failed to upload gallery image:', error);
                this.showError(`Failed to upload ${file.name}`);
            }
        }

        this.renderGalleryPreview();
    }

    // Render gallery preview
    renderGalleryPreview() {
        const preview = document.getElementById('galleryPreview');
        if (!preview) return;

        preview.innerHTML = this.uploadedImages.gallery.map((imageUrl, index) => `
            <div class="image-preview">
                <img src="${imageUrl}" alt="Gallery image ${index + 1}" class="w-24 h-24 object-cover rounded-lg border">
                <button type="button" class="remove-btn" onclick="addProductManager.removeGalleryImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    // Remove gallery image
    removeGalleryImage(index) {
        this.uploadedImages.gallery.splice(index, 1);
        this.renderGalleryPreview();
    }

    // Upload image to server
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            return result.url || result.path || `/uploads/${file.name}`;
        } catch (error) {
            throw error;
        }
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('productForm');
        if (!form) return;

        // Real-time validation
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Price validation
        const priceFields = ['price', 'salePrice', 'costPrice'];
        priceFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validatePrice(field));
            }
        });
    }

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;

        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, `${this.getFieldLabel(fieldName)} is required`);
            return false;
        }

        return true;
    }

    // Validate price field
    validatePrice(field) {
        const value = parseFloat(field.value);
        
        if (field.value && (isNaN(value) || value < 0)) {
            this.showFieldError(field, 'Please enter a valid price');
            return false;
        }

        // Check sale price is less than regular price
        if (field.id === 'salePrice' && value) {
            const regularPrice = parseFloat(document.getElementById('price').value);
            if (regularPrice && value >= regularPrice) {
                this.showFieldError(field, 'Sale price must be less than regular price');
                return false;
            }
        }

        this.clearFieldError(field);
        return true;
    }

    // Show field error
    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('border-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-xs mt-1';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('border-red-500');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Get field label
    getFieldLabel(fieldName) {
        const labels = {
            name: 'Product Name',
            sku: 'SKU',
            price: 'Price',
            email: 'Email',
            password: 'Password'
        };
        return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }

    // Setup event listeners
    setupEventListeners() {
        // Add variation button
        const addVariationBtn = document.getElementById('addVariationBtn');
        if (addVariationBtn) {
            addVariationBtn.addEventListener('click', () => this.addVariation());
        }

        // Add specification button
        const addSpecBtn = document.getElementById('addSpecBtn');
        if (addSpecBtn) {
            addSpecBtn.addEventListener('click', () => this.addSpecification());
        }

        // Save buttons
        const saveAsDraftBtn = document.getElementById('saveAsDraftBtn');
        const publishBtn = document.getElementById('publishBtn');

        if (saveAsDraftBtn) {
            saveAsDraftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveProduct('draft');
            });
        }

        if (publishBtn) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveProduct('published');
            });
        }
    }

    // Setup automatic slug generation
    setupSlugGeneration() {
        const nameField = document.getElementById('name');
        const slugField = document.getElementById('slug');

        if (nameField && slugField) {
            nameField.addEventListener('input', () => {
                if (!slugField.dataset.userModified) {
                    slugField.value = this.generateSlug(nameField.value);
                }
            });

            slugField.addEventListener('input', () => {
                slugField.dataset.userModified = 'true';
            });
        }
    }

    // Generate URL-friendly slug
    generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Setup stock management
    setupStockManagement() {
        const manageStockCheckbox = document.getElementById('manageStock');
        const stockFields = document.getElementById('stockFields');

        if (manageStockCheckbox && stockFields) {
            manageStockCheckbox.addEventListener('change', () => {
                stockFields.style.display = manageStockCheckbox.checked ? 'grid' : 'none';
            });
        }
    }

    // Add product variation
    addVariation() {
        const variation = {
            id: Date.now(),
            name: '',
            values: ['']
        };

        this.variations.push(variation);
        this.renderVariations();
    }

    // Render variations
    renderVariations() {
        const container = document.getElementById('variationsContainer');
        if (!container) return;

        if (this.variations.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No variations added. Click "Add Variation" to create color, size, or material options.</p>';
            return;
        }

        container.innerHTML = this.variations.map((variation, index) => `
            <div class="variant-row">
                <div class="flex items-center justify-between mb-4">
                    <input type="text" 
                           placeholder="Variation name (e.g., Color, Size, Material)" 
                           value="${variation.name}"
                           onchange="addProductManager.updateVariationName(${index}, this.value)"
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
                    <button type="button" 
                            onclick="addProductManager.removeVariation(${index})"
                            class="ml-4 text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600">Values:</label>
                    <div id="variationValues_${index}">
                        ${variation.values.map((value, valueIndex) => {
                            const varData = (typeof value === 'object') ? value : { name: value, sku: '', price: 0 };
                            return `
                            <div class="space-y-3 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div>
                                    <label class="text-sm font-medium text-gray-700 mb-2 block">Color/Finish</label>
                                    <div class="flex items-center gap-3">
                                        <div class="relative">
                                            <div class="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-md flex-shrink-0 overflow-hidden"
                                                 style="background: ${varData.hex ? `linear-gradient(135deg, ${varData.hex} 0%, ${varData.hex} 100%)` : '#CCCCCC'};"
                                                 title="${varData.name || value} color">
                                                ${varData.image ? `<img src="${varData.image}" alt="${varData.name}" class="w-full h-full object-cover opacity-30">` : ''}
                                            </div>
                                            ${varData.image ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" title="Image linked"></div>' : ''}
                                        </div>
                                        <div class="flex-1">
                                            <input type="text" 
                                                   placeholder="Enter finish name" 
                                                   value="${varData.name || value}"
                                                   onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'name', this.value)"
                                                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent mb-2">
                                            <div class="flex items-center gap-2">
                                                <input type="color" 
                                                       value="${varData.hex || '#CCCCCC'}"
                                                       onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'hex', this.value); addProductManager.updateColorDisplay(${index}, ${valueIndex})"
                                                       class="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                                                       title="Pick color for ${varData.name || value}">
                                                <span class="text-xs text-gray-500 font-mono">${varData.hex || '#CCCCCC'}</span>
                                                ${varData.originalSku ? `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${varData.originalSku}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-700 mb-2 block">SKU</label>
                                    <input type="text" 
                                           placeholder="Auto-generated" 
                                           value="${varData.sku || ''}"
                                           onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'sku', this.value)"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-700 mb-2 block">Cost Price ($)</label>
                                    <input type="number" 
                                           placeholder="0.00" 
                                           value="${varData.cost_price || ''}"
                                           step="0.01"
                                           onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'cost_price', this.value)"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-700 mb-2 block">Regular Price ($)</label>
                                    <input type="number" 
                                           placeholder="0.00" 
                                           value="${varData.price || ''}"
                                           step="0.01"
                                           onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'price', this.value)"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-700 mb-2 block">Original SKU</label>
                                    <input type="text" 
                                           placeholder="Manufacturer SKU" 
                                           value="${varData.originalSku || ''}"
                                           onchange="addProductManager.updateVariationValue(${index}, ${valueIndex}, 'originalSku', this.value)"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                </div>
                                <div class="flex items-center gap-2 pt-2">
                                    <button type="button" 
                                            onclick="addProductManager.linkColorToImage(${index}, ${valueIndex})"
                                            class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                            title="Link to image">
                                        <i class="fas fa-link"></i>
                                    </button>
                                    <button type="button" 
                                            onclick="addProductManager.removeVariationValue(${index}, ${valueIndex})"
                                            class="text-red-600 hover:text-red-800 p-2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                    <button type="button" 
                            onclick="addProductManager.addVariationValue(${index})"
                            class="text-accent text-sm hover:underline">
                        + Add Value
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update variation name
    updateVariationName(index, name) {
        if (this.variations[index]) {
            this.variations[index].name = name;
        }
    }

    // Update variation value (enhanced for SKU and price)
    updateVariationValue(index, valueIndex, field, value) {
        if (this.variations[index] && this.variations[index].values[valueIndex] !== undefined) {
            if (field) {
                // Handle object-based variations with SKU and price
                if (typeof this.variations[index].values[valueIndex] === 'object') {
                    this.variations[index].values[valueIndex][field] = value;
                } else {
                    // Convert to object if it's a simple string
                    const oldValue = this.variations[index].values[valueIndex];
                    this.variations[index].values[valueIndex] = {
                        name: field === 'name' ? value : oldValue,
                        sku: field === 'sku' ? value : '',
                        price: field === 'price' ? parseFloat(value) || 0 : 0
                    };
                }
            } else {
                // Backward compatibility for simple string values
                this.variations[index].values[valueIndex] = value;
            }
        }
    }

    // Add variation value
    addVariationValue(index) {
        if (this.variations[index]) {
            this.variations[index].values.push('');
            this.renderVariations();
        }
    }

    // Remove variation value
    removeVariationValue(index, valueIndex) {
        if (this.variations[index] && this.variations[index].values.length > 1) {
            this.variations[index].values.splice(valueIndex, 1);
            this.renderVariations();
        }
    }

    // Remove variation
    removeVariation(index) {
        this.variations.splice(index, 1);
        this.renderVariations();
    }

    // Update color display when color picker changes
    updateColorDisplay(variationIndex, valueIndex) {
        const variation = this.variations[variationIndex];
        if (!variation || !variation.values[valueIndex]) return;
        
        const varData = variation.values[valueIndex];
        const hexColor = varData.hex || '#CCCCCC';
        
        // Find the color display element and update it
        const variationContainer = document.querySelector(`#variationValues_${variationIndex} > div:nth-child(${valueIndex + 1})`);
        if (variationContainer) {
            const colorDisplay = variationContainer.querySelector('.w-12.h-12');
            const hexSpan = variationContainer.querySelector('.font-mono');
            
            if (colorDisplay) {
                const gradientColor = this.adjustColorBrightness(hexColor, -0.2);
                colorDisplay.style.background = `linear-gradient(135deg, ${hexColor} 0%, ${gradientColor} 100%)`;
            }
            
            if (hexSpan) {
                hexSpan.textContent = hexColor;
            }
        }
    }
    
    // Helper function to adjust color brightness
    adjustColorBrightness(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Adjust brightness
        const newR = Math.max(0, Math.min(255, Math.round(r * (1 + percent))));
        const newG = Math.max(0, Math.min(255, Math.round(g * (1 + percent))));
        const newB = Math.max(0, Math.min(255, Math.round(b * (1 + percent))));
        
        // Convert back to hex
        return '#' + ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
    }

    // Manual color to image linking
    linkColorToImage(variationIndex, valueIndex) {
        const variation = this.variations[variationIndex];
        const colorData = variation.values[valueIndex];
        
        if (!colorData || typeof colorData !== 'object') {
            this.showError('Please save color data first');
            return;
        }
        
        // Create modal to select image for this color
        const availableImages = this.uploadedImages.gallery.concat(this.uploadedImages.main ? [this.uploadedImages.main] : []);
        
        if (availableImages.length === 0) {
            this.showError('No images available. Please upload images first.');
            return;
        }
        
        // Create simple prompt-based selection for now
        const imageList = availableImages.map((img, i) => `${i + 1}. ${img.split('/').pop()}`).join('\n');
        const selection = prompt(`Link "${colorData.name}" to which image?\n\n${imageList}\n\nEnter number (1-${availableImages.length}):`);
        
        if (selection && !isNaN(selection)) {
            const imageIndex = parseInt(selection) - 1;
            if (imageIndex >= 0 && imageIndex < availableImages.length) {
                colorData.image = availableImages[imageIndex];
                this.showSuccess(`Linked ${colorData.name} to image successfully!`);
                this.renderVariations(); // Refresh display
            }
        }
    }

    // Add specification
    addSpecification() {
        const spec = {
            id: Date.now(),
            name: '',
            value: ''
        };

        this.specifications.push(spec);
        this.renderSpecifications();
    }

    // HTML escape function to prevent attribute injection
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render specifications
    renderSpecifications() {
        const container = document.getElementById('specificationsContainer');
        if (!container) return;

        if (this.specifications.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No specifications added. Click "Add Specification" to add technical details.</p>';
            return;
        }

        container.innerHTML = this.specifications.map((spec, index) => `
            <div class="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <input type="text" 
                       placeholder="Specification name" 
                       value="${this.escapeHtml(spec.name)}"
                       onchange="addProductManager.updateSpecificationName(${index}, this.value)"
                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
                <input type="text" 
                       placeholder="Value" 
                       value="${this.escapeHtml(spec.value)}"
                       onchange="addProductManager.updateSpecificationValue(${index}, this.value)"
                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent">
                <button type="button" 
                        onclick="addProductManager.removeSpecification(${index})"
                        class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // Update specification name
    updateSpecificationName(index, name) {
        if (this.specifications[index]) {
            this.specifications[index].name = name;
        }
    }

    // Update specification value
    updateSpecificationValue(index, value) {
        if (this.specifications[index]) {
            this.specifications[index].value = value;
        }
    }

    // Remove specification
    removeSpecification(index) {
        this.specifications.splice(index, 1);
        this.renderSpecifications();
    }

    // Save product
    async saveProduct(status) {
        try {
            this.showLoading(true);
            
            if (!this.validateForm()) {
                this.showLoading(false);
                return;
            }

            const formData = this.collectFormData();
            formData.status = status;

            const response = await API.createProduct(formData);
            
            this.showSuccess(`Product ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
            
            // Redirect to product list after a short delay
            setTimeout(() => {
                // If we're in the admin panel already, just navigate to products section
                if (window.AdminApp) {
                    // Simulate click on products navigation
                    const productsLink = document.querySelector('[data-section="products"]');
                    if (productsLink) {
                        productsLink.click();
                    }
                } else {
                    // Fallback to full page navigation
                    window.location.href = 'index.html#products';
                }
            }, 1500);
            
        } catch (error) {
            console.error('Failed to save product:', error);
            this.showError('Failed to save product. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Validate entire form
    validateForm() {
        const form = document.getElementById('productForm');
        if (!form) return false;

        let isValid = true;
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate prices
        const priceFields = ['price', 'salePrice', 'costPrice'];
        priceFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validatePrice(field)) {
                isValid = false;
            }
        });

        // Validate images
        if (!this.uploadedImages.main) {
            this.showError('Please upload a main product image');
            isValid = false;
        }

        return isValid;
    }

    // Collect form data
    collectFormData() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const data = {};
        
        // Basic form fields
        for (let [key, value] of formData.entries()) {
            if (key === 'categories') {
                if (!data.categories) data.categories = [];
                data.categories.push(value);
            } else {
                data[key] = value;
            }
        }

        // Images
        data.images = this.uploadedImages.main ? [this.uploadedImages.main] : [];
        data.gallery = this.uploadedImages.gallery;

        // Variations
        data.variations = this.variations.filter(v => v.name && v.values.some(val => val));

        // Specifications
        const specs = {};
        this.specifications.forEach(spec => {
            if (spec.name && spec.value) {
                specs[spec.name] = spec.value;
            }
        });
        data.specifications = specs;

        // Dimensions
        const length = document.getElementById('length')?.value;
        const width = document.getElementById('width')?.value;
        const height = document.getElementById('height')?.value;
        
        if (length || width || height) {
            data.dimensions = {
                length: parseFloat(length) || 0,
                width: parseFloat(width) || 0,
                height: parseFloat(height) || 0
            };
        }

        // SEO keywords
        const keywords = document.getElementById('seoKeywords')?.value;
        if (keywords) {
            data.seo_keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
        }

        // Rich text content
        if (this.quillEditor) {
            data.long_description = this.quillEditor.root.innerHTML;
        }

        // Convert string numbers to actual numbers
        ['price', 'sale_price', 'cost_price', 'stock_quantity', 'low_stock_threshold', 'weight', 'sort_order'].forEach(field => {
            if (data[field]) {
                data[field] = parseFloat(data[field]) || 0;
            }
        });

        // Convert checkboxes
        data.manage_stock = document.getElementById('manageStock')?.checked || false;
        data.is_featured = document.getElementById('isFeatured')?.checked || false;
        data.in_stock = data.stock_quantity > 0;

        return data;
    }

    // Show loading state
    showLoading(isLoading) {
        const form = document.getElementById('productForm');
        const buttons = document.querySelectorAll('#saveAsDraftBtn, #publishBtn');
        
        if (isLoading) {
            form?.classList.add('loading');
            buttons.forEach(btn => {
                btn.disabled = true;
                const originalText = btn.textContent;
                btn.dataset.originalText = originalText;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            });
        } else {
            form?.classList.remove('loading');
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = btn.dataset.originalText || btn.textContent;
            });
        }
    }

    // Show success message
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Show message
    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="ml-4">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Setup smart import functionality
    setupSmartImport() {
        const scrapeBtn = document.getElementById('scrapeUrlBtn');
        const scrapePdfBtn = document.getElementById('scrapePdfBtn');
        const urlInput = document.getElementById('supplierUrl');
        const applyBtn = document.getElementById('applyScrapeBtn');
        const discardBtn = document.getElementById('discardScrapeBtn');

        if (scrapeBtn && urlInput) {
            scrapeBtn.addEventListener('click', () => this.scrapeProductData());
            
            // Allow Enter key in URL input
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.scrapeProductData();
                }
            });
        }

        // Add dynamic scrape button
        const dynamicScrapeBtn = document.getElementById('scrapeDynamicBtn');
        if (dynamicScrapeBtn && urlInput) {
            dynamicScrapeBtn.addEventListener('click', () => this.scrapeDynamicPricing());
        }

        // Add industry pricing button
        const industryPriceBtn = document.getElementById('applyIndustryPricingBtn');
        if (industryPriceBtn) {
            industryPriceBtn.addEventListener('click', () => this.applyIndustryPricing());
        }

        // Add quick price entry button
        const quickPriceBtn = document.getElementById('quickPriceBtn');
        if (quickPriceBtn) {
            quickPriceBtn.addEventListener('click', () => this.openQuickPriceEntry());
        }

        if (scrapePdfBtn) {
            scrapePdfBtn.addEventListener('click', () => this.scrapePdfData());
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyScrapedData());
        }

        if (discardBtn) {
            discardBtn.addEventListener('click', () => this.discardScrapedData());
        }
    }

    // Scrape product data from URL
    async scrapeProductData() {
        const urlInput = document.getElementById('supplierUrl');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a product URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid URL');
            return;
        }

        this.showScrapeLoading(true);

        try {
            const response = await fetch('/api/scrape-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to scrape product data');
            }

            this.scrapedData = result.data;
            this.showScrapeResults(result.data);

        } catch (error) {
            console.error('Scraping error:', error);
            this.showError('Failed to extract product data: ' + error.message);
        } finally {
            this.showScrapeLoading(false);
        }
    }

    // Show loading state for scraping
    showScrapeLoading(isLoading) {
        const loadingDiv = document.getElementById('scrapeLoading');
        const btn = document.getElementById('scrapeUrlBtn');
        const progressBar = document.getElementById('scrapeProgress');

        if (isLoading) {
            loadingDiv.classList.remove('hidden');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Importing...';
            
            // Animate progress bar
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
            }, 200);
            
            this.progressInterval = interval;
        } else {
            loadingDiv.classList.add('hidden');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-download mr-2"></i>Import';
            
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 500);
            }
        }
    }

    // Show scraped results
    showScrapeResults(data) {
        const resultsDiv = document.getElementById('scrapeResults');
        const previewDiv = document.getElementById('scrapePreview');

        const preview = this.generatePreview(data);
        previewDiv.innerHTML = preview;
        resultsDiv.classList.remove('hidden');
    }

    // Generate preview HTML
    generatePreview(data) {
        let preview = '<div class="space-y-2">';
        
        if (data.name) {
            preview += `<div><strong>Name:</strong> ${data.name}</div>`;
        }
        
        if (data.sku) {
            preview += `<div><strong>SKU:</strong> ${data.sku}</div>`;
        }
        
        if (data.price > 0) {
            preview += `<div><strong>Price:</strong> $${data.price}</div>`;
        }
        
        if (data.description) {
            const shortDesc = data.description.length > 100 ? 
                data.description.substring(0, 100) + '...' : data.description;
            preview += `<div><strong>Description:</strong> ${shortDesc}</div>`;
        }
        
        if (data.images && data.images.length > 0) {
            preview += `<div><strong>Images:</strong> ${data.images.length} found</div>`;
        }
        
        if (data.colorVariants && data.colorVariants.length > 0) {
            const colorDisplay = data.colorVariants.map(variant => {
                let colorText = variant.name || variant.code;
                if (variant.hex) colorText += ` (${variant.hex})`;
                return colorText;
            }).join(', ');
            preview += `<div><strong>Color Variants:</strong> ${colorDisplay}</div>`;
        } else if (data.colors && data.colors.length > 0) {
            preview += `<div><strong>Colors:</strong> ${data.colors.join(', ')}</div>`;
        }
        
        if (data.documents && data.documents.length > 0) {
            preview += `<div><strong>Documents:</strong> ${data.documents.length} found</div>`;
            data.documents.forEach(doc => {
                preview += `<div class="ml-4 text-sm">• ${doc.type.toUpperCase()}: ${doc.name}</div>`;
            });
        }
        
        if (data.specifications && Object.keys(data.specifications).length > 0) {
            preview += `<div><strong>Specifications:</strong> ${Object.keys(data.specifications).length} found</div>`;
        }

        preview += '</div>';
        return preview;
    }

    // Apply scraped data to form
    async applyScrapedData() {
        if (!this.scrapedData) return;

        const data = this.scrapedData;

        // Apply basic information
        if (data.name) {
            document.getElementById('name').value = data.name;
        }

        if (data.sku) {
            document.getElementById('sku').value = data.sku;
        }

        // Pricing logic: scraped price goes to cost price, regular price is cost - 10% (discount)
        // Apply pricing (using new focused structure)
        if (data.cost_price > 0) {
            const costPriceField = document.getElementById('costPrice');
            if (costPriceField) costPriceField.value = data.cost_price;
        }
        
        if (data.price > 0) {
            document.getElementById('price').value = data.price;
        }

        // Apply descriptions (using focused structure)
        if (data.short_description) {
            document.getElementById('shortDescription').value = data.short_description;
        }
        
        if (data.long_description) {
            if (this.quillEditor) {
                this.quillEditor.root.innerHTML = `<p>${data.long_description}</p>`;
            }
        }

        // Apply brand and manufacturer
        if (data.brand) {
            const brandField = document.getElementById('brand');
            if (brandField) brandField.value = data.brand;
        }

        if (data.manufacturer) {
            const manufacturerField = document.getElementById('manufacturer');
            if (manufacturerField) manufacturerField.value = data.manufacturer;
        }

        if (data.model) {
            const modelField = document.getElementById('model');
            if (modelField) modelField.value = data.model;
        }

        if (data.warranty) {
            const warrantyField = document.getElementById('warrantyPeriod');
            if (warrantyField) warrantyField.value = data.warranty;
        }

        // Apply dimensions
        if (data.dimensions) {
            if (data.dimensions.length > 0) {
                const lengthField = document.getElementById('length');
                if (lengthField) lengthField.value = data.dimensions.length;
            }
            if (data.dimensions.width > 0) {
                const widthField = document.getElementById('width');
                if (widthField) widthField.value = data.dimensions.width;
            }
            if (data.dimensions.height > 0) {
                const heightField = document.getElementById('height');
                if (heightField) heightField.value = data.dimensions.height;
            }
        }

        // Apply weight
        if (data.weight > 0) {
            const weightField = document.getElementById('weight');
            if (weightField) weightField.value = data.weight;
        }

        // Set SEO fields
        if (data.name) {
            const seoTitleField = document.getElementById('seoTitle');
            if (seoTitleField) seoTitleField.value = data.name;
        }

        if (data.description) {
            const seoDescField = document.getElementById('seoDescription');
            if (seoDescField) seoDescField.value = data.description.substring(0, 160); // SEO limit
        }

        // Generate SEO keywords from name and specifications
        const keywords = [];
        if (data.name) {
            keywords.push(...data.name.split(' ').filter(word => word.length > 3));
        }
        if (data.brand) keywords.push(data.brand);
        if (data.category) keywords.push(data.category);
        
        if (keywords.length > 0) {
            const seoKeywordsField = document.getElementById('seoKeywords');
            if (seoKeywordsField) seoKeywordsField.value = keywords.slice(0, 8).join(', ');
        }

        // Apply specifications
        if (Object.keys(data.specifications).length > 0) {
            this.specifications = [];
            Object.entries(data.specifications).forEach(([key, value]) => {
                this.specifications.push({
                    id: Date.now() + Math.random(),
                    name: key,
                    value: value
                });
            });
            this.renderSpecifications();
        }

        // Apply enhanced color variants with SKU and pricing
        if (data.colorVariants && data.colorVariants.length > 0) {
            this.variations = [{
                id: Date.now(),
                name: 'Color',
                values: data.colorVariants.map(variant => ({
                    name: variant.name || variant.finish,
                    sku: variant.sku || '',
                    cost_price: variant.cost_price || 0,
                    price: variant.price || 0,
                    originalSku: variant.originalSku || '',
                    image: variant.image || null,
                    hex: variant.hex || '#CCCCCC'
                }))
            }];
            this.renderVariations();
            
            // Store color-to-image mapping for future use
            this.colorImageMapping = {};
            data.colorVariants.forEach(variant => {
                if (variant.image) {
                    this.colorImageMapping[variant.name || variant.code] = variant.image;
                }
            });
        } else if (data.colors.length > 0) {
            this.variations = [{
                id: Date.now(),
                name: 'Color',
                values: data.colors
            }];
            this.renderVariations();
        }

        // Apply documents as specifications and show them prominently
        if (data.documents && data.documents.length > 0) {
            console.log('Processing documents:', data.documents);
            
            // Add documents to specifications for storage
            data.documents.forEach(doc => {
                const specKey = `${doc.type.toUpperCase()} Document`;
                const specValue = `<a href="${doc.url}" target="_blank" class="text-blue-600 hover:underline">${doc.name}</a>`;
                this.specifications.push({
                    id: Date.now() + Math.random(),
                    name: specKey,
                    value: specValue
                });
            });
            
            // Store documents separately for potential future use
            this.productDocuments = data.documents;
            
            this.renderSpecifications();
            this.showSuccess(`Found and attached ${data.documents.length} downloadable documents!`);
        }

        // Handle images (using focused structure)
        if (data.main_image || data.gallery_images.length > 0) {
            try {
                // Set main image
                if (data.main_image) {
                    this.uploadedImages.main = data.main_image;
                    this.renderMainImagePreview(data.main_image);
                }

                // Set gallery images
                if (data.gallery_images.length > 0) {
                    this.uploadedImages.gallery = data.gallery_images;
                    this.renderGalleryPreview();
                }

                this.showSuccess('Product images imported successfully!');
            } catch (error) {
                console.warn('Some images could not be processed:', error);
            }
        }

        // Auto-select categories based on extracted data and auto-detected categories
        if (data.autoCategories && data.autoCategories.length > 0) {
            data.autoCategories.forEach(categoryId => {
                const checkbox = document.getElementById(`category_${categoryId}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            this.showSuccess(`Auto-selected ${data.autoCategories.length} relevant categories!`);
        }
        
        this.autoSelectCategories(data);

        // Hide results
        this.discardScrapedData();
        
        // Trigger slug generation
        const nameField = document.getElementById('name');
        if (nameField) {
            nameField.dispatchEvent(new Event('input'));
        }

        this.showSuccess('Product data imported successfully! Please review and adjust as needed.');
    }

    // Dynamic pricing scraper using browser automation
    async scrapeDynamicPricing() {
        const urlInput = document.getElementById('supplierUrl');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a product URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid URL');
            return;
        }

        this.showScrapeLoading(true);
        
        // Update loading message for dynamic scraping
        const loadingDiv = document.getElementById('scrapeLoading');
        const statusText = loadingDiv.querySelector('p');
        if (statusText) {
            statusText.textContent = 'Launching browser automation to capture dynamic prices...';
        }

        try {
            const response = await fetch('/api/scrape-product-dynamic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to scrape dynamic pricing');
            }

            this.scrapedData = result.data;
            this.showScrapeResults(result.data);
            this.showSuccess(result.message || 'Dynamic pricing extracted successfully!');

        } catch (error) {
            console.error('Dynamic scraping error:', error);
            this.showError('Failed to extract dynamic pricing: ' + error.message);
        } finally {
            this.showScrapeLoading(false);
        }
    }

    // Apply industry pricing patterns
    applyIndustryPricing() {
        if (this.variations.length === 0) {
            this.showError('Please scrape product data first to get color variations');
            return;
        }

        // Industry-standard pricing patterns for tapware finishes
        const industryPricing = {
            'chrome': 1.0,              // Base price
            'brushed chrome': 1.05,     // 5% premium
            'satin chrome': 1.05,       // 5% premium
            'matt black': 1.25,         // 25% premium
            'matte black': 1.25,        // 25% premium  
            'black': 1.20,              // 20% premium
            'gloss black': 1.25,        // 25% premium
            'brushed brass': 1.18,      // 18% premium
            'aged brass': 1.20,         // 20% premium
            'natural brass': 1.18,      // 18% premium
            'english brass': 1.30,      // 30% premium
            'brushed gold': 1.35,       // 35% premium
            'french gold': 1.40,        // 40% premium
            'champagne brass': 1.32,    // 32% premium
            'brushed platinum': 1.15,   // 15% premium
            'platinum': 1.15,           // 15% premium
            'brushed nickel': 1.10,     // 10% premium
            'nickel': 1.10,             // 10% premium
            'gun metal': 1.15,          // 15% premium
            'gunmetal': 1.15,           // 15% premium
            'iron bronze': 1.22,        // 22% premium
            'charcoal bronze': 1.25,    // 25% premium
            'dark bronze': 1.20,        // 20% premium
            'tuscan bronze': 1.22,      // 22% premium
            'burnished bronze': 1.28,   // 28% premium
            'ultra': 1.50               // 50% premium for ultra finishes
        };

        // Get base price from form
        const basePriceField = document.getElementById('price');
        const basePrice = parseFloat(basePriceField?.value) || 300;

        console.log('Applying industry pricing patterns to', this.variations.length, 'variations');
        console.log('Base price:', basePrice);

        // Update each variation with industry pricing
        this.variations.forEach((variation, variationIndex) => {
            variation.values.forEach((value, valueIndex) => {
                if (typeof value === 'object' && value.name) {
                    const finishName = value.name.toLowerCase().trim();
                    
                    // Find matching pricing multiplier
                    let multiplier = industryPricing[finishName];
                    
                    if (!multiplier) {
                        // Try partial matching
                        for (const [pattern, mult] of Object.entries(industryPricing)) {
                            if (finishName.includes(pattern)) {
                                multiplier = mult;
                                break;
                            }
                        }
                    }
                    
                    if (!multiplier) {
                        multiplier = 1.0; // Default to base price
                    }
                    
                    // Calculate new prices
                    const newCostPrice = Math.round(basePrice * multiplier * 100) / 100;
                    const newRegularPrice = Math.round(newCostPrice * 0.95 * 100) / 100; // 5% off
                    
                    // Update variation
                    value.cost_price = newCostPrice;
                    value.price = newRegularPrice;
                    
                    console.log(`Updated ${value.name}: Cost $${newCostPrice} (${multiplier}x) → Regular $${newRegularPrice}`);
                }
            });
        });

        // Re-render variations to show updated prices
        this.renderVariations();
        this.showSuccess(`Applied industry pricing patterns to ${this.variations.reduce((total, v) => total + v.values.length, 0)} variations`);
    }

    // Quick price entry modal
    openQuickPriceEntry() {
        if (this.variations.length === 0) {
            this.showError('Please scrape product data first to get color variations');
            return;
        }

        // Create modal HTML
        const modalHtml = `
            <div id="quickPriceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                    <h3 class="text-lg font-semibold mb-4">Quick Price Entry</h3>
                    <p class="text-sm text-gray-600 mb-4">Enter the exact prices you see when clicking each color on the supplier site:</p>
                    
                    <div class="space-y-3 mb-4">
                        ${this.variations[0].values.map((value, index) => `
                            <div class="flex items-center gap-3">
                                <div class="w-4 h-4 rounded border" style="background-color: ${value.hex || '#ccc'}"></div>
                                <label class="flex-1 text-sm">${value.name}</label>
                                <input type="number" 
                                       id="quickPrice_${index}" 
                                       placeholder="$308"
                                       value="${value.cost_price || ''}"
                                       step="0.01"
                                       class="w-24 px-2 py-1 border rounded text-sm">
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="flex gap-3">
                        <button id="applyQuickPrices" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Apply Prices
                        </button>
                        <button id="cancelQuickPrices" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listeners
        document.getElementById('applyQuickPrices').addEventListener('click', () => this.applyQuickPrices());
        document.getElementById('cancelQuickPrices').addEventListener('click', () => this.closeQuickPriceModal());
        
        // Focus first input
        document.getElementById('quickPrice_0')?.focus();
    }

    // Apply quick prices
    applyQuickPrices() {
        this.variations[0].values.forEach((value, index) => {
            const priceInput = document.getElementById(`quickPrice_${index}`);
            if (priceInput && priceInput.value) {
                const costPrice = parseFloat(priceInput.value);
                if (costPrice > 0) {
                    value.cost_price = costPrice;
                    value.price = Math.round(costPrice * 0.95 * 100) / 100; // 5% off
                    console.log(`Updated ${value.name}: Cost $${costPrice} → Regular $${value.price}`);
                }
            }
        });

        this.closeQuickPriceModal();
        this.renderVariations();
        this.showSuccess('Prices updated successfully!');
    }

    // Close quick price modal
    closeQuickPriceModal() {
        const modal = document.getElementById('quickPriceModal');
        if (modal) {
            modal.remove();
        }
    }

    // Scrape PDF data
    async scrapePdfData() {
        const urlInput = document.getElementById('supplierUrl');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a PDF URL');
            return;
        }

        if (!url.toLowerCase().includes('.pdf')) {
            this.showError('Please enter a valid PDF URL');
            return;
        }

        this.showScrapeLoading(true);

        try {
            const response = await fetch('/api/scrape-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to scrape PDF data');
            }

            this.scrapedData = result.data;
            this.showScrapeResults(result.data);

        } catch (error) {
            console.error('PDF scraping error:', error);
            this.showError('Failed to extract PDF data: ' + error.message);
        } finally {
            this.showScrapeLoading(false);
        }
    }

    // Discard scraped data
    discardScrapedData() {
        this.scrapedData = null;
        document.getElementById('scrapeResults').classList.add('hidden');
        document.getElementById('supplierUrl').value = '';
    }

    // Auto-select categories based on scraped data
    autoSelectCategories(data) {
        const categoryMappings = {
            // Glass Fencing
            'glass': ['1'], // Glass Fencing
            'pool fence': ['1', '2'], // Glass Fencing > Glass Pool Fencing
            'pool fencing': ['1', '2'],
            'balustrade': ['1', '14'], // Glass Fencing > Glass Balustrades
            'spigot': ['1', '2'], // Pool fencing hardware
            'hinge': ['1', '2'],
            'gate': ['1', '2'],
            
            // Aluminium Solutions - Specific Product Names
            'aluminium': ['57'], // Aluminium Solutions
            'aluminum': ['57'],
            
            // Specific Pool Fencing Products
            'vista': ['57', '58', '165'], // Vista Aluminium Pool Fence
            'ray pool': ['57', '58', '166'], // Ray Pool Fencing
            'ray fencing': ['57', '58', '166'],
            'batten pool': ['57', '58', '167'], // Batten Pool Fencing
            'batten fencing': ['57', '58', '167'],
            'arc': ['57', '58', '168'], // Arc Aluminium Pool Fence
            
            // Specific Balustrade Products
            'blade': ['57', '68', '169'], // Blade Aluminium Balustrade
            'ray balustrade': ['57', '68', '170'], // Ray Aluminium Balustrade
            'ray aluminium': ['57', '68', '170'],
            'view': ['57', '68', '171'], // View Aluminium Balustrade
            'skye': ['57', '68', '172'], // Skye Aluminium Balustrade
            
            // Bathroom & Tapware
            'basin': ['30', '31', '32'], // Bathrooms > Tapware > Basin Mixers
            'mixer': ['30', '31', '32'], 
            'bathroom': ['30'],
            'shower': ['30', '31', '33', '76'], // Could be shower mixers or shower screens
            'bath': ['30', '31', '34'], // Bath mixers
            'laundry tap': ['30', '31', '35'], // Laundry taps
            'wall mixer': ['30', '31', '36'], // Wall mixers
            'kitchen mixer': ['30', '31', '37'], // Kitchen mixers
            'sink': ['30', '38'], // Sinks & Basins
            'kitchen sink': ['30', '38', '40'], // Kitchen sinks specifically
            'laundry sink': ['30', '38', '41'], // Laundry sinks
            'toilet': ['30', '42'], // Bathroom accessories
            'vanity': ['30', '38', '39'], // Bathroom basins
            
            // Shower Screens
            'shower screen': ['76'], // Shower Screens
            'frameless': ['76', '77'], // Frameless shower screens
            'semi-frameless': ['76', '78'], // Semi-frameless shower screens
            'shower glass': ['76', '80'], // Shower screen glass
            
            // Flooring & Tiles - Room-Based Categories
            'floor': ['43'], // Flooring
            'flooring': ['43'],
            'tile': ['43', '50'], // Flooring > Tiles
            'tiles': ['43', '50'],
            'bathroom tile': ['43', '50', '173'], // Bathroom Tiles
            'kitchen tile': ['43', '50', '174'], // Kitchen / Laundry Tiles
            'laundry tile': ['43', '50', '174'],
            'splashback': ['43', '50', '175'], // Splashback / Feature Tiles
            'feature tile': ['43', '50', '175'],
            'living tile': ['43', '50', '176'], // Living Tiles
            'outdoor tile': ['43', '50', '177'], // Outdoor Tiles
            'pool tile': ['43', '50', '178'], // Pool Tiles
            
            // Composite & Decking - Specific Brands
            'milboard': ['43', '44', '179'], // Milboard Decking
            'milboard decking': ['43', '44', '179'],
            'milboard edging': ['43', '44', '180', '181'], // Flexible Square & Bullnose Edging
            'flexible square': ['43', '44', '180'], // Milboard Flexible Square Edging
            'bullnose': ['43', '44', '181'], // Milboard Bullnose Edging
            'fascia board': ['43', '44', '182'], // Milboard Fascia Board
            'weathered': ['43', '44', '183'], // Milboard Weathered Decking
            'woodevo': ['43', '44', '184'], // Woodevo HomeAdvanced Decking
            'homeadvanced': ['43', '44', '184'],
            
            // Cladding - Specific Products
            'cladding': ['72'], // Claddings main category
            'envello': ['72', '73', '185', '186'], // Milboard Envello products
            'shadowline': ['72', '73', '185'], // Milboard Envello Shadowline
            'board batten': ['72', '73', '186'], // Milboard Envello Board & Batten
            'castellated': ['72', '73', '187'], // Woodevo Castellated Cladding
            'screening': ['22', '72', '73'], // Composite screening
            
            // Generic categories
            'pool': ['1', '2', '57', '58'], // Could be glass or aluminium pool fencing
            'fence': ['1', '57'], // Could be glass or aluminium fencing
            'fencing': ['1', '57'],
            'tap': ['30', '31'], // Generic taps go to tapware
            'faucet': ['30', '31'],
            'hardware': ['79'], // Shower screen hardware
        };
        
        const selectedCategoryIds = new Set();
        
        // Check product name and description for category keywords
        const searchText = `${data.name} ${data.description} ${data.category}`.toLowerCase();
        
        for (const [keyword, categoryIds] of Object.entries(categoryMappings)) {
            if (searchText.includes(keyword)) {
                categoryIds.forEach(id => selectedCategoryIds.add(id));
            }
        }
        
        // Check URL for category hints
        if (data.sourceUrl) {
            const url = data.sourceUrl.toLowerCase();
            for (const [keyword, categoryIds] of Object.entries(categoryMappings)) {
                if (url.includes(keyword)) {
                    categoryIds.forEach(id => selectedCategoryIds.add(id));
                }
            }
        }
        
        // Auto-select the matched categories
        selectedCategoryIds.forEach(categoryId => {
            const checkbox = document.getElementById(`category_${categoryId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        if (selectedCategoryIds.size > 0) {
            console.log('Auto-selected categories:', Array.from(selectedCategoryIds));
            this.showSuccess(`Auto-selected ${selectedCategoryIds.size} relevant categories!`);
        }
    }

    // Setup category search functionality
    setupCategorySearch() {
        const searchInput = document.getElementById('categorySearch');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Debounce search to avoid excessive filtering
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterCategories(searchTerm);
            }, 300);
        });

        // Clear search on Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.renderCategories(); // Show all categories
                searchInput.blur();
            }
        });
    }

    // Filter categories based on search term
    filterCategories(searchTerm) {
        if (!searchTerm) {
            this.renderCategories(); // Show all categories
            return;
        }

        const filteredCategories = this.categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm) ||
            category.slug.toLowerCase().includes(searchTerm)
        );

        // Also include parent categories if a child matches
        const extendedCategories = [...filteredCategories];
        filteredCategories.forEach(category => {
            if (category.parent_id) {
                const parent = this.categories.find(c => c.id === category.parent_id);
                if (parent && !extendedCategories.find(c => c.id === parent.id)) {
                    extendedCategories.push(parent);
                }
            }
        });

        // Sort by relevance (exact matches first, then contains)
        extendedCategories.sort((a, b) => {
            const aExact = a.name.toLowerCase() === searchTerm;
            const bExact = b.name.toLowerCase() === searchTerm;
            const aStarts = a.name.toLowerCase().startsWith(searchTerm);
            const bStarts = b.name.toLowerCase().startsWith(searchTerm);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            return a.name.localeCompare(b.name);
        });

        this.renderCategories(extendedCategories);

        // Highlight search term
        this.highlightSearchTerm(searchTerm);
    }

    // Highlight search term in category names
    highlightSearchTerm(searchTerm) {
        const container = document.getElementById('categoriesContainer');
        if (!container || !searchTerm) return;

        const labels = container.querySelectorAll('label');
        labels.forEach(label => {
            const text = label.textContent;
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            const highlightedText = text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
            label.innerHTML = label.innerHTML.replace(text, highlightedText);
        });
    }

    // Setup AI enhancement functionality
    setupAiEnhancement() {
        const shortDescBtn = document.getElementById('enhanceShortDescBtn');
        const longDescBtn = document.getElementById('enhanceLongDescBtn');
        const modal = document.getElementById('aiEnhanceModal');
        const closeBtn = document.getElementById('closeAiModal');
        const cancelBtn = document.getElementById('cancelAiBtn');
        const generateBtn = document.getElementById('generateAiBtn');
        const applyBtn = document.getElementById('applyAiBtn');

        // Track which field we're enhancing
        this.currentDescriptionField = null;
        this.currentEnhancementType = 'enhance';

        if (shortDescBtn) {
            shortDescBtn.addEventListener('click', () => this.openAiModal('short'));
        }

        if (longDescBtn) {
            longDescBtn.addEventListener('click', () => this.openAiModal('long'));
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAiModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeAiModal());
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateAiEnhancement());
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyAiEnhancement());
        }

        // Setup enhancement type selection
        document.querySelectorAll('.ai-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ai-option-btn').forEach(b => b.classList.remove('active', 'bg-purple-100', 'border-purple-500'));
                e.target.classList.add('active', 'bg-purple-100', 'border-purple-500');
                this.currentEnhancementType = e.target.dataset.type;
            });
        });
    }

    // Open AI enhancement modal
    openAiModal(fieldType) {
        this.currentDescriptionField = fieldType;
        const modal = document.getElementById('aiEnhanceModal');
        const originalDescDiv = document.getElementById('originalDesc');
        const enhancedDescDiv = document.getElementById('enhancedDesc');
        const applyBtn = document.getElementById('applyAiBtn');

        // Get current description
        let currentText = '';
        if (fieldType === 'short') {
            currentText = document.getElementById('shortDescription').value;
        } else {
            currentText = this.quillEditor ? this.quillEditor.getText().trim() : '';
        }

        if (!currentText) {
            this.showError('Please enter a description first');
            return;
        }

        // Show original text
        originalDescDiv.textContent = currentText;
        enhancedDescDiv.textContent = 'Click "Generate" to enhance your description';
        applyBtn.disabled = true;

        // Show modal
        modal.classList.remove('hidden');
    }

    // Close AI enhancement modal
    closeAiModal() {
        const modal = document.getElementById('aiEnhanceModal');
        modal.classList.add('hidden');
        this.currentDescriptionField = null;
    }

    // Generate AI enhancement
    async generateAiEnhancement() {
        const originalText = document.getElementById('originalDesc').textContent;
        const enhancedDescDiv = document.getElementById('enhancedDesc');
        const generateBtn = document.getElementById('generateAiBtn');
        const applyBtn = document.getElementById('applyAiBtn');

        if (!originalText) {
            this.showError('No text to enhance');
            return;
        }

        // Show loading
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
        enhancedDescDiv.innerHTML = '<div class="flex items-center"><i class="fas fa-spinner fa-spin mr-2"></i>AI is enhancing your description...</div>';

        try {
            const productName = document.getElementById('name').value;
            const response = await fetch('/api/enhance-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: originalText,
                    type: this.currentEnhancementType,
                    productName: productName,
                    productCategory: this.getSelectedCategories().join(', ')
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to enhance description');
            }

            // Show enhanced text
            enhancedDescDiv.textContent = result.data.enhanced;
            applyBtn.disabled = false;

        } catch (error) {
            console.error('AI enhancement error:', error);
            enhancedDescDiv.textContent = 'Failed to enhance description: ' + error.message;
            this.showError('AI enhancement failed: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Enhancement';
        }
    }

    // Apply AI enhancement to form
    applyAiEnhancement() {
        const enhancedText = document.getElementById('enhancedDesc').textContent;
        
        if (!enhancedText || enhancedText.includes('Click "Generate"') || enhancedText.includes('Failed')) {
            this.showError('No valid enhancement to apply');
            return;
        }

        // Apply to the correct field
        if (this.currentDescriptionField === 'short') {
            document.getElementById('shortDescription').value = enhancedText;
        } else {
            if (this.quillEditor) {
                this.quillEditor.root.innerHTML = `<p>${enhancedText}</p>`;
            }
        }

        this.closeAiModal();
        this.showSuccess('AI enhancement applied successfully!');
    }

    // Get selected categories for context
    getSelectedCategories() {
        const selectedCategories = [];
        document.querySelectorAll('input[name="categories"]:checked').forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                selectedCategories.push(label.textContent.trim());
            }
        });
        return selectedCategories;
    }

    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.addProductManager = new AddProductManager();
});