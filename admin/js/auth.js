// Authentication handler for admin dashboard
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check for existing session on load
        this.restoreSession();
    }

    // Restore session from localStorage
    restoreSession() {
        const token = localStorage.getItem('adminToken');
        const userData = localStorage.getItem('adminUser');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                return true;
            } catch (error) {
                console.error('Failed to restore session:', error);
                this.clearAuth();
            }
        }
        return false;
    }

    // Check if user is authenticated
    isAuth() {
        const token = localStorage.getItem('adminToken');
        return !!token && (this.isAuthenticated || this.restoreSession());
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            this.restoreSession();
        }
        return this.currentUser;
    }

    // Set current user and persist to localStorage
    setCurrentUser(user, token) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Persist to localStorage - remember for 30 days
        if (token) {
            localStorage.setItem('adminToken', token);
        }
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        // Set expiration to 30 days from now
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        localStorage.setItem('adminTokenExpiry', expirationDate.getTime().toString());
    }

    // Clear authentication
    clearAuth() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminTokenExpiry');
    }

    // Check if user has admin role
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    // Check if token is expired
    isTokenExpired() {
        const expiry = localStorage.getItem('adminTokenExpiry');
        if (!expiry) return true;
        
        return new Date().getTime() > parseInt(expiry);
    }
}

window.AuthManager = new AuthManager();