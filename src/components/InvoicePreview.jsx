import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '../utils/storage';
import './InvoicePreview.css';

export default function InvoicePreview({ bill, onClose }) {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice_${bill?.invoiceNo}`,
  });

  const handleDownloadPdf = async () => {
    const element = componentRef.current;
    if (!element) return;
    
    // Create canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${bill?.invoiceNo}.pdf`);
  };

  if (!bill) return null;

  return (
    <div className="modal-overlay animate-fade">
      <div className="modal-container animate-slide-up">
        <div className="modal-header no-print">
          <h2>Invoice Preview</h2>
          <div className="modal-actions">
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="invoice-paper-wrapper">
          <div className="invoice-paper" ref={componentRef}>
            <div className="invoice-header">
              <div className="invoice-brand">
                <h1>{bill.businessDetails?.businessName || 'Gravel & Sand'}</h1>
                <p>{bill.businessDetails?.businessAddress}</p>
                <p>Ph: {bill.businessDetails?.businessPhone}</p>
                {bill.businessDetails?.businessGST && <p>GSTIN: {bill.businessDetails.businessGST}</p>}
              </div>
              <div className="invoice-title-block">
                <h2>INVOICE</h2>
                <div className="invoice-meta-grid">
                  <span>Invoice No:</span>
                  <strong>{bill.invoiceNo}</strong>
                  <span>Date:</span>
                  <strong>{formatDate(bill.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div className="invoice-customer">
              <h3>Billed To:</h3>
              <p><strong>{bill.customerName}</strong></p>
              {bill.customerPhone && <p>Ph: {bill.customerPhone}</p>}
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Description of Goods</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">GST %</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.price)}</td>
                    <td className="text-right">{item.gst ? `${item.gst}%` : '-'}</td>
                    <td className="text-right">{formatCurrency(item.quantity * item.price * (1 + (Number(item.gst) || 0) / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span className="summary-amount">{formatCurrency(bill.totalAmount)}</span>
              </div>
            </div>

            <div className="invoice-footer">
              <div className="terms">
                <h4>Terms & Conditions:</h4>
                <p>1. Goods once sold will not be taken back.</p>
                <p>2. Subject to local jurisdiction.</p>
              </div>
              <div className="signature">
                <div className="sig-line"></div>
                <p>Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
