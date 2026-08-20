// Analytics & Financial Reports UI Script
let rawSalesData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadReportsData();

  // Setup Download CSV button
  const downloadBtn = document.getElementById('downloadReportBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      exportSalesToCSV(rawSalesData);
    });
  }

  // Filter change event
  const filterSelect = document.getElementById('reportFilterPeriod');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderReportsTable(filterSelect.value);
    });
  }
});

async function loadReportsData() {
  try {
    const summaryRes = await APIClient.getSummary();
    const s = summaryRes.summary || {};

    const formatCurrency = (val) => '₵' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const revEl = document.getElementById('reportRevenue');
    const costEl = document.getElementById('reportCost');
    const profEl = document.getElementById('reportProfit');
    const marginEl = document.getElementById('reportMargin');

    const rev = Number(s.totalRevenue) || 0;
    const prof = Number(s.totalProfit) || 0;
    const margin = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';

    if (revEl) revEl.textContent = formatCurrency(rev);
    if (costEl) costEl.textContent = formatCurrency(s.totalCost);
    if (profEl) profEl.textContent = formatCurrency(prof);
    if (marginEl) marginEl.textContent = `${margin}%`;

    // Fetch full sales list for table rendering
    const salesRes = await APIClient.getSales();
    rawSalesData = salesRes.sales || [];
    renderReportsTable('all');
  } catch (err) {
    console.error('Failed to load analytics reports:', err);
    const tbody = document.getElementById('reportTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-danger); padding:2rem;">Failed to load report data. Please check server status.</td></tr>`;
    }
  }
}

function renderReportsTable(filter = 'all') {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;

  let filtered = [...rawSalesData];
  const now = new Date();

  if (filter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    filtered = filtered.filter(s => (s.sale_date || '').startsWith(todayStr));
  } else if (filter === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(s => new Date(s.sale_date || Date.now()) >= weekAgo);
  } else if (filter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(s => new Date(s.sale_date || Date.now()) >= monthAgo);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-folder-open" style="font-size:1.8rem; margin-bottom:0.5rem;"></i><p>No transactions found for this period</p></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const rev = Number(s.revenue) || 0;
    const cost = Number(s.cost) || 0;
    const profit = Number(s.profit) || (rev - cost);
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';
    const dateStr = s.sale_date ? s.sale_date.split('T')[0] : 'N/A';

    return `
      <tr>
        <td style="white-space: nowrap; font-weight: 500;">${dateStr}</td>
        <td><strong style="color: var(--text-primary); font-weight: 600;">${s.product_name || 'N/A'}</strong></td>
        <td><span class="badge badge-info">${s.category || 'General'}</span></td>
        <td style="text-align: center; font-weight: 600;">${s.quantity || 1}</td>
        <td style="color: var(--accent-emerald); font-weight: 700;">₵${rev.toFixed(2)}</td>
        <td style="color: var(--text-muted);">₵${cost.toFixed(2)}</td>
        <td style="color: ${profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 700;">₵${profit.toFixed(2)}</td>
        <td style="text-align: center;"><span class="badge ${margin >= 0 ? 'badge-success' : 'badge-danger'}">${margin}%</span></td>
        <td style="text-align: center;">
          <button type="button" class="action-btn" onclick="viewSaleReceipt('${s.id}')" title="Preview & Download PDF Receipt">
            <i class="fas fa-file-pdf" style="color: var(--accent-rose);"></i> Receipt
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewSaleReceipt = function(saleId) {
  const sale = allSales.find(s => String(s.id) === String(saleId));
  if (sale && window.ReceiptGenerator) {
    window.ReceiptGenerator.previewReceipt(sale);
  } else if (sale && sale.receipt_s3_url) {
    window.open(sale.receipt_s3_url, '_blank');
  } else {
    alert('Receipt not found for this transaction.');
  }
};

function exportSalesToCSV(sales) {
  if (!sales || sales.length === 0) {
    alert('No sales data available to export.');
    return;
  }

  const headers = ['Sale ID', 'Date', 'Product Name', 'Category', 'Quantity', 'Revenue (GHS)', 'Cost (GHS)', 'Profit (GHS)', 'Margin (%)', 'Customer Name', 'Receipt S3 URL'];
  const rows = sales.map(s => {
    const rev = Number(s.revenue) || 0;
    const cost = Number(s.cost) || 0;
    const profit = Number(s.profit) || (rev - cost);
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';

    return [
      `"${s.id || ''}"`,
      `"${s.sale_date ? s.sale_date.split('T')[0] : ''}"`,
      `"${(s.product_name || '').replace(/"/g, '""')}"`,
      `"${(s.category || '').replace(/"/g, '""')}"`,
      s.quantity || 1,
      rev.toFixed(2),
      cost.toFixed(2),
      profit.toFixed(2),
      `${margin}%`,
      `"${(s.customer_name || '').replace(/"/g, '""')}"`,
      `"${s.receipt_s3_url || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Sales_Tracker_Pro_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
