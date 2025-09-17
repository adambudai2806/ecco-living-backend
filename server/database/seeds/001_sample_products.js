exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('product_categories').del();
  await knex('products').del();
  await knex('categories').del();

  // Insert categories first
  const categories = await knex('categories').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Glass Solutions',
      slug: 'glass-solutions',
      description: 'Premium glass products for modern homes',
      status: 'active',
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Tapware',
      slug: 'tapware',
      description: 'Luxury tapware and bathroom fixtures',
      status: 'active',
      sort_order: 2,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Pool Fencing',
      slug: 'pool-fencing',
      description: 'Australian law-compliant pool safety solutions',
      status: 'active',
      sort_order: 3,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('*');

  // Insert sample products
  const products = await knex('products').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      sku: 'FREE-SAMPLE-001',
      name: 'Free Sample - Premium Glass Cleaner',
      slug: 'free-sample-glass-cleaner',
      short_description: 'Professional-grade glass cleaner sample - perfect for testing our premium products',
      long_description: '<p>Get a free sample of our professional-grade glass cleaner used by professionals across Australia. This sample is perfect for testing the quality of our products before making larger purchases.</p><p><strong>Features:</strong></p><ul><li>Streak-free formula</li><li>Safe for all glass surfaces</li><li>Professional strength</li><li>Australian-made</li></ul>',
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
      dimensions: JSON.stringify({ length: 5, width: 5, height: 10 }),
      shipping_class: 'sample',
      is_virtual: false,
      is_downloadable: false,
      status: 'published',
      is_featured: true,
      sort_order: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1583947582982-0bd9d2c19d81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ]),
      attributes: JSON.stringify({}),
      variations: JSON.stringify([]),
      related_products: JSON.stringify([]),
      tags: JSON.stringify(['free', 'sample', 'glass-cleaner', 'test']),
      brand: 'Ecco Living',
      manufacturer: 'Ecco Living Pty Ltd',
      model: 'EL-GC-SAMPLE',
      installation_notes: null,
      maintenance_notes: 'Use as directed on label',
      specifications: JSON.stringify({
        'Volume': '50ml',
        'Type': 'Liquid',
        'Formulation': 'Streak-free',
        'Country of Origin': 'Australia',
        'Suitable For': 'All glass surfaces'
      }),
      warranty_period: null,
      warranty_details: null,
      seo_title: 'Free Glass Cleaner Sample | Ecco Living',
      seo_description: 'Get a free sample of our professional-grade glass cleaner. Perfect for testing before larger purchases. Australian-made, streak-free formula.',
      seo_keywords: JSON.stringify(['free sample', 'glass cleaner', 'professional', 'australian made', 'streak free']),
      view_count: 0,
      average_rating: 0,
      review_count: 0,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      sku: 'TAP-BASIN-001',
      name: 'Premium Basin Mixer - Chrome',
      slug: 'premium-basin-mixer-chrome',
      short_description: 'Elegant chrome basin mixer with modern design and superior functionality',
      long_description: '<p>Transform your bathroom with this premium chrome basin mixer featuring contemporary design and exceptional build quality.</p><p><strong>Features:</strong></p><ul><li>Solid brass construction</li><li>Chrome plated finish</li><li>Ceramic disc cartridge</li><li>WELS 4-star rating</li><li>Australian Standards approved</li></ul>',
      price: 189.00,
      sale_price: 149.00,
      cost_price: 95.00,
      currency: 'AUD',
      stock_quantity: 25,
      low_stock_threshold: 5,
      manage_stock: true,
      in_stock: true,
      stock_status: 'in_stock',
      weight: 1.2,
      dimensions: JSON.stringify({ length: 15, width: 10, height: 20 }),
      shipping_class: 'standard',
      is_virtual: false,
      is_downloadable: false,
      status: 'published',
      is_featured: true,
      sort_order: 2,
      images: JSON.stringify(['https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ]),
      attributes: JSON.stringify({}),
      variations: JSON.stringify([
        {
          name: 'Finish',
          values: ['Chrome', 'Brushed Nickel', 'Matte Black']
        }
      ]),
      related_products: JSON.stringify([]),
      tags: JSON.stringify(['tapware', 'basin-mixer', 'chrome', 'bathroom']),
      brand: 'Ecco Living',
      manufacturer: 'Premium Tapware Co.',
      model: 'EL-BM-CHR-001',
      installation_notes: 'Professional installation recommended. Ensure water pressure is adequate.',
      maintenance_notes: 'Clean regularly with mild soap solution. Avoid abrasive cleaners.',
      specifications: JSON.stringify({
        'Material': 'Solid Brass',
        'Finish': 'Chrome Plated',
        'Cartridge': 'Ceramic Disc',
        'WELS Rating': '4 Star',
        'Flow Rate': '7.5L/min',
        'Thread Size': '1/2" BSP',
        'Warranty': '10 Years'
      }),
      warranty_period: '10 years',
      warranty_details: '10-year manufacturer warranty on cartridge and finish',
      seo_title: 'Premium Chrome Basin Mixer | Ecco Living Tapware',
      seo_description: 'Premium chrome basin mixer with solid brass construction, ceramic disc cartridge, and WELS 4-star rating. Perfect for modern bathrooms.',
      seo_keywords: JSON.stringify(['basin mixer', 'chrome tapware', 'bathroom tap', 'premium tapware', 'WELS rated']),
      view_count: 0,
      average_rating: 0,
      review_count: 0,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('*');

  // Associate products with categories
  const glassCategory = categories.find(c => c.slug === 'glass-solutions');
  const tapwareCategory = categories.find(c => c.slug === 'tapware');
  
  if (glassCategory && tapwareCategory) {
    await knex('product_categories').insert([
      {
        product_id: products[0].id,
        category_id: glassCategory.id
      },
      {
        product_id: products[1].id,
        category_id: tapwareCategory.id
      }
    ]);
  }
};