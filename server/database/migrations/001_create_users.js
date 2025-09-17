exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone');
    table.enum('role', ['customer', 'admin']).defaultTo('customer');
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.timestamp('email_verified_at');
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.json('preferences').defaultTo('{}');
    table.timestamp('last_login_at');
    table.string('last_login_ip');
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('role');
    table.index('status');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};