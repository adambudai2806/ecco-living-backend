exports.up = function(knex) {
  return knex.schema.createTable('coupons', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['percentage', 'fixed_amount', 'free_shipping']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.decimal('minimum_amount', 10, 2);
    table.decimal('maximum_amount', 10, 2);
    table.integer('usage_limit');
    table.integer('usage_limit_per_customer');
    table.integer('used_count').defaultTo(0);
    table.json('applicable_categories').defaultTo('[]');
    table.json('applicable_products').defaultTo('[]');
    table.json('excluded_categories').defaultTo('[]');
    table.json('excluded_products').defaultTo('[]');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('valid_from');
    table.timestamp('valid_until');
    table.timestamps(true, true);
    
    // Indexes
    table.index('code');
    table.index('is_active');
    table.index('valid_from');
    table.index('valid_until');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupons');
};