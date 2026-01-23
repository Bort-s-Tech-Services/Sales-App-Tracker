import { supabase, formatCurrency } from './supabase.js';
import { logout } from './auth.js';
import { getProductsByUser, decreaseProductStock } from './inventory.js';

// Initialize sales page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Update user info
    updateUserInfo(user);

    // Load products into dropdown
    await loadProductsDropdown(user.id);

    // Set today's date as default
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];

    // Setup event listeners
    setupEventListeners();

    // Setup calculation listeners
    setupCalculationListeners();

    // Load today's sales
    await loadTodaySales(user.id);
});

// Update user info
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
    const salesForm = document.getElementById('salesForm');
    if (salesForm) salesForm.addEventListener('submit', handleSubmit);

    const clearBtn = document.getElementById('clearForm');
    if (clearBtn) clearBtn.addEventListener('click', clearForm);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const exportBtn = document.getElementById('exportSalesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportSalesToCSV(allTodaySales));
    }

    const backBtn = document.querySelector('[href="dashboard.html"]');
    if (backBtn) backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });

    const addAnotherBtn = document.getElementById('addAnother');
    const goToDashboardBtn = document.getElementById('goToDashboard');

    if (addAnotherBtn) {
        addAnotherBtn.addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('active');
            clearForm();
        });
    }

    if (goToDashboardBtn) {
        goToDashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    const navItems = document.querySelectorAll('nav a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        });
    });
}

// Setup calculation listeners
function setupCalculationListeners() {
    ['quantity', 'unitPrice', 'unitCost'].forEach(field => {
        const element = document.getElementById(field);
        if (element) element.addEventListener('input', calculateTotals);
    });
}

// Load products into dropdown
async function loadProductsDropdown(userId) {
    try {
        const products = await getProductsByUser(userId);
        const productSelect = document.getElementById('productName');

        if (productSelect) {
            productSelect.innerHTML = '<option value="">-- Select a product --</option>';

            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.product_name} (${product.quantity} in stock)`;
                productSelect.appendChild(option);
            });

            productSelect.addEventListener('change', (e) => {
                const selectedProductId = e.target.value;
                if (!selectedProductId) return;

                const product = products.find(p => p.id == selectedProductId);
                if (!product) return;

                document.getElementById('category').value = product.category || '';
                const unitCostEl = document.getElementById('unitCost');
                const unitPriceEl = document.getElementById('unitPrice');

                if (unitCostEl) {
                    unitCostEl.value = product.unit_cost;
                    unitCostEl.readOnly = true;
                }

                if (unitPriceEl) {
                    unitPriceEl.value = product.selling_price ?? product.unit_cost;
                }

                calculateTotals();
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Calculate totals based on input
function calculateTotals() {
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
    const unitCost = parseFloat(document.getElementById('unitCost').value) || 0;

    const totalRevenue = quantity * unitPrice;
    const totalCost = quantity * unitCost;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalCostEl = document.getElementById('totalCost');
    const totalProfitEl = document.getElementById('totalProfit');
    const profitMarginEl = document.getElementById('profitMarginCalc');

    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    if (totalCostEl) totalCostEl.textContent = formatCurrency(totalCost);
    if (totalProfitEl) totalProfitEl.textContent = formatCurrency(totalProfit);
    if (profitMarginEl) profitMarginEl.textContent = `${profitMargin.toFixed(1)}%`;

    if (totalProfitEl && profitMarginEl) {
        const color = totalProfit > 0 ? '#10b981' : totalProfit < 0 ? '#ef4444' : '#64748b';
        totalProfitEl.style.color = color;
        profitMarginEl.style.color = color;
    }
}

let allTodaySales = [];

// Load today's sales
async function loadTodaySales(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allTodaySales = sales || [];
        updateTodayStats(sales || []);
        updateRecentSales(sales || []);
    } catch (error) {
        console.error('Error loading today\'s sales:', error);
        updateTodayStats([]);
        updateRecentSales([]);
    }
}

// Export sales to CSV
export function exportSalesToCSV(sales) {
    if (!sales || sales.length === 0) {
        alert('No sales data to export');
        return;
    }
    
    const headers = ['Date', 'Product', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Customer'];
    const csvRows = [headers.join(',')];
    
    for (const sale of sales) {
        const row = [
            sale.date,
            `"${sale.product_name}"`,
            sale.quantity,
            sale.revenue,
            sale.cost,
            sale.profit,
            `"${sale.customer || ''}"`
        ];
        csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update today's statistics
function updateTodayStats(sales) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    const countEl = document.getElementById('salesTodayCount');
    const revenueEl = document.getElementById('salesTodayRevenue');
    const profitEl = document.getElementById('salesTodayProfit');

    if (countEl) countEl.textContent = sales.length;
    if (revenueEl) revenueEl.textContent = formatCurrency(totalRevenue);
    if (profitEl) profitEl.textContent = formatCurrency(totalProfit);
}

// Update recent sales list
function updateRecentSales(sales) {
    const recentList = document.getElementById('recentSalesList');
    if (!recentList) return;

    if (sales.length === 0) {
        recentList.innerHTML = `
            <div class="empty-recent">
                <i class="fas fa-receipt"></i>
                <p>No sales today</p>
            </div>
        `;
        return;
    }

    recentList.innerHTML = sales.slice(0, 5).map(sale => `
        <div class="recent-item">
            <div class="product">${sale.product_name}</div>
            <div class="amount ${sale.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatCurrency(sale.profit)}
            </div>
        </div>
    `).join('');
}

// Handle form submission (profit removed from insert)
async function handleSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productName').value;
    if (!productId) {
        alert('Please select a product');
        return;
    }

    const productNameEl = document.getElementById('productName');
    const productName = productNameEl.options[productNameEl.selectedIndex]?.text.split(' (')[0];
    const quantity = parseInt(document.getElementById('quantity').value);
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);
    const saleDate = document.getElementById('saleDate').value;
    const category = document.getElementById('category').value;
    const customer = document.getElementById('customer')?.value.trim() || null;
    const notes = document.getElementById('notes')?.value.trim() || null;

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
        alert('Please enter a valid unit price');
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const sale = {
        product_name: productName,
        quantity,
        revenue: quantity * unitPrice,
        cost: quantity * unitCost,
        date: saleDate,
        category,
        customer,
        notes,
        user_id: user.id
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const { error } = await supabase.from('sales').insert([sale]);
        if (error) throw error;

        await decreaseProductStock(productId, quantity, user.id);

        document.getElementById('successModal').classList.add('active');
        await loadTodaySales(user.id);
    } catch (error) {
        console.error('Error saving sale:', error);
        alert('Failed to save sale: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Clear form
function clearForm() {
    const form = document.getElementById('salesForm');
    if (form) form.reset();
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('quantity').value = 1;
    calculateTotals();
}
