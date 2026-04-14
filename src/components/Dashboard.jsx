import { useState, useEffect, useRef } from 'react';
import { generateInvoiceNo, formatCurrency, getCatalog, saveToCatalog } from '../utils/storage';
import './Dashboard.css';

const DEFAULT_ITEM = { name: '', quantity: 1, price: 0, gst: 0 };

export default function Dashboard({ businessSettings, onSaveSettings, onGenerateBill, toast }) {
  const [items, setItems] = useState([{ ...DEFAULT_ITEM, id: Date.now() }]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(businessSettings);
  const [catalog, setCatalog] = useState(() => getCatalog());
  
  const currentInvoiceNo = useRef(generateInvoiceNo());
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price * (1 + (Number(item.gst) || 0) / 100)), 0);

  const handleAddItem = () => {
    setItems([...items, { ...DEFAULT_ITEM, id: Date.now() }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: field === 'name' ? value : Number(value) || 0 };
      
      if (field === 'name') {
        const catalogItem = catalog.find(c => c.name.toLowerCase() === value.toLowerCase());
        if (catalogItem) {
          updatedItem.price = catalogItem.price;
          updatedItem.gst = catalogItem.gst;
        }
      }
      return updatedItem;
    }));
  };

  const handleSaveItemToCatalog = (item) => {
    if (!item.name) return toast.error('Item name is required to save.');
    const updated = saveToCatalog({ name: item.name, price: Number(item.price) || 0, gst: Number(item.gst) || 0 });
    setCatalog(updated);
    toast.success('Item saved to catalog');
  };

  const handleSaveSettings = () => {
    onSaveSettings(tempSettings);
    setIsEditingSettings(false);
    toast.success('Business details updated');
  };

  const handleGenerate = () => {
    if (items.some(i => !i.name || i.quantity <= 0 || i.price <= 0)) {
      toast.error('Please fill all item details correctly.');
      return;
    }
    
    const billData = {
      customerName: customerName || 'Cash Customer',
      customerPhone,
      items: items.map(({ id, ...rest }) => rest), // Remove internal id
      totalAmount,
      businessDetails: businessSettings,
    };
    
    onGenerateBill(billData);
    
    // Reset form
    setItems([{ ...DEFAULT_ITEM, id: Date.now() }]);
    setCustomerName('');
    setCustomerPhone('');
    currentInvoiceNo.current = generateInvoiceNo();
  };

  return (
    <div className="dashboard animate-fade">
      <div className="dashboard-header card">
        <div className="header-top">
          {isEditingSettings ? (
            <div className="settings-edit-wrapper animate-slide-up">
              <div className="settings-fields">
                <div className="input-group-inline">
                  <span className="field-label">Name</span>
                  <input
                    className="input font-bold"
                    value={tempSettings.businessName}
                    onChange={e => setTempSettings({...tempSettings, businessName: e.target.value})}
                    placeholder="Business Name"
                  />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">Place</span>
                  <input
                    className="input"
                    value={tempSettings.businessAddress}
                    onChange={e => setTempSettings({...tempSettings, businessAddress: e.target.value})}
                    placeholder="E.g. Main Road, City"
                  />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">Phone</span>
                  <input
                    className="input"
                    value={tempSettings.businessPhone}
                    onChange={e => setTempSettings({...tempSettings, businessPhone: e.target.value})}
                    placeholder="E.g. +91 99999 00000"
                  />
                </div>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>Save Details</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingSettings(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="business-info">
              <div className="business-details-text">
                <h2>{businessSettings.businessName}</h2>
                <p className="business-subtext">
                  {businessSettings.businessAddress} {businessSettings.businessPhone && `• ${businessSettings.businessPhone}`}
                </p>
              </div>
              <button className="edit-btn" onClick={() => setIsEditingSettings(true)} title="Edit Business Info">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <div className="invoice-meta">
            <div className="meta-item">
              <span>Invoice No</span>
              <strong>{currentInvoiceNo.current}</strong>
            </div>
            <div className="meta-item">
              <span>Date</span>
              <strong>{currentDate}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="customer-section card">
        <h3>Customer Details <span className="optional">(Optional)</span></h3>
        <div className="customer-grid">
          <input
            className="input"
            placeholder="Customer Name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="items-section card">
        <div className="items-header">
          <h3>Items</h3>
          <button className="btn btn-ghost btn-sm" onClick={handleAddItem}>
             <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <datalist id="item-catalog">
          {catalog.map(c => <option key={c.name} value={c.name} />)}
        </datalist>

        <div className="items-list">
          <div className="items-row headers">
            <div className="col-name">Description</div>
            <div className="col-qty">Req Qty</div>
            <div className="col-price">Rate</div>
            <div className="col-gst">GST %</div>
            <div className="col-total">Total</div>
            <div className="col-action"></div>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="items-row item-enter">
              <div className="col-name">
                <input
                  className="input"
                  placeholder="E.g., M-Sand, 40mm Gravel..."
                  value={item.name}
                  list="item-catalog"
                  onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                  autoFocus={index === items.length - 1 && items.length > 1}
                />
              </div>
              <div className="col-qty">
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={item.quantity || ''}
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-price">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={item.price || ''}
                  onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="col-gst">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={item.gst || ''}
                  onChange={e => handleItemChange(item.id, 'gst', e.target.value)}
                  placeholder="%"
                />
              </div>
              <div className="col-total">
                <div className="total-display">
                  {formatCurrency(item.quantity * item.price * (1 + (Number(item.gst) || 0) / 100))}
                </div>
              </div>
              <div className="col-action col-action-group">
                <button 
                  className="btn btn-ghost icon-only action-save" 
                  onClick={() => handleSaveItemToCatalog(item)}
                  title="Save item to catalog"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
                <button 
                  className="btn btn-danger icon-only" 
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                  title="Remove item"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-section">
          <div className="summary-row grand-total">
            <span>Grand Total</span>
            <span className="amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="actions-section">
          <button 
            className="btn btn-primary btn-lg generate-btn"
            onClick={handleGenerate}
            disabled={totalAmount === 0}
          >
            Generate Bill
          </button>
        </div>
      </div>
    </div>
  );
}
