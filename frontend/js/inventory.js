// Inventory Management UI Script connected to REST API
let allProducts = [];
let pendingDeleteId = null;
let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventory();
  setupModalListeners();
});

async function loadInventory() {
  try {
    const data = await APIClient.getProducts();
    allProducts = data.products || [];
    renderInventoryStats(allProducts);
    renderInventoryTable(allProducts);
  } catch (err) {
    console.error('Failed to load inventory:', err);
  }
}

function renderInventoryStats(products) {
  const totalProductsEl = document.getElementById('totalProducts');
  const totalStockEl = document.getElementById('totalStock');
  const lowStockCountEl = document.getElementById('lowStockCount');

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const lowStockCount = products.filter(p => (Number(p.quantity) || 0) < 5).length;

  if (totalProductsEl) totalProductsEl.textContent = totalProducts;
  if (totalStockEl) totalStockEl.textContent = totalStock;
  if (lowStockCountEl) lowStockCountEl.textContent = lowStockCount;
}

function renderInventoryTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-boxes"></i><p>No products yet. Add one to get started.</p></td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const qty = Number(p.quantity) || 0;
    const cost = Number(p.unit_cost) || 0;
    const price = Number(p.selling_price) || 0;
    const totalVal = qty * price;

    return `
      <tr>
        <td><strong>${p.product_name}</strong></td>
        <td><span class="badge" style="background:rgba(14, 165, 233, 0.15); color:#38bdf8; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">${p.category || 'General'}</span></td>
        <td>
          <span class="badge ${qty < 5 ? 'badge-danger' : 'badge-success'}" style="background:${qty < 5 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${qty < 5 ? '#f87171' : '#34d399'}; padding:0.25rem 0.6rem; border-radius:12px; font-weight:700;">
            ${qty} units ${qty < 5 ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
          </span>
        </td>
        <td>₵${cost.toFixed(2)}</td>
        <td><strong>₵${price.toFixed(2)}</strong></td>
        <td style="color:#10b981; font-weight:700;">₵${totalVal.toFixed(2)}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p.id}')" style="padding:0.35rem 0.6rem; font-size:0.8rem;" title="Edit Product">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="promptDeleteProduct('${p.id}')" style="padding:0.35rem 0.6rem; font-size:0.8rem;" title="Delete Product">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupModalListeners() {
  const productModal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const successModal = document.getElementById('successModal');

  const addBtn = document.getElementById('addProductBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('productForm');

  const cancelDelBtn = document.getElementById('cancelDeleteBtn');
  const confirmDelBtn = document.getElementById('confirmDeleteBtn');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  // Add Product Button
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingProductId = null;
      const titleEl = document.getElementById('modalTitle');
      if (titleEl) titleEl.textContent = 'Add New Product';
      if (form) form.reset();
      if (productModal) {
        productModal.style.display = 'flex';
        productModal.style.pointerEvents = 'auto';
      }
    });
  }

  // Close Product Modal
  const hideProductModal = () => {
    if (productModal) productModal.style.display = 'none';
  };
  if (closeBtn) closeBtn.addEventListener('click', hideProductModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideProductModal);

  // Form Submit (Add or Update)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('productName')?.value || '';
      const category = document.getElementById('category')?.value || '';
      const quantity = document.getElementById('quantity')?.value || 0;
      const unitCost = document.getElementById('unitCost')?.value || 0;
      const sellingPrice = document.getElementById('sellingPrice')?.value || 0;

      try {
        if (editingProductId) {
          await APIClient.updateProduct(editingProductId, {
            product_name: name,
            category,
            quantity,
            unit_cost: unitCost,
            selling_price: sellingPrice
          });
        } else {
          await APIClient.createProduct({
            product_name: name,
            category,
            quantity,
            unit_cost: unitCost,
            selling_price: sellingPrice
          });
        }

        hideProductModal();
        await loadInventory();

        const msgEl = document.getElementById('successMessage');
        if (msgEl) msgEl.textContent = editingProductId ? 'Product updated successfully!' : 'Product saved successfully!';
        if (successModal) {
          successModal.style.display = 'flex';
          successModal.style.pointerEvents = 'auto';
        }
      } catch (err) {
        alert('Failed to save product: ' + err.message);
      }
    });
  }

  // Delete Confirmation Buttons
  if (cancelDelBtn) {
    cancelDelBtn.addEventListener('click', () => {
      pendingDeleteId = null;
      if (deleteModal) deleteModal.style.display = 'none';
    });
  }

  if (confirmDelBtn) {
    confirmDelBtn.addEventListener('click', async () => {
      if (!pendingDeleteId) return;
      try {
        await APIClient.deleteProduct(pendingDeleteId);
        pendingDeleteId = null;
        if (deleteModal) deleteModal.style.display = 'none';
        await loadInventory();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    });
  }

  // Success Modal OK Button
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
      if (successModal) successModal.style.display = 'none';
    });
  }
}

function openEditProductModal(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  editingProductId = id;
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = 'Edit Product';

  const nameEl = document.getElementById('productName');
  const catEl = document.getElementById('category');
  const qtyEl = document.getElementById('quantity');
  const costEl = document.getElementById('unitCost');
  const priceEl = document.getElementById('sellingPrice');

  if (nameEl) nameEl.value = p.product_name || '';
  if (catEl) catEl.value = p.category || '';
  if (qtyEl) qtyEl.value = p.quantity || 0;
  if (costEl) costEl.value = p.unit_cost || 0;
  if (priceEl) priceEl.value = p.selling_price || 0;

  const productModal = document.getElementById('productModal');
  if (productModal) {
    productModal.style.display = 'flex';
    productModal.style.pointerEvents = 'auto';
  }
}

function promptDeleteProduct(id) {
  pendingDeleteId = id;
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'flex';
    deleteModal.style.pointerEvents = 'auto';
  }
}

window.openEditProductModal = openEditProductModal;
window.promptDeleteProduct = promptDeleteProduct;
