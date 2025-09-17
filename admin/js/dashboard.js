// Dashboard management for admin panel
class DashboardManager {
    constructor() {
        this.charts = {};
        this.chartsInitialized = false;
    }

    // Load dashboard data
    async loadDashboard() {
        try {
            const [stats, recentOrders] = await Promise.all([
                API.getDashboardStats(),
                API.getRecentOrders(5)
            ]);

            // Store stats globally for charts
            window.currentStats = stats;
            
            this.updateStats(stats);
            this.updateRecentOrders(recentOrders);
            this.initCharts(stats);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    // Update dashboard statistics
    updateStats(stats) {
        const elements = {
            totalOrders: stats.totalOrders || 0,
            totalRevenue: `$${(stats.totalRevenue || 0).toFixed(2)}`,
            totalProducts: stats.totalProducts || 0,
            totalCustomers: stats.totalCustomers || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update additional stats
        const productsChange = document.getElementById('productsChange');
        if (productsChange) {
            productsChange.textContent = `${stats.publishedProducts || 0} published`;
        }
    }

    // Update recent orders table
    updateRecentOrders(orders) {
        const tbody = document.getElementById('recentOrders');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No recent orders</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-medium text-gray-900">#${order.order_number}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-gray-900">${order.customer_name || 'Guest'}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(order.status)}">
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

    // Get status badge CSS class
    getStatusClass(status) {
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

    // Initialize dashboard charts (no charts for now)
    initCharts(stats) {
        console.log('DashboardManager.initCharts called - no charts to initialize');
        this.chartsInitialized = true;
    }



    // Show error message
    showError(message) {
        console.error(message);
        // Could integrate with notification system here
    }
}

window.DashboardManager = new DashboardManager();