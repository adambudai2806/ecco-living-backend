exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('order_number').unique().notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('guest_email'); // For guest checkouts
    table.enum('status', [
      'pending',
      'processing', 
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'failed'
    ]).defaultTo('pending');
    table.string('currency').defaultTo('AUD');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('shipping_amount', 10, 2).defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    
    // Billing Address
    table.json('billing_address').notNullable();
    
    // Shipping Address
    table.json('shipping_address');
    table.string('shipping_method');
    table.decimal('shipping_cost', 10, 2).defaultTo(0);
    
    // Payment Information
    table.string('payment_method');
    table.string('payment_status').defaultTo('pending');
    table.string('payment_transaction_id');
    table.json('payment_details').defaultTo('{}');
    table.timestamp('payment_date');
    
    // Order Notes and Metadata
    table.text('order_notes');
    table.text('customer_notes');
    table.json('metadata').defaultTo('{}');
    
    // Tracking Information
    table.string('tracking_number');
    table.string('tracking_url');
    table.timestamp('shipped_at');
    table.timestamp('delivered_at');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index('order_number');
    table.index('user_id');
    table.index('guest_email');
    table.index('status');
    table.index('payment_status');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};