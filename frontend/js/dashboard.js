// Dashboard Metrics & Overview Connected to Backend API
let salesChartInstance = null;
let profitChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Populate User details and current date
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const dateEl = document.getElementById('currentDate');

  if (nameEl) nameEl.textContent = user.full_name || 'Cloud Admin';
  if (emailEl) emailEl.textContent = user.email || 'admin@salestracker.cloud';
  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  try {
    await loadDashboardMetrics();
  } catch (err) {
    console.error('Error initializing dashboard:', err);
  } finally {
    // Hide loading overlay once metrics load or error occurs
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
      loadingOverlay.style.opacity = '0';
    }
  }

  // Setup refresh button
  const refreshBtn = document.getElementById('refreshSales');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadDashboardMetrics();
    });
  }

  // Navigation button
  const addSaleBtn = document.getElementById('addSaleBtn');
  if (addSaleBtn) {
    addSaleBtn.addEventListener('click', () => {
      window.location.href = 'sales.html';
    });
  }
});

async function loadDashboardMetrics() {
  try {
    const summaryData = await APIClient.getSummary();
    const s = summaryData.summary || {};

    const formatCurrency = (val) => '₵' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const todayRevEl = document.getElementById('todayRevenue');
    const weeklyProfEl = document.getElementById('weeklyProfit');
    const monthlySalesEl = document.getElementById('monthlySales');

    const bestProductEl = document.getElementById('bestProduct');
    const avgSaleValEl = document.getElementById('avgSaleValue');
    const totalTxEl = document.getElementById('totalTransactions');
    const profitMarginEl = document.getElementById('profitMargin');

    const rev = Number(s.totalRevenue) || 0;
    const prof = Number(s.totalProfit) || 0;
    const margin = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';

    if (todayRevEl) todayRevEl.textContent = formatCurrency(s.totalRevenue);
    if (weeklyProfEl) weeklyProfEl.textContent = formatCurrency(s.totalProfit);
    if (monthlySalesEl) monthlySalesEl.textContent = formatCurrency(s.totalRevenue);

    if (avgSaleValEl) avgSaleValEl.textContent = formatCurrency(s.averageOrderValue);
    if (totalTxEl) totalTxEl.textContent = s.totalTransactions || 0;
    if (profitMarginEl) profitMarginEl.textContent = `${margin}%`;

    // Load sales transactions
    const salesData = await APIClient.getSales();
    const sales = salesData.sales || [];

    if (bestProductEl && sales.length > 0) {
      bestProductEl.textContent = sales[0].product_name || 'N/A';
    } else if (bestProductEl) {
      bestProductEl.textContent = 'None';
    }

    renderRecentSalesTable(sales.slice(0, 5));
    renderDashboardCharts(sales);
  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
  }
}

function renderRecentSalesTable(sales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="text-align: center; padding: 2rem; color: #94a3b8;"><i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><p>No sales data available</p></td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => {
    const rev = Number(s.revenue) || 0;
    const cost = Number(s.cost) || 0;
    const profit = Number(s.profit) || (rev - cost);
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';
    const dateStr = s.sale_date ? s.sale_date.split('T')[0] : 'N/A';

    return `
      <tr>
        <td>${dateStr}</td>
        <td><strong>${s.product_name}</strong></td>
        <td>${s.quantity}</td>
        <td style="color:#10b981; font-weight:600;">₵${rev.toFixed(2)}</td>
        <td style="color:#94a3b8;">₵${cost.toFixed(2)}</td>
        <td style="color:${profit >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">₵${profit.toFixed(2)}</td>
        <td><span class="badge" style="background:${margin >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${margin >= 0 ? '#34d399' : '#f87171'}; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:600;">${margin}%</span></td>
      </tr>
    `;
  }).join('');
}

function renderDashboardCharts(sales) {
  if (typeof Chart === 'undefined') return;

  const salesCanvas = document.getElementById('salesChart');
  const profitCanvas = document.getElementById('profitChart');

  const labels = sales.length > 0 ? sales.map(s => (s.sale_date || '').split('T')[0] || 'Sale') : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revData = sales.length > 0 ? sales.map(s => Number(s.revenue) || 0) : [1200, 1900, 3000, 2500, 3200, 4100, 5000];
  const profitData = sales.length > 0 ? sales.map(s => Number(s.profit) || 0) : [500, 800, 1400, 1100, 1600, 2100, 2600];

  if (salesCanvas) {
    if (salesChartInstance) salesChartInstance.destroy();
    const ctx = salesCanvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue (GHS)',
          data: revData,
          borderColor: '#6366f1',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1' } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  if (profitCanvas) {
    if (profitChartInstance) profitChartInstance.destroy();
    const ctx2 = profitCanvas.getContext('2d');

    profitChartInstance = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Net Profit', 'Product Cost'],
        datasets: [{
          data: [profitData.reduce((a, b) => a + b, 0), revData.reduce((a, b) => a + b, 0) - profitData.reduce((a, b) => a + b, 0)],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1' } }
        }
      }
    });
  }
}
