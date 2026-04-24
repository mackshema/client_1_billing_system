import { formatCurrency, formatDate } from '../utils/storage';
import './Dashboard.css'; // Reusing some modal styles

export default function RecentBills({ bills, onSelectBill, selectedBillNo, onClose }) {
  return (
    <div className="modal-overlay animate-fade">
      <div className="modal-container animate-slide-up" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-logo" style={{ background: 'var(--primary)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Recent Bills</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Showing last 20 generated invoices</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0 0 16px 0', maxHeight: '70vh', overflowY: 'auto' }}>
          {bills.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <p>No bills generated yet.</p>
            </div>
          ) : (
            <ul className="bill-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {bills.slice(0, 20).map((bill, i) => (
                <li
                  key={bill.invoiceNo}
                  className={`bill-item animate-slide-in-right ${selectedBillNo === bill.invoiceNo ? 'active' : ''}`}
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    backgroundColor: selectedBillNo === bill.invoiceNo ? '#f0f7ff' : 'transparent'
                  }}
                  onClick={() => onSelectBill(bill)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{bill.invoiceNo}</span>
                    <span style={{ fontWeight: 800 }}>{formatCurrency(bill.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                    <span>{formatDate(bill.createdAt)}</span>
                    <span>{bill.items.length} items • {bill.customerName || 'Cash Customer'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="modal-footer" style={{ padding: '12px 20px', background: '#f9f9f9', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Close Window</button>
        </div>
      </div>
    </div>
  );
}
