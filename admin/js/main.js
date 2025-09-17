// Main Admin Application
class AdminApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.isAuthenticated = false;
        this.tokenCheckInterval = null;
        
        this.init();
    }

    async init() {
        // Check if user is already logged in
        if (window.AuthManager && window.AuthManager.isAuth()) {
            const user = window.AuthManager.getCurrentUser();
            if (user && user.role === 'admin') {
                this.handleSuccessfulLogin(user, localStorage.getItem('adminToken'));
                return;
            }
        }

        this.showLoginModal();
        this.bindEvents();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Sidebar navigation - initial binding
        this.bindNavigationEvents();

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', this.closeSidebar.bind(this));
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                profileDropdown.classList.toggle('hidden');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#profileBtn') && profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.closeSidebar();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');
        
        // Reset error state
        loginError.classList.add('hidden');
        loginError.textContent = '';
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In...';
        
        try {
            const response = await API.login(email, password);
            
            if (response.user.role !== 'admin') {
                throw new Error('Access denied. Admin privileges required.');
            }
            
            this.handleSuccessfulLogin(response.user, response.token);
            
        } catch (error) {
            console.error('Login failed:', error);
            loginError.textContent = error.message || 'Login failed. Please try again.';
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }

    handleSuccessfulLogin(user, token) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Store user and token in AuthManager (30 days)
        if (window.AuthManager) {
            window.AuthManager.setCurrentUser(user, token);
        }
        
        // Update UI
        document.getElementById('userDisplayName').textContent = `${user.first_name} ${user.last_name}`;
        
        // Hide login modal and show dashboard
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Load dashboard data
        this.loadDashboardData();
        
        // Start periodic authentication check
        this.startAuthCheck();
        
        // Re-bind navigation events after login
        this.bindNavigationEvents();
        
        this.showNotification('Welcome back! You will stay logged in for 30 days.', 'success');
    }

    handleLogout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Clear stored data using AuthManager
        if (window.AuthManager) {
            window.AuthManager.clearAuth();
        }
        
        // Show login modal
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        
        // Reset form
        document.getElementById('loginForm').reset();
        
        this.showNotification('Logged out successfully', 'info');
    }

    // Check authentication status periodically
    startAuthCheck() {
        // Check every 5 minutes if user is still authenticated
        this.authCheckInterval = setInterval(() => {
            if (window.AuthManager && !window.AuthManager.isAuth()) {
                this.handleAutoLogout();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    // Stop auth check
    stopAuthCheck() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }

    // Handle automatic logout when session is invalid
    handleAutoLogout() {
        console.log('Session invalid, logging out...');
        this.stopAuthCheck();
        
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Show login modal
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        
        // Reset form
        document.getElementById('loginForm').reset();
        
        this.showNotification('Session expired. Please log in again.', 'warning');
    }

    // Bind navigation events
    bindNavigationEvents() {
        console.log('Binding navigation events...');
        document.querySelectorAll('.sidebar-link').forEach((link, index) => {
            // Remove existing event listeners by cloning the node
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add event listener
            newLink.addEventListener('click', this.handleNavigation.bind(this));
            console.log(`Bound navigation event for: ${newLink.dataset.section} (index: ${index})`);
        });
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const section = link.dataset.section;
        
        console.log('Navigating to section:', section);
        
        if (section === this.currentSection) {
            return;
        }
        
        // Update active link
        document.querySelectorAll('.sidebar-link').forEach(l => {
            l.classList.remove('sidebar-active');
        });
        link.classList.add('sidebar-active');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.add('hidden');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('fade-in');
        }
        
        this.currentSection = section;
        
        // Load section-specific data
        this.loadSectionData(section);
        
        // Close mobile sidebar
        this.closeSidebar();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar.classList.contains('-translate-x-full')) {
            // Show sidebar
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            // Hide sidebar
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }

    async loadDashboardData() {
        if (this.currentSection !== 'dashboard') {
            return;
        }

        try {
            // Use DashboardManager for loading dashboard data
            if (window.DashboardManager) {
                await window.DashboardManager.loadDashboard();
            }

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalRevenue').textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('totalCustomers').textContent = stats.totalCustomers || 0;

        // Update change percentages (mock data for now)
        document.getElementById('ordersChange').textContent = '0%';
        document.getElementById('revenueChange').textContent = '0%';
        document.getElementById('productsChange').textContent = `${stats.publishedProducts || 0} published`;
        document.getElementById('customersChange').textContent = '0%';
    }

    updateRecentOrders(orders) {
        const tbody = document.getElementById('recentOrders');
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No recent orders</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr class="table-row">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-medium text-gray-900">#${order.order_number}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-gray-900">${order.customer_name || 'Guest'}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeClass(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                    $${order.total_amount.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">
                    ${new Date(order.created_at).toLocaleDateString()}
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'shipped': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
            'refunded': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    initializeCharts(stats) {
        // Use DashboardManager for charts instead of duplicating here
        if (window.DashboardManager) {
            window.DashboardManager.initCharts(stats);
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'products':
                if (window.ProductsManager) {
                    await window.ProductsManager.loadProducts();
                }
                break;
            case 'orders':
                // Load orders data
                break;
            case 'customers':
                // Load customers data
                break;
            case 'analytics':
                // Load analytics data
                break;
            default:
                if (section === 'dashboard') {
                    await this.loadDashboardData();
                }
                break;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-4 max-w-sm`;
        
        const iconClasses = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };

        const icon = iconClasses[type] || iconClasses.info;

        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="${icon}"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-gray-900">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        const container = document.getElementById('notifications');
        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('en-AU');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AdminApp = new AdminApp();
});