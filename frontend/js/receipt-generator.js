/**
 * SalesTracker Digital Receipt & PDF Generator
 * Provides interactive receipt previewing, PDF downloading, printing, and sharing.
 */

const ReceiptGenerator = {
  getModalContainer() {
    let modal = document.getElementById('receiptModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receiptModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content modal-receipt">
          <div class="modal-header">
            <h3><i class="fas fa-receipt"></i> Official Sales Receipt</h3>
            <button class="modal-close" id="closeReceiptModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" id="receiptModalBody">
            <!-- Dynamic Receipt Paper Container -->
          </div>
          <div class="modal-footer receipt-footer">
            <button type="button" class="btn btn-outline" id="receiptShareBtn">
              <i class="fas fa-share-alt"></i> Share
            </button>
            <button type="button" class="btn btn-secondary" id="receiptPrintBtn">
              <i class="fas fa-print"></i> Print
            </button>
            <button type="button" class="btn btn-primary" id="receiptDownloadPdfBtn">
              <i class="fas fa-file-pdf"></i> Download PDF
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#closeReceiptModal').addEventListener('click', () => {
        modal.classList.remove('active');
        modal.style.display = 'none';
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      });
    }
    return modal;
  },

  formatCurrency(val) {
    const num = Number(val) || 0;
    return '₵' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatReceiptId(sale) {
    if (sale.id && String(sale.id).startsWith('sle_')) {
      return 'REC-' + String(sale.id).replace('sle_', '').slice(-8).toUpperCase();
    }
    return 'REC-' + (sale.id || 'INV-' + Date.now().toString().slice(-6));
  },

  previewReceipt(sale) {
    if (!sale) return;
    const modal = this.getModalContainer();
    const body = modal.querySelector('#receiptModalBody');
    const recId = this.formatReceiptId(sale);
    const dateStr = sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : new Date().toISOString().split('T')[0];
    const qty = Number(sale.quantity) || 1;
    const rev = Number(sale.revenue) || 0;
    const unitPrice = qty > 0 ? (rev / qty) : rev;
    const customer = sale.customer_name || sale.customer || 'Valued Customer';
    const productName = sale.product_name || 'Product Item';
    const category = sale.category || 'General';

    body.innerHTML = `
      <div class="receipt-paper" id="printableReceiptArea">
        <div class="receipt-header">
          <div class="receipt-logo">
            <i class="fas fa-chart-line"></i> SalesTracker Pro
          </div>
          <div class="receipt-meta-subtitle">Enterprise Sales & Cloud Analytics</div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-info-grid">
          <div class="receipt-info-item">
            <span class="info-label">Receipt No:</span>
            <span class="info-val font-mono">${recId}</span>
          </div>
          <div class="receipt-info-item">
            <span class="info-label">Date:</span>
            <span class="info-val">${dateStr}</span>
          </div>
          <div class="receipt-info-item">
            <span class="info-label">Customer:</span>
            <span class="info-val">${customer}</span>
          </div>
          <div class="receipt-info-item">
            <span class="info-label">Category:</span>
            <span class="info-val">${category}</span>
          </div>
        </div>

        <div class="receipt-divider"></div>

        <table class="receipt-items-table">
          <thead>
            <tr>
              <th style="text-align: left;">Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${productName}</strong>
                ${sale.notes ? `<div style="font-size: 0.75rem; color: #64748b;">${sale.notes}</div>` : ''}
              </td>
              <td style="text-align: center;">${qty}</td>
              <td style="text-align: right;">${this.formatCurrency(unitPrice)}</td>
              <td style="text-align: right; font-weight: 700;">${this.formatCurrency(rev)}</td>
            </tr>
          </tbody>
        </table>

        <div class="receipt-divider"></div>

        <div class="receipt-summary-area">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${this.formatCurrency(rev)}</span>
          </div>
          <div class="summary-row">
            <span>Tax (0%)</span>
            <span>₵0.00</span>
          </div>
          <div class="summary-row total-row">
            <span>Amount Paid</span>
            <span class="total-price">${this.formatCurrency(rev)}</span>
          </div>
          <div class="receipt-status-stamp">
            <i class="fas fa-check-circle"></i> PAID IN FULL
          </div>
        </div>

        <div class="receipt-footer-notes">
          <p>Thank you for your business!</p>
          <p style="font-size: 0.75rem; color: #94a3b8;">Generated via SalesTracker Cloud System &bull; Verified Digital Copy</p>
        </div>
      </div>
    `;

    // Hook action buttons
    const downloadBtn = modal.querySelector('#receiptDownloadPdfBtn');
    const printBtn = modal.querySelector('#receiptPrintBtn');
    const shareBtn = modal.querySelector('#receiptShareBtn');

    downloadBtn.onclick = () => this.downloadPDF(sale);
    printBtn.onclick = () => this.printReceipt(sale);
    shareBtn.onclick = () => this.shareReceipt(sale);

    modal.classList.add('active');
    modal.style.display = 'flex';
  },

  downloadPDF(sale) {
    const recId = this.formatReceiptId(sale);
    const dateStr = sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : new Date().toISOString().split('T')[0];
    const qty = Number(sale.quantity) || 1;
    const rev = Number(sale.revenue) || 0;
    const unitPrice = qty > 0 ? (rev / qty) : rev;
    const customer = sale.customer_name || sale.customer || 'Valued Customer';
    const productName = sale.product_name || 'Product Item';
    const category = sale.category || 'General';

    // If jsPDF is available
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      // Header
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, 148, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SalesTracker Pro', 12, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Sales Receipt & Invoice', 12, 20);

      // Meta Block
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Receipt #: ${recId}`, 12, 38);
      doc.text(`Date: ${dateStr}`, 90, 38);

      doc.setFont('helvetica', 'normal');
      doc.text(`Customer: ${customer}`, 12, 45);
      doc.text(`Category: ${category}`, 90, 45);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(12, 50, 136, 50);

      // Table Header
      doc.setFillColor(248, 250, 252);
      doc.rect(12, 54, 124, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('ITEM DESCRIPTION', 14, 59);
      doc.text('QTY', 76, 59);
      doc.text('UNIT PRICE', 94, 59);
      doc.text('TOTAL', 122, 59);

      // Item Row
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(productName.substring(0, 30), 14, 68);
      doc.text(String(qty), 80, 68);
      doc.text(`GHS ${unitPrice.toFixed(2)}`, 94, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(`GHS ${rev.toFixed(2)}`, 122, 68);

      // Divider
      doc.line(12, 75, 136, 75);

      // Total Block
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 80, 84);
      doc.text(`GHS ${rev.toFixed(2)}`, 122, 84);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(5, 150, 105);
      doc.text('Total Paid:', 80, 94);
      doc.text(`GHS ${rev.toFixed(2)}`, 122, 94);

      // Status
      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105);
      doc.text('STATUS: [ PAID IN FULL ]', 14, 94);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for your business! - SalesTracker Cloud Services', 12, 120);

      doc.save(`Receipt_${recId}.pdf`);
    } else {
      // Fallback: Printable HTML pop-up
      this.printReceipt(sale);
    }
  },

  printReceipt(sale) {
    const printable = document.getElementById('printableReceiptArea');
    if (!printable) {
      this.previewReceipt(sale);
      setTimeout(() => this.printReceipt(sale), 300);
      return;
    }

    const printWin = window.open('', '_blank', 'width=650,height=750');
    if (!printWin) {
      alert('Please allow popups to print your receipt.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${this.formatReceiptId(sale)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 2rem; color: #09090b; }
          .receipt-paper { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 2rem; border-radius: 8px; }
          .receipt-header { text-align: center; margin-bottom: 1.5rem; }
          .receipt-logo { font-size: 1.4rem; font-weight: 800; }
          .receipt-meta-subtitle { font-size: 0.85rem; color: #64748b; }
          .receipt-divider { border-bottom: 1px dashed #cbd5e1; margin: 1.25rem 0; }
          .receipt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.875rem; margin-bottom: 1rem; }
          .info-label { color: #64748b; display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
          .info-val { font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
          th { border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
          td { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
          .summary-row { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.9rem; }
          .total-row { font-size: 1.15rem; font-weight: 800; border-top: 1px solid #09090b; padding-top: 0.5rem; margin-top: 0.5rem; }
          .receipt-status-stamp { margin-top: 1rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 0.5rem; text-align: center; font-weight: 700; border-radius: 4px; }
          .receipt-footer-notes { text-align: center; margin-top: 1.5rem; font-size: 0.8rem; color: #64748b; }
        </style>
      </head>
      <body>
        ${printable.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  async shareReceipt(sale) {
    const recId = this.formatReceiptId(sale);
    const rev = Number(sale.revenue) || 0;
    const shareText = `Official Sales Receipt\nReceipt #: ${recId}\nProduct: ${sale.product_name}\nQuantity: ${sale.quantity}\nTotal Paid: GHS ${rev.toFixed(2)}\nDate: ${sale.sale_date ? sale.sale_date.split('T')[0] : ''}\nStatus: PAID IN FULL\n\nSalesTracker Cloud Services`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${recId}`,
          text: shareText
        });
        return;
      } catch (err) {
        console.log('Share dismissed or failed:', err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      alert(`Receipt details for ${recId} copied to clipboard! You can paste and send it via WhatsApp, Email, or Slack.`);
    } catch (e) {
      alert(shareText);
    }
  }
};

window.ReceiptGenerator = ReceiptGenerator;
