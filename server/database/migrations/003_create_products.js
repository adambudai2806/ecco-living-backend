exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('sku').unique().notNullable();
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.text('short_description');
    table.text('long_description');
    table.decimal('price', 10, 2).notNullable();
    table.decimal('sale_price', 10, 2);
    table.decimal('cost_price', 10, 2);
    table.string('currency').defaultTo('AUD');
    table.integer('stock_quantity').defaultTo(0);
    table.integer('low_stock_threshold').defaultTo(10);
    table.boolean('manage_stock').defaultTo(true);
    table.boolean('in_stock').defaultTo(true);
    table.enum('stock_status', ['in_stock', 'out_of_stock', 'on_backorder']).defaultTo('in_stock');
    table.decimal('weight', 8, 2);
    table.json('dimensions').defaultTo('{}'); // {length, width, height}
    table.string('shipping_class');
    table.boolean('is_virtual').defaultTo(false);
    table.boolean('is_downloadable').defaultTo(false);
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.boolean('is_featured').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.json('images').defaultTo('[]'); // Array of image URLs
    table.json('gallery').defaultTo('[]'); // Array of gallery image URLs
    table.json('attributes').defaultTo('{}'); // Custom attributes
    table.json('variations').defaultTo('[]'); // Product variations
    table.json('related_products').defaultTo('[]'); // Related product IDs
    table.json('tags').defaultTo('[]'); // Product tags
    table.string('brand');
    table.string('manufacturer');
    table.string('model');
    table.text('installation_notes');
    table.text('maintenance_notes');
    table.json('specifications').defaultTo('{}'); // Technical specifications
    table.string('warranty_period');
    table.text('warranty_details');
    table.string('seo_title');
    table.text('seo_description');
    table.json('seo_keywords').defaultTo('[]');
    table.integer('view_count').defaultTo(0);
    table.decimal('average_rating', 2, 1).defaultTo(0);
    table.integer('review_count').defaultTo(0);
    table.timestamp('published_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index('sku');
    table.index('slug');
    table.index('status');
    table.index('is_featured');
    table.index('stock_status');
    table.index('price');
    table.index('published_at');
    table.index('created_at');
    table.index('average_rating');
    table.index('view_count');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};