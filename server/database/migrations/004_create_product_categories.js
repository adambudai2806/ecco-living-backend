exports.up = function(knex) {
  return knex.schema.createTable('product_categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('categories').onDelete('CASCADE');
    table.boolean('is_primary').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index('product_id');
    table.index('category_id');
    table.unique(['product_id', 'category_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_categories');
};