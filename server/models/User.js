const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    // Create user with hashed password
    async create(userData) {
        try {
            // Hash password
            if (userData.password) {
                userData.password_hash = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
                delete userData.password; // Remove plain password
            }

            return await super.create(userData);
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    async findByEmail(email) {
        return await this.findOneBy({ email: email.toLowerCase() });
    }

    // Verify password
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Authenticate user
    async authenticate(email, password) {
        try {
            const user = await this.findByEmail(email);
            if (!user) {
                return null;
            }

            const isValidPassword = await this.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return null;
            }

            // Update last login
            await this.updateById(user.id, {
                last_login_at: new Date()
            });

            // Remove password hash from returned user
            delete user.password_hash;
            return user;
        } catch (error) {
            throw error;
        }
    }

    // Generate JWT token
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
    }

    // Generate refresh token
    generateRefreshToken(user) {
        const payload = {
            id: user.id,
            type: 'refresh'
        };

        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
        });
    }

    // Verify token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    // Update password
    async updatePassword(userId, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
            return await this.updateById(userId, {
                password_hash: hashedPassword,
                password_reset_token: null,
                password_reset_expires: null
            });
        } catch (error) {
            throw error;
        }
    }

    // Generate password reset token
    async generatePasswordResetToken(email) {
        try {
            const user = await this.findByEmail(email);
            if (!user) {
                return null;
            }

            const resetToken = uuidv4();
            const resetExpires = new Date();
            resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

            await this.updateById(user.id, {
                password_reset_token: resetToken,
                password_reset_expires: resetExpires
            });

            return resetToken;
        } catch (error) {
            throw error;
        }
    }

    // Verify password reset token
    async verifyPasswordResetToken(token) {
        try {
            const user = await this.findOneBy({
                password_reset_token: token
            });

            if (!user) {
                return null;
            }

            // Check if token is expired
            if (new Date() > new Date(user.password_reset_expires)) {
                return null;
            }

            return user;
        } catch (error) {
            throw error;
        }
    }

    // Generate email verification token
    async generateEmailVerificationToken(userId) {
        try {
            const verificationToken = uuidv4();
            await this.updateById(userId, {
                email_verification_token: verificationToken
            });

            return verificationToken;
        } catch (error) {
            throw error;
        }
    }

    // Verify email
    async verifyEmail(token) {
        try {
            const user = await this.findOneBy({
                email_verification_token: token
            });

            if (!user) {
                return null;
            }

            await this.updateById(user.id, {
                email_verified_at: new Date(),
                email_verification_token: null
            });

            return user;
        } catch (error) {
            throw error;
        }
    }

    // Get user profile (without sensitive data)
    async getProfile(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                return null;
            }

            // Remove sensitive fields
            delete user.password_hash;
            delete user.password_reset_token;
            delete user.password_reset_expires;
            delete user.email_verification_token;

            return user;
        } catch (error) {
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userId, profileData) {
        try {
            // Don't allow updating sensitive fields through profile update
            const allowedFields = [
                'first_name',
                'last_name',
                'phone',
                'preferences'
            ];

            const updateData = {};
            allowedFields.forEach(field => {
                if (profileData[field] !== undefined) {
                    updateData[field] = profileData[field];
                }
            });

            return await this.updateById(userId, updateData);
        } catch (error) {
            throw error;
        }
    }

    // Check if user is admin
    isAdmin(user) {
        return user && user.role === 'admin';
    }

    // Get users with pagination and filters
    async getUsers(options = {}) {
        try {
            const {
                page = 1,
                perPage = 20,
                search,
                role,
                status,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            const queryOptions = {
                orderBy: { column: sortBy, direction: sortOrder }
            };

            // Build where clause
            let whereClause = {};

            if (role) {
                whereClause.role = role;
            }

            if (status) {
                whereClause.status = status;
            }

            queryOptions.where = whereClause;

            // Handle search
            if (search) {
                const users = await this.query()
                    .where(whereClause)
                    .where(function() {
                        this.where('first_name', 'ilike', `%${search}%`)
                            .orWhere('last_name', 'ilike', `%${search}%`)
                            .orWhere('email', 'ilike', `%${search}%`);
                    })
                    .orderBy(sortBy, sortOrder)
                    .paginate(page, perPage);

                // Remove sensitive data
                users.data = users.data.map(user => {
                    delete user.password_hash;
                    delete user.password_reset_token;
                    delete user.password_reset_expires;
                    delete user.email_verification_token;
                    return user;
                });

                return users;
            } else {
                const result = await this.paginate(page, perPage, queryOptions);
                
                // Remove sensitive data
                result.data = result.data.map(user => {
                    delete user.password_hash;
                    delete user.password_reset_token;
                    delete user.password_reset_expires;
                    delete user.email_verification_token;
                    return user;
                });

                return result;
            }
        } catch (error) {
            throw error;
        }
    }

    // Activate/Deactivate user
    async setUserStatus(userId, status) {
        try {
            return await this.updateById(userId, { status });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new User();