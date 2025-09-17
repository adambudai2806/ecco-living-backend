const BaseModel = require('./BaseModel');
const { cache } = require('../config/redis');

class Product extends BaseModel {
    constructor() {
        super('products');
    }

    // Create product with slug generation
    async create(productData) {
        try {
            // Generate slug if not provided
            if (!productData.slug && productData.name) {
                productData.slug = this.generateSlug(productData.name);
            }

            // Set published_at if status is published
            if (productData.status === 'published' && !productData.published_at) {
                productData.published_at = new Date();
            }

            const product = await super.create(productData);
            
            // Clear cache
            await this.clearProductCache();
            
            return product;
        } catch (error) {
            throw error;
        }
    }

    // Update product
    async updateById(id, productData) {
        try {
            // Update published_at if status is changed to published
            if (productData.status === 'published') {
                const existingProduct = await this.findById(id);
                if (existingProduct && !existingProduct.published_at) {
                    productData.published_at = new Date();
                }
            }

            const product = await super.updateById(id, productData);
            
            // Clear cache
            await this.clearProductCache();
            
            return product;
        } catch (error) {
            throw error;
        }
    }

    // Generate URL-friendly slug
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Find product by slug
    async findBySlug(slug) {
        try {
            // Check cache first
            const cacheKey = `product:slug:${slug}`;
            const cachedProduct = await cache.get(cacheKey);
            
            if (cachedProduct) {
                return cachedProduct;
            }

            const product = await this.findOneBy({ slug, status: 'published' });
            
            if (product) {
                // Cache for 1 hour
                await cache.set(cacheKey, product, 3600);
            }

            return product;
        } catch (error) {
            throw error;
        }
    }

    // Find product by SKU
    async findBySku(sku) {
        return await this.findOneBy({ sku });
    }

    // Get products with categories
    async getProductsWithCategories(options = {}) {
        try {
            const {
                page = 1,
                perPage = 20,
                categoryId,
                search,
                minPrice,
                maxPrice,
                inStock,
                featured,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            let query = this.query()
                .select(
                    'products.*',
                    this.db.raw('COALESCE(json_agg(DISTINCT categories.*) FILTER (WHERE categories.id IS NOT NULL), \'[]\') as categories')
                )
                .leftJoin('product_categories', 'products.id', 'product_categories.product_id')
                .leftJoin('categories', 'product_categories.category_id', 'categories.id')
                .where('products.status', 'published')
                .groupBy('products.id');

            // Apply filters
            if (categoryId) {
                query = query.havingRaw('? = ANY(array_agg(categories.id))', [categoryId]);
            }

            if (search) {
                query = query.where(function() {
                    this.where('products.name', 'ilike', `%${search}%`)
                        .orWhere('products.short_description', 'ilike', `%${search}%`)
                        .orWhere('products.long_description', 'ilike', `%${search}%`);
                });
            }

            if (minPrice) {
                query = query.where('products.price', '>=', minPrice);
            }

            if (maxPrice) {
                query = query.where('products.price', '<=', maxPrice);
            }

            if (inStock === true) {
                query = query.where('products.stock_status', 'in_stock');
            }

            if (featured === true) {
                query = query.where('products.is_featured', true);
            }

            // Apply sorting
            query = query.orderBy(`products.${sortBy}`, sortOrder);

            // Apply pagination
            const offset = (page - 1) * perPage;
            query = query.limit(perPage).offset(offset);

            // Get total count for pagination
            let countQuery = this.query()
                .leftJoin('product_categories', 'products.id', 'product_categories.product_id')
                .leftJoin('categories', 'product_categories.category_id', 'categories.id')
                .where('products.status', 'published');

            if (categoryId) {
                countQuery = countQuery.where('categories.id', categoryId);
            }

            if (search) {
                countQuery = countQuery.where(function() {
                    this.where('products.name', 'ilike', `%${search}%`)
                        .orWhere('products.short_description', 'ilike', `%${search}%`)
                        .orWhere('products.long_description', 'ilike', `%${search}%`);
                });
            }

            if (minPrice) {
                countQuery = countQuery.where('products.price', '>=', minPrice);
            }

            if (maxPrice) {
                countQuery = countQuery.where('products.price', '<=', maxPrice);
            }

            if (inStock === true) {
                countQuery = countQuery.where('products.stock_status', 'in_stock');
            }

            if (featured === true) {
                countQuery = countQuery.where('products.is_featured', true);
            }

            const [products, totalResult] = await Promise.all([
                query,
                countQuery.countDistinct('products.id as count').first()
            ]);

            const total = parseInt(totalResult.count, 10);

            return {
                data: products,
                pagination: {
                    page,
                    perPage,
                    total,
                    totalPages: Math.ceil(total / perPage),
                    hasNext: page < Math.ceil(total / perPage),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Get featured products
    async getFeaturedProducts(limit = 8) {
        try {
            const cacheKey = `products:featured:${limit}`;
            const cachedProducts = await cache.get(cacheKey);
            
            if (cachedProducts) {
                return cachedProducts;
            }

            const products = await this.findAll({
                where: { 
                    status: 'published', 
                    is_featured: true 
                },
                orderBy: { column: 'sort_order', direction: 'asc' },
                limit
            });

            // Cache for 30 minutes
            await cache.set(cacheKey, products, 1800);
            
            return products;
        } catch (error) {
            throw error;
        }
    }

    // Get related products
    async getRelatedProducts(productId, limit = 4) {
        try {
            const product = await this.findById(productId);
            if (!product) {
                return [];
            }

            // If product has specified related products, use those
            if (product.related_products && product.related_products.length > 0) {
                return await this.query()
                    .whereIn('id', product.related_products)
                    .where('status', 'published')
                    .limit(limit);
            }

            // Otherwise, find products from the same categories
            const relatedProducts = await this.db
                .select('products.*')
                .from('products')
                .join('product_categories as pc1', 'products.id', 'pc1.product_id')
                .join('product_categories as pc2', 'pc1.category_id', 'pc2.category_id')
                .where('pc2.product_id', productId)
                .where('products.id', '!=', productId)
                .where('products.status', 'published')
                .groupBy('products.id')
                .orderBy('products.average_rating', 'desc')
                .limit(limit);

            return relatedProducts;
        } catch (error) {
            throw error;
        }
    }

    // Update stock quantity
    async updateStock(productId, quantity) {
        try {
            const product = await this.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const newQuantity = product.stock_quantity + quantity;
            const stockStatus = newQuantity <= 0 ? 'out_of_stock' : 
                              newQuantity <= product.low_stock_threshold ? 'low_stock' : 'in_stock';

            return await this.updateById(productId, {
                stock_quantity: newQuantity,
                stock_status: stockStatus,
                in_stock: newQuantity > 0
            });
        } catch (error) {
            throw error;
        }
    }

    // Reserve stock (for orders)
    async reserveStock(productId, quantity) {
        try {
            const product = await this.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            if (!product.manage_stock) {
                return true; // No stock management
            }

            if (product.stock_quantity < quantity) {
                throw new Error('Insufficient stock');
            }

            await this.updateStock(productId, -quantity);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Release reserved stock
    async releaseStock(productId, quantity) {
        try {
            await this.updateStock(productId, quantity);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Update product rating
    async updateRating(productId) {
        try {
            const result = await this.db('product_reviews')
                .where('product_id', productId)
                .where('status', 'approved')
                .avg('rating as average_rating')
                .count('* as review_count')
                .first();

            const averageRating = parseFloat(result.average_rating) || 0;
            const reviewCount = parseInt(result.review_count) || 0;

            await this.updateById(productId, {
                average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                review_count: reviewCount
            });

            return { averageRating, reviewCount };
        } catch (error) {
            throw error;
        }
    }

    // Increment view count
    async incrementViewCount(productId) {
        try {
            await this.query()
                .where('id', productId)
                .increment('view_count', 1);
        } catch (error) {
            // Don't throw error for view count updates
            console.error('Failed to increment view count:', error);
        }
    }

    // Clear product cache
    async clearProductCache() {
        try {
            await cache.deletePattern('product:*');
            await cache.deletePattern('products:*');
        } catch (error) {
            console.error('Failed to clear product cache:', error);
        }
    }

    // Search products
    async searchProducts(query, options = {}) {
        try {
            const { page = 1, perPage = 20 } = options;

            const searchResults = await this.db
                .select('products.*')
                .from('products')
                .where('products.status', 'published')
                .where(function() {
                    this.where('name', 'ilike', `%${query}%`)
                        .orWhere('short_description', 'ilike', `%${query}%`)
                        .orWhere('long_description', 'ilike', `%${query}%`)
                        .orWhere('sku', 'ilike', `%${query}%`);
                })
                .orderBy('name')
                .paginate(page, perPage);

            return searchResults;
        } catch (error) {
            throw error;
        }
    }

    // Get low stock products
    async getLowStockProducts() {
        try {
            return await this.query()
                .where('manage_stock', true)
                .where('status', 'published')
                .whereRaw('stock_quantity <= low_stock_threshold')
                .orderBy('stock_quantity', 'asc');
        } catch (error) {
            throw error;
        }
    }

    // Get product statistics
    async getStatistics() {
        try {
            const stats = await this.db
                .select(
                    this.db.raw('COUNT(*) as total_products'),
                    this.db.raw('COUNT(*) FILTER (WHERE status = \'published\') as published_products'),
                    this.db.raw('COUNT(*) FILTER (WHERE status = \'draft\') as draft_products'),
                    this.db.raw('COUNT(*) FILTER (WHERE is_featured = true AND status = \'published\') as featured_products'),
                    this.db.raw('COUNT(*) FILTER (WHERE stock_status = \'out_of_stock\') as out_of_stock_products'),
                    this.db.raw('COUNT(*) FILTER (WHERE manage_stock = true AND stock_quantity <= low_stock_threshold) as low_stock_products'),
                    this.db.raw('AVG(price) as average_price'),
                    this.db.raw('AVG(average_rating) FILTER (WHERE average_rating > 0) as average_rating')
                )
                .from('products')
                .first();

            return {
                totalProducts: parseInt(stats.total_products),
                publishedProducts: parseInt(stats.published_products),
                draftProducts: parseInt(stats.draft_products),
                featuredProducts: parseInt(stats.featured_products),
                outOfStockProducts: parseInt(stats.out_of_stock_products),
                lowStockProducts: parseInt(stats.low_stock_products),
                averagePrice: parseFloat(stats.average_price) || 0,
                averageRating: parseFloat(stats.average_rating) || 0
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new Product();