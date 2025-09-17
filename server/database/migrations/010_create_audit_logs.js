exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable(); // CREATE, UPDATE, DELETE
    table.string('table_name').notNullable();
    table.string('record_id').notNullable();
    table.json('old_values').defaultTo('{}');
    table.json('new_values').defaultTo('{}');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('table_name');
    table.index('record_id');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};