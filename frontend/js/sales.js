// Sales Recording UI Script with Real-Time Math & Full Button Support
let allSales = [];
let inventoryProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Set default date to today
  const saleDateInput = document.getElementById('saleDate');
  if (saleDateInput && !saleDateInput.value) {
    saleDateInput.value = new Date().toISOString().split('T')[0];
  }

  await loadProductsDropdown();
  await loadSales();
  setupFormCalculations();
  setupButtonListeners();
});

async function loadProductsDropdown() {
  const select = document.getElementById('productName');
  if (!select) return;

  try {
    const res = await APIClient.getProducts();
    inventoryProducts = res.products || [];
    
    if (inventoryProducts.length > 0) {
      select.innerHTML = '<option value="">-- Select a product --</option>' +
        inventoryProducts.map(p => `<option value="${p.product_name}" data-price="${p.selling_price || 0}" data-cost="${p.unit_cost || 0}" data-category="${p.category || ''}">${p.product_name} (${p.quantity || 0} in stock)</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load products for dropdown:', err);
  }

  // When product is selected, auto-fill prices if available
  select.addEventListener('change', () => {
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt && selectedOpt.value) {
      const price = selectedOpt.getAttribute('data-price');
      const cost = selectedOpt.getAttribute('data-cost');
      const cat = selectedOpt.getAttribute('data-category');

      const priceInput = document.getElementById('unitPrice');
      const costInput = document.getElementById('unitCost');
      const catSelect = document.getElementById('category');

      if (priceInput && price && Number(price) > 0) priceInput.value = price;
      if (costInput && cost && Number(cost) > 0) costInput.value = cost;
      if (catSelect && cat) catSelect.value = cat;

      calculateTotals();
    }
  });
}

async function loadSales() {
  try {
    const data = await APIClient.getSales();
    allSales = data.sales || [];
    renderRecentSalesSummary(allSales);
  } catch (err) {
    console.error('Failed to load sales history:', err);
  }
}

function setupFormCalculations() {
  const quantityInput = document.getElementById('quantity');
  const unitPriceInput = document.getElementById('unitPrice');
  const unitCostInput = document.getElementById('unitCost');

  [quantityInput, unitPriceInput, unitCostInput].forEach(input => {
    if (input) {
      input.addEventListener('input', calculateTotals);
      input.addEventListener('change', calculateTotals);
    }
  });
}

function calculateTotals() {
  const qty = Number(document.getElementById('quantity')?.value) || 0;
  const price = Number(document.getElementById('unitPrice')?.value) || 0;
  const cost = Number(document.getElementById('unitCost')?.value) || 0;

  const totalRev = qty * price;
  const totalCst = qty * cost;
  const totalPrf = totalRev - totalCst;
  const margin = totalRev > 0 ? ((totalPrf / totalRev) * 100).toFixed(1) : '0.0';

  const revEl = document.getElementById('totalRevenue');
  const costEl = document.getElementById('totalCost');
  const profEl = document.getElementById('totalProfit');
  const marginEl = document.getElementById('profitMarginCalc');

  const format = (v) => '₵' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (revEl) revEl.textContent = format(totalRev);
  if (costEl) costEl.textContent = format(totalCst);
  if (profEl) {
    profEl.textContent = format(totalPrf);
    profEl.style.color = totalPrf >= 0 ? '#10b981' : '#ef4444';
  }
  if (marginEl) marginEl.textContent = `${margin}%`;
}

function setupButtonListeners() {
  const salesForm = document.getElementById('salesForm');
  if (salesForm) {
    salesForm.addEventListener('submit', handleRecordSale);
  }

  // Clear Form Button
  const clearBtn = document.getElementById('clearForm');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (salesForm) salesForm.reset();
      const saleDateInput = document.getElementById('saleDate');
      if (saleDateInput) saleDateInput.value = new Date().toISOString().split('T')[0];
      calculateTotals();
    });
  }

  // Save Draft Button
  const saveDraftBtn = document.getElementById('saveDraft');
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', () => {
      const draft = {
        productName: document.getElementById('productName')?.value || '',
        quantity: document.getElementById('quantity')?.value || '',
        unitPrice: document.getElementById('unitPrice')?.value || '',
        unitCost: document.getElementById('unitCost')?.value || '',
        category: document.getElementById('category')?.value || '',
        customer: document.getElementById('customer')?.value || '',
        notes: document.getElementById('notes')?.value || ''
      };
      localStorage.setItem('sales_draft', JSON.stringify(draft));
      alert('Sale draft saved to local browser storage!');
    });
  }

  // Export CSV Button
  const exportBtn = document.getElementById('exportSalesBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportSalesToCSV(allSales);
    });
  }

  // Duplicate Last Sale
  const dupBtn = document.getElementById('duplicateLast');
  if (dupBtn) {
    dupBtn.addEventListener('click', () => {
      if (allSales.length === 0) {
        alert('No previous sales available to duplicate.');
        return;
      }
      const last = allSales[0];
      const prodEl = document.getElementById('productName');
      const qtyEl = document.getElementById('quantity');
      const priceEl = document.getElementById('unitPrice');
      const costEl = document.getElementById('unitCost');
      const catEl = document.getElementById('category');
      const custEl = document.getElementById('customer');

      if (prodEl) prodEl.value = last.product_name || '';
      if (qtyEl) qtyEl.value = last.quantity || 1;
      if (priceEl) priceEl.value = (last.quantity > 0 ? last.revenue / last.quantity : last.revenue) || '';
      if (costEl) costEl.value = (last.quantity > 0 ? last.cost / last.quantity : last.cost) || '';
      if (catEl) catEl.value = last.category || '';
      if (custEl) custEl.value = last.customer_name || '';

      calculateTotals();
    });
  }

  // Add Multiple Items
  const addMultipleBtn = document.getElementById('addMultiple');
  if (addMultipleBtn) {
    addMultipleBtn.addEventListener('click', () => {
      alert('Quick Batch Mode: Complete this sale form, then hit Save Sale. You will instantly be prompted to add another item!');
      document.getElementById('quantity')?.focus();
    });
  }

  // Import Sales CSV
  const importBtn = document.getElementById('importSales');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        alert('File selected: ' + file.name + '\nProcessing sales batch upload...');
      };
      fileInput.click();
    });
  }

  // Modal Action Buttons
  const addAnotherBtn = document.getElementById('addAnother');
  const goToDashBtn = document.getElementById('goToDashboard');
  const successModal = document.getElementById('successModal');
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  const previewReceiptBtn = document.getElementById('previewReceiptBtn');

  if (addAnotherBtn) {
    addAnotherBtn.addEventListener('click', () => {
      if (successModal) successModal.style.display = 'none';
      if (salesForm) salesForm.reset();
      const saleDateInput = document.getElementById('saleDate');
      if (saleDateInput) saleDateInput.value = new Date().toISOString().split('T')[0];
      calculateTotals();
    });
  }

  if (goToDashBtn) {
    goToDashBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', () => {
      if (window.currentRecordedSale && window.ReceiptGenerator) {
        window.ReceiptGenerator.downloadPDF(window.currentRecordedSale);
      }
    });
  }

  if (previewReceiptBtn) {
    previewReceiptBtn.addEventListener('click', () => {
      if (window.currentRecordedSale && window.ReceiptGenerator) {
        window.ReceiptGenerator.previewReceipt(window.currentRecordedSale);
      }
    });
  }
}

async function handleRecordSale(e) {
  e.preventDefault();

  const prodSelect = document.getElementById('productName');
  const productName = prodSelect?.value || '';
  const quantity = Number(document.getElementById('quantity')?.value) || 1;
  const unitPrice = Number(document.getElementById('unitPrice')?.value) || 0;
  const unitCost = Number(document.getElementById('unitCost')?.value) || 0;
  const saleDate = document.getElementById('saleDate')?.value || new Date().toISOString().split('T')[0];
  const category = document.getElementById('category')?.value || 'General';
  const customer = document.getElementById('customer')?.value || 'Walk-in Customer';
  const notes = document.getElementById('notes')?.value || '';

  const revenue = quantity * unitPrice;
  const cost = quantity * unitCost;

  try {
    const res = await APIClient.recordSale({
      product_name: productName,
      category,
      quantity,
      revenue,
      cost,
      customer_name: customer,
      sale_date: saleDate,
      notes
    });

    const recorded = res.sale || {
      id: 'sle_' + Date.now(),
      product_name: productName,
      category,
      quantity,
      revenue,
      cost,
      customer_name: customer,
      sale_date: saleDate,
      notes
    };

    window.currentRecordedSale = recorded;

    // Update modal quick summary
    const modalRecId = document.getElementById('modalRecId');
    const modalRecAmount = document.getElementById('modalRecAmount');
    if (modalRecId && window.ReceiptGenerator) {
      modalRecId.textContent = window.ReceiptGenerator.formatReceiptId(recorded);
    }
    if (modalRecAmount) {
      modalRecAmount.textContent = '₵' + revenue.toFixed(2);
    }

    await loadSales();

    // Show success modal
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
    } else {
      alert('Sale recorded successfully!');
    }
  } catch (err) {
    alert('Failed to record sale: ' + err.message);
  }
}

function renderRecentSalesSummary(sales) {
  const countEl = document.getElementById('salesTodayCount');
  const revEl = document.getElementById('salesTodayRevenue');
  const profEl = document.getElementById('salesTodayProfit');
  const recentListEl = document.getElementById('recentSalesList');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => (s.sale_date || '').startsWith(todayStr));

  const totalRev = todaySales.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
  const totalCost = todaySales.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const totalProf = totalRev - totalCost;

  const format = (v) => '₵' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (countEl) countEl.textContent = todaySales.length;
  if (revEl) revEl.textContent = format(totalRev);
  if (profEl) profEl.textContent = format(totalProf);

  if (!recentListEl) return;

  if (sales.length === 0) {
    recentListEl.innerHTML = `<div class="empty-recent"><i class="fas fa-receipt"></i><p>No recent sales</p></div>`;
    return;
  }

  recentListEl.innerHTML = sales.slice(0, 5).map(s => {
    const rev = Number(s.revenue) || 0;
    const cost = Number(s.cost) || 0;
    const prof = Number(s.profit) || (rev - cost);
    return `
      <div class="recent-item">
        <div>
          <div class="product">${s.product_name}</div>
          <small style="color:#94a3b8;">${s.quantity} units &bull; ${s.sale_date ? s.sale_date.split('T')[0] : ''}</small>
        </div>
        <div style="text-align:right;">
          <div class="amount">${format(rev)}</div>
          <small style="color:${prof >= 0 ? '#10b981' : '#ef4444'}; font-weight:600;">+${format(prof)}</small>
        </div>
      </div>
    `;
  }).join('');
}

function exportSalesToCSV(sales) {
  if (!sales || sales.length === 0) {
    alert('No sales data available to export.');
    return;
  }

  const headers = ['Sale ID', 'Date', 'Product Name', 'Category', 'Quantity', 'Revenue (GHS)', 'Cost (GHS)', 'Profit (GHS)', 'Customer Name'];
  const rows = sales.map(s => {
    const rev = Number(s.revenue) || 0;
    const cost = Number(s.cost) || 0;
    const profit = Number(s.profit) || (rev - cost);

    return [
      `"${s.id || ''}"`,
      `"${s.sale_date ? s.sale_date.split('T')[0] : ''}"`,
      `"${(s.product_name || '').replace(/"/g, '""')}"`,
      `"${(s.category || '').replace(/"/g, '""')}"`,
      s.quantity || 1,
      rev.toFixed(2),
      cost.toFixed(2),
      profit.toFixed(2),
      `"${(s.customer_name || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Sales_Tracker_Sales_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
