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
    // Form submission
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        salesForm.addEventListener('submit', handleSubmit);
    }
    
    // Clear form
    const clearBtn = document.getElementById('clearForm');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Back to dashboard
    const backBtn = document.querySelector('[href="dashboard.html"]');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }
    
    // Modal actions
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
    
    // Mobile navigation: close sidebar when nav item is clicked
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
    const calculateFields = ['quantity', 'unitPrice', 'unitCost'];
    calculateFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', calculateTotals);
        }
    });
}

// Load products into dropdown
async function loadProductsDropdown(userId) {
    try {
        const products = await getProductsByUser(userId);
        const productSelect = document.getElementById('productName');
        
        if (productSelect) {
            // Clear existing options except default
            productSelect.innerHTML = '<option value="">-- Select a product --</option>';
            
            // Add products
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.product_name} (${product.quantity} in stock)`;
                productSelect.appendChild(option);
            });
            
            // Add change listener to update unit cost
            productSelect.addEventListener('change', (e) => {
                const selectedProductId = e.target.value;
                if (selectedProductId) {
                    const product = products.find(p => p.id == selectedProductId);
                    if (product) {
                        document.getElementById('unitCost').value = product.unit_cost;
                        document.getElementById('category').value = product.category || '';
                    }
                }
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
    
    // Update display
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalCostEl = document.getElementById('totalCost');
    const totalProfitEl = document.getElementById('totalProfit');
    const profitMarginEl = document.getElementById('profitMarginCalc');
    
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    if (totalCostEl) totalCostEl.textContent = formatCurrency(totalCost);
    if (totalProfitEl) totalProfitEl.textContent = formatCurrency(totalProfit);
    if (profitMarginEl) profitMarginEl.textContent = `${profitMargin.toFixed(1)}%`;
    
    // Color code profit
    if (totalProfitEl && profitMarginEl) {
        if (totalProfit > 0) {
            totalProfitEl.style.color = '#10b981';
            profitMarginEl.style.color = '#10b981';
        } else if (totalProfit < 0) {
            totalProfitEl.style.color = '#ef4444';
            profitMarginEl.style.color = '#ef4444';
        } else {
            totalProfitEl.style.color = '#64748b';
            profitMarginEl.style.color = '#64748b';
        }
    }
}

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
        
        updateTodayStats(sales || []);
        updateRecentSales(sales || []);
        
    } catch (error) {
        console.error('Error loading today\'s sales:', error);
        updateTodayStats([]);
        updateRecentSales([]);
    }
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

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const productId = document.getElementById('productName').value;
    const productNameEl = document.getElementById('productName');
    const productName = productNameEl.options[productNameEl.selectedIndex]?.text.split(' (')[0];
    const quantity = parseInt(document.getElementById('quantity').value);
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);
    const saleDate = document.getElementById('saleDate').value;
    const category = document.getElementById('category').value;
    const customer = document.getElementById('customer')?.value.trim() || null;
    const notes = document.getElementById('notes')?.value.trim() || null;
    
    // Validate required fields
    if (!productId || !quantity) {
        alert('Please select a product and enter a valid quantity');
        return;
    }
    
    if (quantity <= 0 || unitPrice <= 0 || unitCost < 0) {
        alert('Please enter valid quantity and price values');
        return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }
    
    // Calculate totals
    const revenue = quantity * unitPrice;
    const cost = quantity * unitCost;
    const profit = revenue - cost;
    
    // Prepare sale object
    const sale = {
        product_name: productName,
        quantity,
        revenue,
        cost,
        profit,
        date: saleDate,
        category,
        customer,
        notes,
        user_id: user.id
    };
    
    // Submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        // Save to Supabase
        const { error } = await supabase
            .from('sales')
            .insert([sale]);
        
        if (error) throw error;
        
        // Decrease product stock
        await decreaseProductStock(productId, quantity, user.id);
        // Show success modal
        document.getElementById('successModal').classList.add('active');
        
        // Reload today's sales
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
    if (form) {
        form.reset();
        document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('quantity').value = 1;
        calculateTotals();
    }
}