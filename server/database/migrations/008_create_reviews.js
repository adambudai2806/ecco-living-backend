exports.up = function(knex) {
  return knex.schema.createTable('product_reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('order_id').references('id').inTable('orders').onDelete('SET NULL');
    table.string('reviewer_name').notNullable();
    table.string('reviewer_email').notNullable();
    table.integer('rating').notNullable(); // 1-5 stars
    table.string('title');
    table.text('comment');
    table.json('images').defaultTo('[]'); // Review images
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.boolean('is_verified_purchase').defaultTo(false);
    table.integer('helpful_count').defaultTo(0);
    table.integer('not_helpful_count').defaultTo(0);
    table.string('ip_address');
    table.timestamps(true, true);
    
    // Indexes
    table.index('product_id');
    table.index('user_id');
    table.index('status');
    table.index('rating');
    table.index('is_verified_purchase');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_reviews');
};