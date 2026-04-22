import { formatCurrency, formatDate } from '../utils/storage';
import './Sidebar.css';

export default function Sidebar({ bills, onSelectBill, selectedBillNo, isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo">
              <img src="/logo.jpg" alt="Tamizhan Groups" width="40" height="40" style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div>
              <h2>Recent Bills</h2>
              <span className="badge">{bills.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm close-drawer-btn" title="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          {bills.length === 0 ? (
            <div className="empty-state">
              <p>No bills generated yet.</p>
            </div>
          ) : (
            <ul className="bill-list">
              {bills.map((bill, i) => (
                <li
                  key={bill.invoiceNo}
                  className={`bill-item animate-slide-in-right ${selectedBillNo === bill.invoiceNo ? 'active' : ''}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => onSelectBill(bill)}
                >
                  <div className="bill-item-header">
                    <span className="invoice-no">{bill.invoiceNo}</span>
                    <span className="bill-total">{formatCurrency(bill.totalAmount)}</span>
                  </div>
                  <div className="bill-item-footer">
                    <span className="bill-date">{formatDate(bill.createdAt)}</span>
                    <span className="bill-items">{bill.items.length} items</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
