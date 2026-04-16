import { useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCurrency, numberToWords } from '../utils/storage';
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
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${bill?.invoiceNo}.pdf`);
  };

  if (!bill) return null;

  const bDetails = bill.businessDetails || {};
  const isGSTEnabled = bDetails.enableGST;
  const isInterState = isGSTEnabled && (bill.taxType === 'IGST' || (bDetails.businessState?.trim().toLowerCase() !== bill.customerState?.trim().toLowerCase() && bill.customerState));

  // Compute item totals
  const itemsRender = bill.items.map(item => {
    const taxable = item.quantity * item.price;
    const gstAmt = (taxable * (Number(item.gst) || 0)) / 100;
    const total = taxable + gstAmt;
    return { ...item, taxable, gstAmt, total };
  });

  const subTotal = itemsRender.reduce((sum, item) => sum + item.taxable, 0);
  const totalGST = itemsRender.reduce((sum, item) => sum + item.gstAmt, 0);
  const totalQuantity = itemsRender.reduce((sum, item) => sum + Number(item.quantity), 0);
  const grandTotal = Math.round(subTotal + totalGST);

  const taxRows = useMemo(() => {
    const breakup = {};
    itemsRender.forEach(item => {
      if (!item.gst) return;
      const hsn = item.hsn || '-';
      if (!breakup[hsn]) {
        breakup[hsn] = { hsn, taxable: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, totalTax: 0 };
      }
      breakup[hsn].taxable += item.taxable;
      breakup[hsn].totalTax += item.gstAmt;
      
      if (isInterState) {
        breakup[hsn].igstAmt += item.gstAmt;
        breakup[hsn].igstRate = item.gst;
      } else {
        breakup[hsn].cgstAmt += item.gstAmt / 2;
        breakup[hsn].sgstAmt += item.gstAmt / 2;
        breakup[hsn].cgstRate = item.gst / 2;
        breakup[hsn].sgstRate = item.gst / 2;
      }
    });
    return Object.values(breakup);
  }, [itemsRender, isInterState]);

  const totalTaxableTax = taxRows.reduce((s, r) => s + r.taxable, 0);
  const totalCgstTax = taxRows.reduce((s, r) => s + r.cgstAmt, 0);
  const totalSgstTax = taxRows.reduce((s, r) => s + r.sgstAmt, 0);
  const totalIgstTax = taxRows.reduce((s, r) => s + r.igstAmt, 0);
  const totalTaxAll = taxRows.reduce((s, r) => s + r.totalTax, 0);

  const paddedItems = [...itemsRender];

  return (
    <div className="modal-overlay animate-fade">
      <div className="modal-container animate-slide-up">
        <div className="modal-header no-print">
          <h2>Invoice Preview</h2>
          <div className="modal-actions">
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>Print</button>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>Download PDF</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="invoice-paper-wrapper">
          <div className="invoice-paper" ref={componentRef}>
            <div className="invoice-box">
              {/* Header */}
              <div className="invoice-title">Tax Invoice</div>
              
              <div className="invoice-header-row">
                <div className="invoice-company-info">
                  <div className="srm-logo">
                    <span className="srm-text-bold">SRM</span>
                    <span className="srm-text-sub">AGENCIES</span>
                  </div>
                  <div className="company-details">
                    <h1>{bDetails.businessName || 'SRM AGENCIES'}</h1>
                    <p>{bDetails.businessAddress}</p>
                    <div className="company-contact">
                      <span>Phone: <strong>{bDetails.businessPhone}</strong></span>
                      <span>Email: <strong>{bDetails.businessEmail}</strong></span>
                    </div>
                    <div className="company-contact">
                      <span>GSTIN: <strong>{bDetails.businessGST}</strong></span>
                      <span>State: <strong>{bDetails.businessState}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="invoice-meta-info">
                  <div className="meta-row"><span>Invoice No.:</span> <strong>{bill.invoiceNo}</strong></div>
                  <div className="meta-row"><span>Date:</span> <strong>{new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</strong></div>
                  <div className="meta-row"><span>Place Of Supply:</span> <strong>{bill.customerState || bDetails.businessState}</strong></div>
                </div>
              </div>

              {/* Bill To */}
              <div className="invoice-bill-to">
                <div className="bill-to-title">Bill To:</div>
                <h2>{bill.customerName}</h2>
                {bill.customerAddress && <p>{bill.customerAddress}</p>}
                {bill.customerPhone && <p>Ph: {bill.customerPhone}</p>}
                {bill.customerEmail && <p>Email: {bill.customerEmail}</p>}
                
                <div className="customer-gst-info">
                  <span>GSTIN: <strong>{bill.customerGSTIN || 'Unregistered'}</strong></span>
                  <span>State: <strong>{bill.customerState || '-'}</strong></span>
                </div>
              </div>

              {/* Items Table */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{width: '40px'}}>#</th>
                    <th style={{textAlign: 'left'}}>Item name</th>
                    <th style={{width: '100px'}}>HSN/ SAC</th>
                    <th style={{width: '90px', textAlign:'right'}}>Quantity</th>
                    <th style={{width: '80px', textAlign:'center'}}>Unit</th>
                    <th style={{width: '130px', textAlign:'right'}}>Price/ Unit(₹)</th>
                    <th style={{width: '150px', textAlign:'right'}}>GST(₹)</th>
                    <th style={{width: '150px', textAlign:'right'}}>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{textAlign: 'center'}}>{i + 1}</td>
                      <td style={{textAlign: 'left'}}><strong>{item.name}</strong></td>
                      <td style={{textAlign: 'center'}}>{item.hsn || '-'}</td>
                      <td style={{textAlign: 'right'}}>{item.quantity}</td>
                      <td style={{textAlign: 'center'}}>{item.unit || '-'}</td>
                      <td style={{textAlign: 'right'}}>{formatCurrency(item.price).replace('₹', '')}</td>
                      <td style={{textAlign: 'right'}}>{formatCurrency(item.gstAmt).replace('₹', '')} <span style={{fontSize:'0.75rem'}}>({item.gst}%)</span></td>
                      <td style={{textAlign: 'right'}}><strong>{formatCurrency(item.taxable).replace('₹', '₹ ')}</strong></td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="items-total-row">
                    <td></td>
                    <td style={{textAlign: 'left'}}><strong>Total</strong></td>
                    <td></td>
                    <td style={{textAlign: 'right'}}><strong>{totalQuantity}</strong></td>
                    <td></td>
                    <td></td>
                    <td style={{textAlign: 'right'}}><strong>{formatCurrency(totalGST).replace('₹', '₹ ')}</strong></td>
                    <td style={{textAlign: 'right'}}><strong>{formatCurrency(subTotal).replace('₹', '₹ ')}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Amount Summary */}
              <div className="amount-summary">
                <div className="sub-total-box">
                  <span>Sub Total: <strong>{formatCurrency(subTotal).replace('₹', '₹ ')}</strong></span>
                </div>
                <div className="total-words-box">
                  <span>Total: <strong>{formatCurrency(grandTotal).replace('₹', '₹ ')}</strong> ({numberToWords(grandTotal)} Rupees only)</span>
                </div>
              </div>

              {/* Received & Balance */}
              <div className="payment-summary">
                <div className="received-box">
                  <span>Received: <strong>{formatCurrency(bill.receivedAmount || 0).replace('₹', '₹ ')}</strong></span>
                </div>
                <div className="balance-box">
                  <span>Balance: <strong>{formatCurrency((grandTotal) - (bill.receivedAmount||0)).replace('₹', '₹ ')}</strong></span>
                </div>
              </div>

              {/* Tax Breakup & Bank */}
              <div className="bottom-split-row">
                <div className="tax-breakup-wrapper">
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th rowSpan="2">HSN/ SAC</th>
                        <th rowSpan="2">Taxable amount<br/>(₹)</th>
                        {isInterState ? (
                          <th colSpan="2">IGST</th>
                        ) : (
                          <>
                            <th colSpan="2">CGST</th>
                            <th colSpan="2">SGST</th>
                          </>
                        )}
                        <th rowSpan="2">Total Tax (₹)</th>
                      </tr>
                      <tr>
                        {isInterState ? (
                          <>
                            <th style={{borderLeft: '1px solid #000'}}>Rate (%)</th>
                            <th>Amt (₹)</th>
                          </>
                        ) : (
                          <>
                            <th style={{borderLeft: '1px solid #000'}}>Rate (%)</th>
                            <th>Amt (₹)</th>
                            <th>Rate (%)</th>
                            <th>Amt (₹)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {taxRows.length > 0 ? taxRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{textAlign: 'center'}}>{r.hsn}</td>
                          <td style={{textAlign: 'right'}}>{r.taxable.toFixed(2)}</td>
                          {isInterState ? (
                            <>
                              <td style={{textAlign: 'center'}}>{r.igstRate}</td>
                              <td style={{textAlign: 'right'}}>{r.igstAmt.toFixed(2)}</td>
                            </>
                          ) : (
                            <>
                              <td style={{textAlign: 'center'}}>{r.cgstRate}</td>
                              <td style={{textAlign: 'right'}}>{r.cgstAmt.toFixed(2)}</td>
                              <td style={{textAlign: 'center'}}>{r.sgstRate}</td>
                              <td style={{textAlign: 'right'}}>{r.sgstAmt.toFixed(2)}</td>
                            </>
                          )}
                          <td style={{textAlign: 'right'}}>{r.totalTax.toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={isInterState ? 5 : 7} style={{textAlign: 'center'}}>No GST Applied</td>
                        </tr>
                      )}
                      {taxRows.length > 0 && (
                        <tr style={{fontWeight: 'bold'}}>
                          <td style={{textAlign: 'right'}}>TOTAL</td>
                          <td style={{textAlign: 'right'}}>{totalTaxableTax.toFixed(2)}</td>
                          {isInterState ? (
                            <>
                              <td></td>
                              <td style={{textAlign: 'right'}}>{totalIgstTax.toFixed(2)}</td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td style={{textAlign: 'right'}}>{totalCgstTax.toFixed(2)}</td>
                              <td></td>
                              <td style={{textAlign: 'right'}}>{totalSgstTax.toFixed(2)}</td>
                            </>
                          )}
                          <td style={{textAlign: 'right'}}>{totalTaxAll.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bank-details-wrapper">
                  <div className="bank-line"><span>Bank Name :</span> <strong>{bDetails.bankName || 'INDIAN BANK, MUTT STREET'}</strong></div>
                  <div className="bank-line"><span>Bank Account No. :</span> <strong>{bDetails.bankAccount || '7513201456'}</strong></div>
                  <div className="bank-line"><span>Bank IFSC code :</span> <strong>{bDetails.bankIFSC || 'IDIB000M138'}</strong></div>
                  <div className="bank-line"><span>Account holder's name :</span> <strong>{bDetails.bankHolder || 'SRM AGENCIES'}</strong></div>
                </div>
              </div>

              {/* Footer */}
              <div className="invoice-footer-blocks">
                <div className="terms-block">
                  <strong>Terms & Conditions:</strong>
                  <p>Thanks for doing business with us!</p>
                </div>
                <div className="signature-block">
                  <div className="auth-for">For <strong>{bDetails.businessName || 'SRM AGENCIES'}</strong>:</div>
                  <div className="auth-sign">Authorized Signatory</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
