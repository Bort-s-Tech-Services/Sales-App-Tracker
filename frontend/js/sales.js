// Sales Recording UI Script with Amazon S3 Document Receipt Upload
document.addEventListener('DOMContentLoaded', async () => {
  await loadSales();

  const recordSaleForm = document.getElementById('recordSaleForm');
  if (recordSaleForm) {
    recordSaleForm.addEventListener('submit', handleRecordSale);
  }
});

let allSales = [];

async function loadSales() {
  try {
    const data = await APIClient.getSales();
    allSales = data.sales || [];
    renderSalesTable(allSales);
  } catch (err) {
    console.error('Failed to load sales history:', err);
  }
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No sales recorded yet. Record your first sale!</td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => `
    <tr>
      <td>${s.sale_date || new Date().toISOString().split('T')[0]}</td>
      <td><strong>${s.product_name}</strong></td>
      <td><span class="badge badge-category">${s.category}</span></td>
      <td>${s.quantity}</td>
      <td class="text-success"><strong>₵${Number(s.revenue).toFixed(2)}</strong></td>
      <td class="${Number(s.profit) >= 0 ? 'text-success' : 'text-danger'}">₵${Number(s.profit).toFixed(2)}</td>
      <td>${s.customer_name || 'Walk-in'}</td>
      <td>
        ${s.receipt_s3_url ? `<a href="${s.receipt_s3_url}" target="_blank" class="btn btn-sm btn-outline-info"><i class="fas fa-file-pdf"></i> S3 Receipt</a>` : '<span style="color:var(--text-muted);">None</span>'}
        <button class="btn btn-sm btn-outline-danger" onclick="deleteSaleItem('${s.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function handleRecordSale(e) {
  e.preventDefault();

  const productName = document.getElementById('saleProductName').value;
  const category = document.getElementById('saleCategory').value;
  const quantity = document.getElementById('saleQuantity').value;
  const revenue = document.getElementById('saleRevenue').value;
  const cost = document.getElementById('saleCost').value;
  const customerName = document.getElementById('saleCustomerName')?.value || '';
  const notes = document.getElementById('saleNotes')?.value || '';
  const receiptFileInput = document.getElementById('saleReceiptFile');

  let s3ReceiptUrl = '';
  if (receiptFileInput && receiptFileInput.files && receiptFileInput.files[0]) {
    const file = receiptFileInput.files[0];
    console.log('[S3 Receipt Upload] Uploading document to Amazon S3...');
    s3ReceiptUrl = await S3Uploader.uploadFile(file, 'receipts');
  }

  try {
    await APIClient.recordSale({
      product_name: productName,
      category,
      quantity,
      revenue,
      cost,
      customer_name: customerName,
      receipt_s3_url: s3ReceiptUrl,
      notes
    });

    document.getElementById('recordSaleForm').reset();
    await loadSales();
  } catch (err) {
    alert('Failed to record sale: ' + err.message);
  }
}

async function deleteSaleItem(id) {
  if (!confirm('Are you sure you want to delete this sale record?')) return;
  try {
    await APIClient.deleteSale(id);
    await loadSales();
  } catch (err) {
    alert('Failed to delete sale: ' + err.message);
  }
}

window.deleteSaleItem = deleteSaleItem;
