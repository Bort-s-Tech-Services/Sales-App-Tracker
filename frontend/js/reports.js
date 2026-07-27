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
        <td>${dateStr}</td>
        <td><strong>${s.product_name || 'N/A'}</strong></td>
        <td><span class="badge" style="background:#e0e7ff; color:#4f46e5; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem;">${s.category || 'General'}</span></td>
        <td>${s.quantity || 1}</td>
        <td class="text-success" style="color:#10b981; font-weight:600;">₵${rev.toFixed(2)}</td>
        <td style="color:var(--text-muted);">₵${cost.toFixed(2)}</td>
        <td style="color:${profit >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">₵${profit.toFixed(2)}</td>
        <td><span class="badge" style="background:${margin >= 0 ? '#d1fae5' : '#fee2e2'}; color:${margin >= 0 ? '#065f46' : '#991b1b'}; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">${margin}%</span></td>
        <td>
          ${s.receipt_s3_url ? `<a href="${s.receipt_s3_url}" target="_blank" class="btn btn-sm btn-outline" style="padding:0.25rem 0.5rem; font-size:0.8rem;"><i class="fas fa-file-pdf"></i> View PDF</a>` : '<span style="color:var(--text-muted); font-size:0.85rem;">None</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

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
