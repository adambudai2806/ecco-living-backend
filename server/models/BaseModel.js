const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = getDatabase();
    }

    // Get database query builder for the table
    query() {
        return this.db(this.tableName);
    }

    // Find by ID
    async findById(id) {
        try {
            const record = await this.query().where('id', id).first();
            return record || null;
        } catch (error) {
            logger.error(`Error finding ${this.tableName} by ID ${id}:`, error);
            throw error;
        }
    }

    // Find by multiple criteria
    async findBy(criteria) {
        try {
            return await this.query().where(criteria);
        } catch (error) {
            logger.error(`Error finding ${this.tableName} by criteria:`, error);
            throw error;
        }
    }

    // Find one by criteria
    async findOneBy(criteria) {
        try {
            const record = await this.query().where(criteria).first();
            return record || null;
        } catch (error) {
            logger.error(`Error finding one ${this.tableName} by criteria:`, error);
            throw error;
        }
    }

    // Get all records with optional pagination
    async findAll(options = {}) {
        try {
            let query = this.query();

            // Apply filters
            if (options.where) {
                query = query.where(options.where);
            }

            // Apply ordering
            if (options.orderBy) {
                if (Array.isArray(options.orderBy)) {
                    options.orderBy.forEach(order => {
                        query = query.orderBy(order.column, order.direction || 'asc');
                    });
                } else {
                    query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
                }
            }

            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.offset(options.offset);
            }

            return await query;
        } catch (error) {
            logger.error(`Error finding all ${this.tableName}:`, error);
            throw error;
        }
    }

    // Create new record
    async create(data) {
        try {
            // Add UUID if not provided
            if (!data.id) {
                data.id = uuidv4();
            }

            // Add timestamps
            const now = new Date();
            data.created_at = now;
            data.updated_at = now;

            const [record] = await this.query().insert(data).returning('*');
            return record;
        } catch (error) {
            logger.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    // Update record by ID
    async updateById(id, data) {
        try {
            // Add updated timestamp
            data.updated_at = new Date();

            const [record] = await this.query()
                .where('id', id)
                .update(data)
                .returning('*');

            return record || null;
        } catch (error) {
            logger.error(`Error updating ${this.tableName} by ID ${id}:`, error);
            throw error;
        }
    }

    // Update records by criteria
    async updateBy(criteria, data) {
        try {
            // Add updated timestamp
            data.updated_at = new Date();

            return await this.query()
                .where(criteria)
                .update(data)
                .returning('*');
        } catch (error) {
            logger.error(`Error updating ${this.tableName} by criteria:`, error);
            throw error;
        }
    }

    // Delete record by ID
    async deleteById(id) {
        try {
            const deletedCount = await this.query().where('id', id).del();
            return deletedCount > 0;
        } catch (error) {
            logger.error(`Error deleting ${this.tableName} by ID ${id}:`, error);
            throw error;
        }
    }

    // Delete records by criteria
    async deleteBy(criteria) {
        try {
            return await this.query().where(criteria).del();
        } catch (error) {
            logger.error(`Error deleting ${this.tableName} by criteria:`, error);
            throw error;
        }
    }

    // Count records
    async count(criteria = {}) {
        try {
            const result = await this.query()
                .where(criteria)
                .count('* as count')
                .first();
            
            return parseInt(result.count, 10);
        } catch (error) {
            logger.error(`Error counting ${this.tableName}:`, error);
            throw error;
        }
    }

    // Check if record exists
    async exists(criteria) {
        try {
            const count = await this.count(criteria);
            return count > 0;
        } catch (error) {
            logger.error(`Error checking if ${this.tableName} exists:`, error);
            throw error;
        }
    }

    // Paginate results
    async paginate(page = 1, perPage = 20, options = {}) {
        try {
            const offset = (page - 1) * perPage;
            
            // Get total count
            const totalCount = await this.count(options.where || {});
            
            // Get records
            const records = await this.findAll({
                ...options,
                limit: perPage,
                offset
            });

            return {
                data: records,
                pagination: {
                    page,
                    perPage,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / perPage),
                    hasNext: page < Math.ceil(totalCount / perPage),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            logger.error(`Error paginating ${this.tableName}:`, error);
            throw error;
        }
    }

    // Bulk insert
    async bulkInsert(records) {
        try {
            // Add UUIDs and timestamps to all records
            const now = new Date();
            const processedRecords = records.map(record => ({
                ...record,
                id: record.id || uuidv4(),
                created_at: now,
                updated_at: now
            }));

            return await this.query().insert(processedRecords).returning('*');
        } catch (error) {
            logger.error(`Error bulk inserting ${this.tableName}:`, error);
            throw error;
        }
    }

    // Transaction helper
    async transaction(callback) {
        const trx = await this.db.transaction();
        try {
            const result = await callback(trx);
            await trx.commit();
            return result;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    // Raw query execution
    async raw(query, bindings = []) {
        try {
            return await this.db.raw(query, bindings);
        } catch (error) {
            logger.error(`Error executing raw query on ${this.tableName}:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;