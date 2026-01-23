import { supabase, formatCurrency } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    loadDailyReport(user.id);
});

async function loadDailyReport(userId) {
    const container = document.getElementById('reportContainer');
    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;

        if (!sales || sales.length === 0) {
            container.innerHTML = '<p>No sales data found to generate reports.</p>';
            return;
        }

        // Group by date
        const reportsByDate = sales.reduce((acc, sale) => {
            const date = sale.date;
            if (!acc[date]) {
                acc[date] = { revenue: 0, cost: 0, profit: 0, count: 0 };
            }
            acc[date].revenue += sale.revenue;
            acc[date].cost += sale.cost;
            acc[date].profit += sale.profit;
            acc[date].count += 1;
            return acc;
        }, {});

        let html = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; text-align: left;">Date</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; text-align: left;">Sales</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; text-align: left;">Revenue</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; text-align: left;">Profit</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Object.keys(reportsByDate).forEach(date => {
            const r = reportsByDate[date];
            html += `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${date}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${r.count}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatCurrency(r.revenue)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: ${r.profit >= 0 ? '#10b981' : '#ef4444'}">
                        ${formatCurrency(r.profit)}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error generating report:', error);
        container.innerHTML = '<p style="color: red;">Failed to load report data.</p>';
    }
}
