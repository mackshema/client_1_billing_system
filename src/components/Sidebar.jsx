import { formatCurrency, formatDate } from '../utils/storage';
import './Sidebar.css';

export default function Sidebar({ bills, onSelectBill, selectedBillNo, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="40" height="40">
              <rect width="200" height="200" rx="40" fill="#ffffff" />
              <g transform="translate(10, 80)">
                <text x="5" y="0" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="70" fill="#0056b3" letterSpacing="-2">SRM</text>
                <text x="10" y="30" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="20" fill="#0056b3" letterSpacing="3">AGENCIES</text>
              </g>
            </svg>
          </div>
          <div>
            <h2>Admin</h2>
            <p>Billing Panel</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-ghost btn-sm logout-btn" title="Logout">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-title">
          <h3>Recent Bills</h3>
          <span className="badge">{bills.length}</span>
        </div>

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
  );
}
