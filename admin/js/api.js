// API Client for Admin Dashboard
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('adminToken');
    }

    // Set auth token with expiration
    setToken(token, expirationHours = 1) {
        this.token = token;
        if (token) {
            const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000); // 1 hour in milliseconds
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminTokenExpiration', expirationTime.toString());
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminTokenExpiration');
        }
    }

    // Check if token is expired
    isTokenExpired() {
        const expiration = localStorage.getItem('adminTokenExpiration');
        if (!expiration) {
            return true; // No expiration stored, consider expired
        }
        return Date.now() > parseInt(expiration);
    }

    // Get valid token (returns null if expired)
    getValidToken() {
        if (this.isTokenExpired()) {
            this.clearExpiredToken();
            return null;
        }
        return this.token;
    }

    // Clear expired token
    clearExpiredToken() {
        this.token = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiration');
    }

    // Get auth headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const validToken = this.getValidToken();
        if (validToken) {
            headers['Authorization'] = `Bearer ${validToken}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const response = await this.request('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success && response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async getCurrentUser() {
        return await this.request('/users/me');
    }

    async logout() {
        this.setToken(null);
        return { success: true };
    }

    // Dashboard methods
    async getDashboardStats() {
        const response = await this.request('/admin/stats');
        return response.data;
    }

    async getRecentOrders(limit = 5) {
        const response = await this.request(`/admin/orders/recent?limit=${limit}`);
        return response.data;
    }

    // Product methods
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        const response = await this.request(endpoint);
        return response.data;
    }

    async getProduct(id) {
        const response = await this.request(`/products/${id}`);
        return response.data;
    }

    async createProduct(productData) {
        return await this.request('/admin/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Category methods
    async getCategories() {
        const response = await this.request('/categories');
        return response.data;
    }

    // Order methods
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/orders?${queryString}` : '/orders';
        const response = await this.request(endpoint);
        return response.data;
    }

    async updateOrderStatus(orderId, status) {
        return await this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Newsletter methods
    async getNewsletterSubscriptions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/newsletter/subscriptions?${queryString}` : '/newsletter/subscriptions';
        const response = await this.request(endpoint);
        return response.data;
    }

    // Upload methods
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Don't set Content-Type for FormData, let browser set it
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}/upload`, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    }
}

// Create global API instance
window.API = new APIClient();