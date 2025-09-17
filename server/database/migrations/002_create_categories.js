exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.text('description');
    table.string('image_url');
    table.string('banner_image_url');
    table.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.integer('sort_order').defaultTo(0);
    table.json('metadata').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_featured').defaultTo(false);
    table.string('seo_title');
    table.text('seo_description');
    table.json('seo_keywords').defaultTo('[]');
    table.timestamps(true, true);
    
    // Indexes
    table.index('slug');
    table.index('parent_id');
    table.index('is_active');
    table.index('is_featured');
    table.index('sort_order');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};