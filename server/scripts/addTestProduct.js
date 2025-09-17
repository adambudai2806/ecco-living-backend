// Add a free test product for shop integration testing
const Product = require('../models/Product');

const testProduct = {
    sku: 'FREE-SAMPLE-001',
    name: 'Free Sample - Premium Glass Cleaner',
    slug: 'free-sample-glass-cleaner',
    short_description: 'Professional-grade glass cleaner sample - perfect for testing our shop integration',
    long_description: '<p>Get a free sample of our professional-grade glass cleaner used by professionals across Australia. This sample is perfect for testing the quality of our products and shop functionality.</p><p><strong>Features:</strong></p><ul><li>Streak-free formula</li><li>Safe for all glass surfaces</li><li>Professional strength</li><li>Australian-made</li></ul><p><strong>Perfect for testing:</strong></p><ul><li>Add to cart functionality</li><li>Checkout process</li><li>Order management</li><li>Email notifications</li></ul>',
    price: 0.00,
    sale_price: null,
    cost_price: 2.50,
    currency: 'AUD',
    stock_quantity: 100,
    low_stock_threshold: 10,
    manage_stock: true,
    in_stock: true,
    stock_status: 'in_stock',
    weight: 0.05,
    dimensions: { length: 5, width: 5, height: 10 },
    shipping_class: 'sample',
    is_virtual: false,
    is_downloadable: false,
    status: 'published',
    is_featured: true,
    sort_order: 1,
    images: ['https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    gallery: [
        'https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    attributes: {},
    variations: [
        {
            name: 'Size',
            values: ['50ml Sample', '100ml Travel Size']
        }
    ],
    related_products: [],
    tags: ['free', 'sample', 'glass-cleaner', 'test', 'shop-testing'],
    brand: 'Ecco Living',
    manufacturer: 'Ecco Living Pty Ltd',
    model: 'EL-GC-SAMPLE',
    installation_notes: null,
    maintenance_notes: 'Use as directed on label. Perfect for testing purposes.',
    specifications: {
        'Volume': '50ml',
        'Type': 'Liquid',
        'Formulation': 'Streak-free',
        'Country of Origin': 'Australia',
        'Suitable For': 'All glass surfaces',
        'Purpose': 'Shop Integration Testing'
    },
    warranty_period: null,
    warranty_details: null,
    seo_title: 'Free Glass Cleaner Sample - Test Product | Ecco Living',
    seo_description: 'Get a free sample of our professional-grade glass cleaner. Perfect for testing shop functionality before larger purchases. Australian-made, streak-free formula.',
    seo_keywords: ['free sample', 'glass cleaner', 'professional', 'australian made', 'streak free', 'test product'],
    view_count: 0,
    average_rating: 5.0,
    review_count: 12,
    published_at: new Date()
};

async function addTestProduct() {
    try {
        console.log('Adding free test product...');
        
        // Check if product already exists
        const existing = await Product.findBySku(testProduct.sku);
        if (existing) {
            console.log('Test product already exists, updating...');
            const updated = await Product.updateById(existing.id, testProduct);
            console.log('Test product updated successfully:', updated.name);
            return updated;
        }

        const product = await Product.create(testProduct);
        console.log('Free test product created successfully!');
        console.log('Product Name:', product.name);
        console.log('SKU:', product.sku);
        console.log('Price: $', product.price);
        console.log('Status:', product.status);
        console.log('URL Slug:', product.slug);
        
        return product;
    } catch (error) {
        console.error('Error adding test product:', error);
        throw error;
    }
}

module.exports = { addTestProduct, testProduct };

// Run directly if called from command line
if (require.main === module) {
    addTestProduct()
        .then(() => {
            console.log('\n✅ Free test product added successfully!');
            console.log('You can now test your shop integration with a free product.');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Failed to add test product:', error);
            process.exit(1);
        });
}