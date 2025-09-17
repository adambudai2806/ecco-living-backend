// Quick script to create database tables for Neon PostgreSQL
require('dotenv').config();
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 }
});

async function createTables() {
    try {
        console.log('🔗 Connecting to Neon PostgreSQL...');
        
        // Test connection
        await db.raw('SELECT 1');
        console.log('✅ Connected successfully');
        
        // Create products table
        console.log('📦 Creating products table...');
        await db.schema.createTable('products', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('slug').unique().notNullable();
            table.string('sku').unique().notNullable();
            table.string('original_sku');
            table.text('short_description');
            table.text('long_description');
            table.string('brand');
            table.string('manufacturer');
            table.decimal('price', 10, 2).defaultTo(0);
            table.decimal('cost_price', 10, 2).defaultTo(0);
            table.decimal('sale_price', 10, 2);
            table.json('specifications');
            table.json('images');
            table.json('colors');
            table.json('color_variants');
            table.json('documents');
            table.json('categories');
            table.string('category');
            table.string('subcategory');
            table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
            table.boolean('in_stock').defaultTo(true);
            table.integer('stock_quantity').defaultTo(0);
            table.decimal('weight', 8, 2);
            table.json('dimensions');
            table.string('meta_title');
            table.text('meta_description');
            table.json('tags');
            table.timestamps(true, true);
        });
        console.log('✅ Products table created');
        
        // Create categories table
        console.log('📂 Creating categories table...');
        await db.schema.createTable('categories', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('slug').unique().notNullable();
            table.text('description');
            table.integer('parent_id').references('id').inTable('categories');
            table.string('category_group');
            table.integer('sort_order').defaultTo(0);
            table.boolean('active').defaultTo(true);
            table.timestamps(true, true);
        });
        console.log('✅ Categories table created');
        
        // Create users table for admin authentication
        console.log('👤 Creating users table...');
        await db.schema.createTable('users', (table) => {
            table.increments('id').primary();
            table.string('email').unique().notNullable();
            table.string('password').notNullable();
            table.string('first_name');
            table.string('last_name');
            table.enum('role', ['admin', 'user']).defaultTo('user');
            table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
            table.timestamp('last_login_at');
            table.timestamps(true, true);
        });
        console.log('✅ Users table created');
        
        // Create product_categories junction table
        console.log('🔗 Creating product_categories table...');
        await db.schema.createTable('product_categories', (table) => {
            table.increments('id').primary();
            table.integer('product_id').references('id').inTable('products').onDelete('CASCADE');
            table.integer('category_id').references('id').inTable('categories').onDelete('CASCADE');
            table.timestamps(true, true);
            table.unique(['product_id', 'category_id']);
        });
        console.log('✅ Product categories junction table created');
        
        console.log('🎉 All tables created successfully!');
        console.log('📝 You can now save products to your Neon PostgreSQL database');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    } finally {
        await db.destroy();
        console.log('🔚 Database connection closed');
    }
}

createTables();