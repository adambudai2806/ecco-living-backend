exports.up = function(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
    table.string('product_sku').notNullable();
    table.string('product_name').notNullable();
    table.text('product_description');
    table.json('product_image').defaultTo('{}');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.json('product_variations').defaultTo('{}');
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index('order_id');
    table.index('product_id');
    table.index('product_sku');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items');
};