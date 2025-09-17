exports.up = function(knex) {
  return knex.schema.createTable('newsletter_subscriptions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('first_name');
    table.string('last_name');
    table.enum('status', ['active', 'unsubscribed', 'bounced']).defaultTo('active');
    table.json('preferences').defaultTo('{}');
    table.string('source'); // Where they signed up from
    table.string('unsubscribe_token').unique();
    table.timestamp('subscribed_at').defaultTo(knex.fn.now());
    table.timestamp('unsubscribed_at');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('status');
    table.index('subscribed_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('newsletter_subscriptions');
};