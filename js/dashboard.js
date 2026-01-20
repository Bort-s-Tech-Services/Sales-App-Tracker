import { supabase, formatCurrency, formatDate } from './supabase.js';
import { logout } from './auth.js';

// Global variables
let salesChart, profitChart;
let allSales = [];
let currentPeriod = 'today';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    updateUserInfo(user);
    
    // Setup event listeners
    setupEventListeners();
    
    // Update date display
    updateCurrentDate();
    
    // Show loading state
    showLoading(true);
    
    // Load data
    await loadSalesData(user.id);
    
    // Initialize charts
    initializeCharts();
    
    // Update dashboard
    updateDashboard();
    
    // Hide loading
    showLoading(false);
});

// Update user info in sidebar
function updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    
    if (userName) {
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        userName.textContent = name;
    }
    
    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Period selector
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            updateDashboard();
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add sale button
    const addSaleBtn = document.getElementById('addSaleBtn');
    if (addSaleBtn) {
        addSaleBtn.addEventListener('click', () => {
            window.location.href = 'sales.html';
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshSales');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                showLoading(true);
                await loadSalesData(user.id);
                updateDashboard();
                showLoading(false);
                showNotification('Data refreshed successfully', 'success');
            }
        });
    }
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
    
    // Close sidebar when nav item is clicked on mobile
    const navItems = document.querySelectorAll('.sidebar-nav a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });
    
    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.getElementById('sidebarToggle');
        if (sidebar && toggle && window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Update current date display
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Load sales data from Supabase
async function loadSalesData(userId) {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        allSales = data || [];
        
    } catch (error) {
        console.error('Error loading sales data:', error);
        showNotification('Failed to load sales data', 'error');
        allSales = [];
    }
}

// Update dashboard with current data
function updateDashboard() {
    const filteredSales = filterSalesByPeriod(allSales, currentPeriod);
    const stats = calculateStatistics(filteredSales, allSales);
    
    updateStats(stats);
    updateSalesTable(filteredSales.slice(0, 10));
    updateCharts();
}

// Filter sales by selected period
function filterSalesByPeriod(sales, period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'today':
            return sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate >= today;
            });
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            return sales.filter(s => new Date(s.date) >= weekStart);
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return sales.filter(s => new Date(s.date) >= monthStart);
        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return sales.filter(s => new Date(s.date) >= yearStart);
        default:
            return sales;
    }
}

// Calculate statistics
function calculateStatistics(filteredSales, allSales) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const todaySales = allSales.filter(s => s.date === today);
    const yesterdaySales = allSales.filter(s => s.date === yesterdayStr);
    
    // Today's revenue and change
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.revenue, 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.revenue, 0);
    const todayChange = yesterdayRevenue > 0 ? 
        ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;
    
    // Weekly profit
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekSales = allSales.filter(s => new Date(s.date) >= weekStart);
    const weeklyProfit = weekSales.reduce((sum, s) => sum + s.profit, 0);
    
    // Monthly sales
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthSales = allSales.filter(s => new Date(s.date) >= monthStart);
    const monthlySales = monthSales.reduce((sum, s) => sum + s.revenue, 0);
    
    // Yearly growth
    const currentYear = new Date().getFullYear();
    const currentYearSales = allSales.filter(s => 
        new Date(s.date).getFullYear() === currentYear
    );
    const lastYearSales = allSales.filter(s => 
        new Date(s.date).getFullYear() === currentYear - 1
    );
    
    const currentYearRevenue = currentYearSales.reduce((sum, s) => sum + s.revenue, 0);
    const lastYearRevenue = lastYearSales.reduce((sum, s) => sum + s.revenue, 0);
    const yearlyGrowth = lastYearRevenue > 0 ? 
        ((currentYearRevenue - lastYearRevenue) / lastYearRevenue * 100).toFixed(1) : 
        currentYearRevenue > 0 ? 100 : 0;
    
    return {
        todayRevenue,
        todayChange,
        weeklyProfit,
        monthlySales,
        yearlyGrowth,
        totalTransactions: allSales.length,
        recentSales: filteredSales.slice(0, 10)
    };
}

// Update statistics display
function updateStats(stats) {
    // Today's Revenue
    const todayRevenueEl = document.getElementById('todayRevenue');
    const todayChangeEl = document.getElementById('todayChange');
    if (todayRevenueEl) todayRevenueEl.textContent = formatCurrency(stats.todayRevenue);
    if (todayChangeEl) {
        const isPositive = stats.todayChange >= 0;
        todayChangeEl.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.abs(stats.todayChange)}% ${isPositive ? 'increase' : 'decrease'}
        `;
        todayChangeEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
    }
    
    // Weekly Profit
    const weeklyProfitEl = document.getElementById('weeklyProfit');
    if (weeklyProfitEl) weeklyProfitEl.textContent = formatCurrency(stats.weeklyProfit);
    
    // Monthly Sales
    const monthlySalesEl = document.getElementById('monthlySales');
    if (monthlySalesEl) monthlySalesEl.textContent = formatCurrency(stats.monthlySales);
    
    // Yearly Growth
    const yearlyGrowthEl = document.getElementById('yearlyGrowth');
    if (yearlyGrowthEl) yearlyGrowthEl.textContent = `${stats.yearlyGrowth}%`;
}

// Update sales table
function updateSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    if (sales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No sales data available</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td>${formatDate(sale.date)}</td>
            <td><strong>${sale.product_name}</strong></td>
            <td>${sale.quantity}</td>
            <td>${formatCurrency(sale.revenue)}</td>
            <td>${formatCurrency(sale.cost)}</td>
            <td class="${sale.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatCurrency(sale.profit)}
            </td>
            <td>${sale.revenue > 0 ? ((sale.profit / sale.revenue) * 100).toFixed(1) : 0}%</td>
        </tr>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    const salesCtx = document.getElementById('salesChart')?.getContext('2d');
    const profitCtx = document.getElementById('profitChart')?.getContext('2d');
    
    if (!salesCtx || !profitCtx) return;
    
    // Sales trend chart
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `₵${context.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => `₵${value}` }
                }
            }
        }
    });
    
    // Profit distribution chart
    profitChart = new Chart(profitCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4361ee', '#4cc9f0', '#3a0ca3', '#7209b7',
                    '#f72585', '#4ade80', '#f59e0b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
    
    updateCharts();
}

// Update charts with data
function updateCharts() {
    if (!salesChart || !profitChart) return;
    
    // Update sales trend (last 30 days)
    const salesData = getSalesDataLastNDays(30);
    salesChart.data.labels = salesData.labels;
    salesChart.data.datasets[0].data = salesData.values;
    salesChart.update();
    
    // Update profit distribution by category
    const profitData = getProfitByCategory();
    profitChart.data.labels = profitData.labels;
    profitChart.data.datasets[0].data = profitData.values;
    profitChart.update();
}

// Get sales data for last N days
function getSalesDataLastNDays(days) {
    const salesByDay = {};
    const today = new Date();
    
    // Initialize last N days
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesByDay[dateStr] = 0;
    }
    
    // Fill with actual data
    allSales.forEach(sale => {
        if (sale.date in salesByDay) {
            salesByDay[sale.date] += sale.revenue;
        }
    });
    
    // Format for chart
    const labels = Object.keys(salesByDay).map(date => 
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const values = Object.values(salesByDay);
    
    return { labels, values };
}

// Get profit by category
function getProfitByCategory() {
    const profitByCategory = {};
    
    allSales.forEach(sale => {
        const category = sale.category || 'Uncategorized';
        profitByCategory[category] = (profitByCategory[category] || 0) + sale.profit;
    });
    
    const labels = Object.keys(profitByCategory);
    const values = Object.values(profitByCategory);
    
    return { labels, values };
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}