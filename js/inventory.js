import { supabase, formatCurrency } from './supabase.js';
import { logout } from './auth.js';

let currentEditingProduct = null;

// Initialize inventory page
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
    
    // Load products
    await loadProducts(user.id);
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
    // Add Product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }
    
    // Product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Modal controls
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    if (closeModal) closeModal.addEventListener('click', closeProductModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
    
    // Delete modal controls
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Success modal controls
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('active');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
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

// Load products from database
async function loadProducts(userId) {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayProducts(products || []);
        updateStats(products || []);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
    }
}

// Display products in table
function displayProducts(products) {
    const table = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-boxes"></i><p>No products yet. Add one to get started.</p></td></tr>';
        return;
    }
    
    table.innerHTML = products.map(product => {
        const isLowStock = product.quantity < 10;
        return `
        <tr class="${isLowStock ? 'row-low-stock' : ''}">
            <td><strong>${product.product_name}</strong></td>
            <td>${product.category || '--'}</td>
            <td>
                <span class="badge ${isLowStock ? 'badge-danger' : 'badge-success'}">
                    ${product.quantity}
                    ${isLowStock ? ' <i class="fas fa-exclamation-triangle"></i>' : ''}
                </span>
            </td>
            <td>${formatCurrency(product.unit_cost)}</td>
            <td>${formatCurrency(product.selling_price || 0)}</td>
            <td>${formatCurrency(product.quantity * product.unit_cost)}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id}, '${escapeSingleQuote(product.product_name)}', '${product.category || ''}', ${product.quantity}, ${product.unit_cost}, ${product.selling_price === null || product.selling_price === undefined ? 'null' : product.selling_price})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `;}).join('');
}

// Update statistics
function updateStats(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity < 10).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('lowStockCount').textContent = lowStockCount;
}

// Open add product modal
function openAddProductModal() {
    currentEditingProduct = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
    document.getElementById('productName').focus();
}

// Edit product
window.editProduct = async function(id, name, category, quantity, unitCost, sellingPrice) {
    currentEditingProduct = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = name;
    document.getElementById('category').value = category;
    document.getElementById('quantity').value = quantity;
    document.getElementById('unitCost').value = unitCost;
    const sp = document.getElementById('sellingPrice');
    if (sp) sp.value = sellingPrice !== undefined && sellingPrice !== null ? sellingPrice : '';
    document.getElementById('productModal').classList.add('active');
    document.getElementById('productName').focus();
};

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    currentEditingProduct = null;
    document.getElementById('productForm').reset();
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const productName = document.getElementById('productName').value.trim();
    const category = document.getElementById('category').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);
    const sellingPriceEl = document.getElementById('sellingPrice');
    const sellingPrice = sellingPriceEl && sellingPriceEl.value !== '' ? parseFloat(sellingPriceEl.value) : null;
    
    if (!productName || quantity < 0 || unitCost < 0 || (sellingPrice !== null && sellingPrice < 0)) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    try {
        if (currentEditingProduct) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update({
                    product_name: productName,
                    category: category,
                    quantity: quantity,
                    unit_cost: unitCost,
                    selling_price: sellingPrice,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentEditingProduct)
                .eq('user_id', user.id);
            
            if (error) throw error;
            showSuccessMessage('Product updated successfully!');
        } else {
            // Add new product
            const { error } = await supabase
                .from('products')
                .insert({
                    product_name: productName,
                    category: category,
                    quantity: quantity,
                    unit_cost: unitCost,
                    selling_price: sellingPrice,
                    user_id: user.id
                });
            
            if (error) throw error;
            showSuccessMessage('Product added successfully!');
        }
        
        closeProductModal();
        await loadProducts(user.id);
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification(error.message || 'Failed to save product', 'error');
    }
}

// Open delete modal
window.openDeleteModal = function(id) {
    currentEditingProduct = id;
    document.getElementById('deleteModal').classList.add('active');
};

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentEditingProduct = null;
}

// Confirm delete
async function confirmDelete() {
    if (!currentEditingProduct) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', currentEditingProduct)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        closeDeleteModal();
        showNotification('Product deleted successfully!', 'success');
        await loadProducts(user.id);
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product', 'error');
    }
}

// Show success message
function showSuccessMessage(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').classList.add('active');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const style = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.style.cssText = style;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Helper function to escape single quotes
function escapeSingleQuote(str) {
    return str.replace(/'/g, "\\'");
}

// Export functions for use in sales.js
export async function getProductsByUser(userId) {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, product_name, quantity, unit_cost, selling_price, category')
            .eq('user_id', userId)
            .order('product_name');
        
        if (error) throw error;
        return products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

export async function decreaseProductStock(productId, quantity, userId) {
    try {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', productId)
            .eq('user_id', userId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const newQuantity = Math.max(0, product.quantity - quantity);
        
        const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', productId)
            .eq('user_id', userId);
        
        if (updateError) throw updateError;
        
        return true;
    } catch (error) {
        console.error('Error updating stock:', error);
        return false;
    }
}
