/**
 * SalesTracker Digital Receipt & POS Printer Engine
 * Supports 80mm Thermal Receipt POS Printers, A5/A4 PDF Invoicing, and Instant Sharing.
 */

const ReceiptGenerator = {
  getBusinessName() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.company_name || user.business_name || user.full_name || 'SalesTracker Pro';
    } catch (e) {
      return 'SalesTracker Pro';
    }
  },

  getModalContainer() {
    let modal = document.getElementById('receiptModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receiptModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content modal-receipt">
          <div class="modal-header">
            <h3><i class="fas fa-receipt"></i> Sales Receipt</h3>
            <button class="modal-close" id="closeReceiptModal" type="button"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" id="receiptModalBody">
            <!-- Dynamic Receipt Content -->
          </div>
          <div class="modal-footer receipt-footer">
            <button type="button" class="btn btn-outline" id="receiptShareBtn">
              <i class="fas fa-share-alt"></i> Share
            </button>
            <button type="button" class="btn btn-secondary" id="receiptPrintThermalBtn" title="Optimized for 80mm POS Thermal Receipt Printers">
              <i class="fas fa-print"></i> Print POS Receipt
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
    if (!sale) return 'REC-' + Date.now().toString().slice(-6);
    if (sale.id && String(sale.id).startsWith('sle_')) {
      return 'REC-' + String(sale.id).replace('sle_', '').slice(-8).toUpperCase();
    }
    return 'REC-' + (sale.id || Date.now().toString().slice(-6));
  },

  previewReceipt(sale) {
    if (!sale) {
      alert('Unable to load receipt details.');
      return;
    }

    const modal = this.getModalContainer();
    const body = modal.querySelector('#receiptModalBody');
    const businessName = this.getBusinessName();
    const recId = this.formatReceiptId(sale);
    const dateStr = sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : new Date().toISOString().split('T')[0];
    const qty = Number(sale.quantity) || 1;
    const rev = Number(sale.revenue) || 0;
    const unitPrice = qty > 0 ? (rev / qty) : rev;
    const customer = sale.customer_name || sale.customer || 'Walk-in Customer';
    const productName = sale.product_name || 'Product Item';
    const category = sale.category || 'General';

    body.innerHTML = `
      <div class="receipt-paper" id="printableReceiptArea">
        <div class="receipt-header">
          <div class="receipt-business-name">${businessName}</div>
          <div class="receipt-meta-subtitle">Official Sales Receipt</div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-info-grid">
          <div class="receipt-info-item">
            <span class="info-label">Receipt #:</span>
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
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${productName}</strong>
                ${sale.notes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${sale.notes}</div>` : ''}
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
          <div class="summary-row total-row">
            <span>TOTAL PAID</span>
            <span class="total-price">${this.formatCurrency(rev)}</span>
          </div>
          <div class="receipt-status-stamp">
            <i class="fas fa-check-circle"></i> PAID IN FULL
          </div>
        </div>

        <div class="receipt-footer-notes">
          <p>Thank you for your patronage!</p>
          <p style="font-size: 0.725rem; color: #94a3b8;">${businessName} &bull; Powered by SalesTracker</p>
        </div>
      </div>
    `;

    // Hook action buttons
    const downloadBtn = modal.querySelector('#receiptDownloadPdfBtn');
    const printBtn = modal.querySelector('#receiptPrintThermalBtn');
    const shareBtn = modal.querySelector('#receiptShareBtn');

    downloadBtn.onclick = () => this.downloadPDF(sale);
    printBtn.onclick = () => this.printReceipt(sale);
    shareBtn.onclick = () => this.shareReceipt(sale);

    modal.classList.add('active');
    modal.style.display = 'flex';
  },

  downloadPDF(sale) {
    const businessName = this.getBusinessName();
    const recId = this.formatReceiptId(sale);
    const dateStr = sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : new Date().toISOString().split('T')[0];
    const qty = Number(sale.quantity) || 1;
    const rev = Number(sale.revenue) || 0;
    const unitPrice = qty > 0 ? (rev / qty) : rev;
    const customer = sale.customer_name || sale.customer || 'Walk-in Customer';
    const productName = sale.product_name || 'Product Item';
    const category = sale.category || 'General';

    // If jsPDF is available
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150] // 80mm Roll Format (POS Receipt Standard)
      });

      // Business Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(businessName.substring(0, 24), 40, 10, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Sales Receipt & Payment Voucher', 40, 15, { align: 'center' });

      // Line Divider
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, 18, 75, 18);

      // Meta Information
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Receipt #: ${recId}`, 5, 23);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${dateStr}`, 5, 28);
      doc.text(`Customer: ${customer.substring(0, 25)}`, 5, 33);
      doc.text(`Category: ${category}`, 5, 38);

      // Line Divider
      doc.line(5, 42, 75, 42);

      // Item Header
      doc.setFont('helvetica', 'bold');
      doc.text('ITEM', 5, 47);
      doc.text('QTY', 38, 47);
      doc.text('PRICE', 48, 47);
      doc.text('TOTAL', 65, 47);

      // Item Detail
      doc.setFont('helvetica', 'normal');
      doc.text(productName.substring(0, 18), 5, 53);
      doc.text(String(qty), 40, 53);
      doc.text(unitPrice.toFixed(2), 48, 53);
      doc.setFont('helvetica', 'bold');
      doc.text(rev.toFixed(2), 65, 53);

      // Line Divider
      doc.line(5, 58, 75, 58);

      // Total Paid
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL PAID:', 5, 65);
      doc.text(`GHS ${rev.toFixed(2)}`, 75, 65, { align: 'right' });

      // Status Box
      doc.setFontSize(8);
      doc.text('*** [ PAID IN FULL ] ***', 40, 74, { align: 'center' });

      // Footer Message
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for your business!', 40, 82, { align: 'center' });
      doc.text('Verified Digital POS Copy', 40, 87, { align: 'center' });

      doc.save(`Receipt_${recId}.pdf`);
    } else {
      // Fallback to POS Print dialog
      this.printReceipt(sale);
    }
  },

  printReceipt(sale) {
    const businessName = this.getBusinessName();
    const recId = this.formatReceiptId(sale);
    const dateStr = sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : new Date().toISOString().split('T')[0];
    const qty = Number(sale.quantity) || 1;
    const rev = Number(sale.revenue) || 0;
    const unitPrice = qty > 0 ? (rev / qty) : rev;
    const customer = sale.customer_name || sale.customer || 'Walk-in Customer';
    const productName = sale.product_name || 'Product Item';
    const category = sale.category || 'General';

    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (!printWin) {
      alert('Please allow popups in your browser to print your receipt.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${recId}</title>
        <style>
          @page {
            size: 80mm auto; /* 80mm POS Thermal Printer Format */
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
            width: 80mm;
            max-width: 80mm;
            padding: 4mm 5mm;
            color: #000000;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.35;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .biz-name {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .biz-sub {
            font-size: 10px;
            color: #333;
            margin-top: 2px;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 11px;
          }
          th {
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            text-align: left;
            font-size: 10px;
          }
          td {
            padding: 4px 0;
            vertical-align: top;
          }
          .total-section {
            margin-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            padding-top: 4px;
          }
          .stamp {
            text-align: center;
            font-weight: 900;
            font-size: 12px;
            margin: 8px 0;
            border: 1px solid #000;
            padding: 3px;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            margin-top: 8px;
            padding-bottom: 8mm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="biz-name">${businessName}</div>
          <div class="biz-sub">Official Sales Receipt</div>
        </div>

        <div class="divider"></div>

        <div class="meta-row">
          <span>Receipt #:</span>
          <strong>${recId}</strong>
        </div>
        <div class="meta-row">
          <span>Date:</span>
          <span>${dateStr}</span>
        </div>
        <div class="meta-row">
          <span>Customer:</span>
          <span>${customer}</span>
        </div>
        <div class="meta-row">
          <span>Category:</span>
          <span>${category}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 48%;">Item</th>
              <th style="width: 14%; text-align: center;">Qty</th>
              <th style="width: 18%; text-align: right;">Price</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${productName}</strong></td>
              <td style="text-align: center;">${qty}</td>
              <td style="text-align: right;">${unitPrice.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold;">${rev.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total-section">
          <div class="total-row">
            <span>TOTAL PAID:</span>
            <span>GHS ${rev.toFixed(2)}</span>
          </div>
          <div class="stamp">*** PAID IN FULL ***</div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by SalesTracker Cloud</p>
        </div>

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
    const businessName = this.getBusinessName();
    const recId = this.formatReceiptId(sale);
    const rev = Number(sale.revenue) || 0;
    const shareText = `*${businessName} - Official Sales Receipt*\nReceipt #: ${recId}\nItem: ${sale.product_name}\nQuantity: ${sale.quantity}\nTotal Paid: GHS ${rev.toFixed(2)}\nDate: ${sale.sale_date ? (sale.sale_date.includes('T') ? sale.sale_date.split('T')[0] : sale.sale_date) : ''}\nStatus: PAID IN FULL\n\nThank you for your patronage!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} Receipt ${recId}`,
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
      alert(`Receipt for ${recId} copied to clipboard! You can paste and share it via WhatsApp, SMS, or Email.`);
    } catch (e) {
      alert(shareText);
    }
  }
};

window.ReceiptGenerator = ReceiptGenerator;
