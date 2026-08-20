// Dashboard Metrics & Overview Connected to Backend API
let salesChartInstance = null;
let profitChartInstance = null;
let rawSalesData = [];

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

  setupPeriodButtons();
  setupChartControls();

  try {
    await loadDashboardMetrics('today');
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
      const activeBtn = document.querySelector('.period-btn.active');
      const period = activeBtn ? activeBtn.getAttribute('data-period') : 'today';
      await loadDashboardMetrics(period);
    });
  }

  // Navigation buttons
  const addSaleBtn = document.getElementById('addSaleBtn');
  if (addSaleBtn) {
    addSaleBtn.addEventListener('click', () => {
      window.location.href = 'sales.html';
    });
  }

  const viewAllSalesBtn = document.getElementById('viewAllSales');
  if (viewAllSalesBtn) {
    viewAllSalesBtn.addEventListener('click', () => {
      window.location.href = 'reports.html';
    });
  }
});

function setupPeriodButtons() {
  const periodBtns = document.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.getAttribute('data-period');
      await loadDashboardMetrics(period);
    });
  });
}

function setupChartControls() {
  const chartPeriodSelect = document.getElementById('chartPeriod');
  if (chartPeriodSelect) {
    chartPeriodSelect.addEventListener('change', () => {
      const days = Number(chartPeriodSelect.value) || 7;
      const filtered = filterSalesByDays(rawSalesData, days);
      renderDashboardCharts(filtered);
    });
  }

  const profitPeriodSelect = document.getElementById('profitPeriod');
  if (profitPeriodSelect) {
    profitPeriodSelect.addEventListener('change', () => {
      renderDashboardCharts(rawSalesData);
    });
  }
}

function filterSalesByPeriod(sales, period) {
  const now = new Date();
  if (period === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    return sales.filter(s => (s.sale_date || '').startsWith(todayStr));
  } else if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return sales.filter(s => new Date(s.sale_date || Date.now()) >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return sales.filter(s => new Date(s.sale_date || Date.now()) >= monthAgo);
  } else if (period === 'year') {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    return sales.filter(s => new Date(s.sale_date || Date.now()) >= yearAgo);
  }
  return sales;
}

function filterSalesByDays(sales, days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return sales.filter(s => new Date(s.sale_date || Date.now()) >= cutoff);
}

async function loadDashboardMetrics(period = 'today') {
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
    const yearlyGrowthEl = document.getElementById('yearlyGrowth');

    const rev = Number(s.totalRevenue) || 0;
    const prof = Number(s.totalProfit) || 0;
    const margin = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';

    if (todayRevEl) todayRevEl.textContent = formatCurrency(s.totalRevenue);
    if (weeklyProfEl) weeklyProfEl.textContent = formatCurrency(s.totalProfit);
    if (monthlySalesEl) monthlySalesEl.textContent = formatCurrency(s.totalRevenue);

    if (avgSaleValEl) avgSaleValEl.textContent = formatCurrency(s.averageOrderValue);
    if (totalTxEl) totalTxEl.textContent = s.totalTransactions || 0;
    if (profitMarginEl) profitMarginEl.textContent = `${margin}%`;
    if (yearlyGrowthEl) yearlyGrowthEl.textContent = `${margin > 0 ? '+' : ''}${margin}%`;

    // Fetch transactions
    const salesData = await APIClient.getSales();
    rawSalesData = salesData.sales || [];

    const filteredSales = filterSalesByPeriod(rawSalesData, period);

    if (bestProductEl && rawSalesData.length > 0) {
      bestProductEl.textContent = rawSalesData[0].product_name || 'N/A';
    } else if (bestProductEl) {
      bestProductEl.textContent = 'None';
    }

    renderRecentSalesTable(filteredSales.slice(0, 5));
    renderDashboardCharts(rawSalesData);
  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
  }
}

function renderRecentSalesTable(sales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="text-align: center; padding: 2rem; color: #94a3b8;"><i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><p>No sales data available for this period</p></td></tr>`;
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
        <td style="white-space: nowrap; font-weight: 500;">${dateStr}</td>
        <td><strong style="color: var(--text-primary); font-weight: 600;">${s.product_name}</strong></td>
        <td style="text-align: center; font-weight: 600;">${s.quantity}</td>
        <td style="color: var(--accent-emerald); font-weight: 700;">₵${rev.toFixed(2)}</td>
        <td style="color: var(--text-muted);">₵${cost.toFixed(2)}</td>
        <td style="color: ${profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 700;">₵${profit.toFixed(2)}</td>
        <td style="text-align: center;"><span class="badge ${margin >= 0 ? 'badge-success' : 'badge-danger'}">${margin}%</span></td>
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

    salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue (GHS)',
          data: revData,
          borderColor: '#09090b',
          backgroundColor: 'rgba(9, 9, 11, 0.04)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#09090b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#334155', font: { weight: '600' } } }
        },
        scales: {
          x: { 
            ticks: { 
              color: '#64748b',
              maxTicksLimit: 5,
              maxRotation: 0,
              autoSkip: true
            }, 
            grid: { color: '#f1f5f9' } 
          },
          y: { 
            ticks: { 
              color: '#64748b',
              maxTicksLimit: 5
            }, 
            grid: { color: '#f1f5f9' } 
          }
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
          data: [profitData.reduce((a, b) => a + b, 0), Math.max(0, revData.reduce((a, b) => a + b, 0) - profitData.reduce((a, b) => a + b, 0))],
          backgroundColor: ['#059669', '#e2e8f0'],
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#334155', font: { weight: '600' } } }
        }
      }
    });
  }
}
