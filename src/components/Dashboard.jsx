import { useState, useEffect, useRef } from 'react';
import { generateInvoiceNo, formatCurrency, getCatalog, saveToCatalog, deleteFromCatalog } from '../utils/storage';
import './Dashboard.css';

const DEFAULT_ITEM = { name: '', hsn: '', quantity: 1, unit: 'unit', price: 0, gst: 0 };

export default function Dashboard({ 
  businessSettings, onSaveSettings, onGenerateBill, toast, onToggleDrawer,
  isEditingSettings, setIsEditingSettings, isCatalogOpen, setIsCatalogOpen 
}) {
  const [items, setItems] = useState([{ ...DEFAULT_ITEM, id: Date.now() }]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [taxType, setTaxType] = useState('CGST/SGST');
  const [receivedAmount, setReceivedAmount] = useState('');
  
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', hsn: '', price: '', gst: '' });
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
      
      const updatedItem = { ...item, [field]: field === 'name' || field === 'hsn' || field === 'unit' ? value : Number(value) || 0 };
      
      if (field === 'name') {
        const catalogItem = catalog.find(c => c.name.toLowerCase() === value.toLowerCase());
        if (catalogItem) {
          updatedItem.price = catalogItem.price;
          updatedItem.gst = catalogItem.gst;
          updatedItem.hsn = catalogItem.hsn || '';
        }
      }
      return updatedItem;
    }));
  };

  const handleAddCatalogItem = () => {
    if (!newCatalogItem.name) return toast.error('Item name is required.');
    const updated = saveToCatalog({ 
      name: newCatalogItem.name, 
      hsn: newCatalogItem.hsn || '',
      price: Number(newCatalogItem.price) || 0, 
      gst: Number(newCatalogItem.gst) || 0 
    });
    setCatalog(updated);
    setNewCatalogItem({ name: '', hsn: '', price: '', gst: '' });
    toast.success('Item added to catalog');
  };

  const handleRemoveCatalogItem = (name) => {
    setCatalog(deleteFromCatalog(name));
    toast.success('Item removed from catalog');
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
      customerEmail,
      customerAddress,
      customerGSTIN,
      customerState,
      taxType,
      items: items.map(({ id, ...rest }) => rest), // Remove internal id
      totalAmount,
      receivedAmount: Number(receivedAmount) || 0,
      balanceAmount: totalAmount - (Number(receivedAmount) || 0),
      businessDetails: businessSettings,
    };
    
    onGenerateBill(billData);
    
    // Reset form
    setItems([{ ...DEFAULT_ITEM, id: Date.now() }]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerGSTIN('');
    setCustomerState('');
    setTaxType('CGST/SGST');
    setReceivedAmount('');
    currentInvoiceNo.current = generateInvoiceNo();
  };

  return (
    <div className="dashboard animate-fade">
      <div className="dashboard-header card">
        <div className="header-top">
          <button className="btn btn-ghost btn-sm drawer-toggle-btn" onClick={onToggleDrawer}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
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
                <div className="input-group-inline">
                  <span className="field-label">Email</span>
                  <input
                    className="input"
                    type="email"
                    value={tempSettings.businessEmail || ''}
                    onChange={e => setTempSettings({...tempSettings, businessEmail: e.target.value})}
                    placeholder="E.g. example@gmail.com"
                  />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">GSTIN</span>
                  <input
                    className="input"
                    value={tempSettings.businessGST || ''}
                    onChange={e => setTempSettings({...tempSettings, businessGST: e.target.value})}
                    placeholder="E.g. 33AAAAA0000A1Z5"
                  />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">State</span>
                  <input
                    className="input"
                    value={tempSettings.businessState || ''}
                    onChange={e => setTempSettings({...tempSettings, businessState: e.target.value})}
                    placeholder="E.g. Tamil Nadu"
                  />
                </div>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <div className="input-group-inline">
                  <span className="field-label">Bank Name</span>
                  <input className="input" value={tempSettings.bankName || ''} onChange={e => setTempSettings({...tempSettings, bankName: e.target.value})} placeholder="E.g. STATE BANK OF INDIA" />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">Account No</span>
                  <input className="input" value={tempSettings.bankAccount || ''} onChange={e => setTempSettings({...tempSettings, bankAccount: e.target.value})} placeholder="E.g. 1234567890" />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">IFSC Code</span>
                  <input className="input" value={tempSettings.bankIFSC || ''} onChange={e => setTempSettings({...tempSettings, bankIFSC: e.target.value})} placeholder="E.g. SBIN0001234" />
                </div>
                <div className="input-group-inline">
                  <span className="field-label">A/C Holder</span>
                  <input className="input" value={tempSettings.bankHolder || ''} onChange={e => setTempSettings({...tempSettings, bankHolder: e.target.value})} placeholder="E.g. Tamizhan Groups" />
                </div>
                <div className="input-group-inline checkbox-group" style={{ marginTop: '0.5rem' }}>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={tempSettings.enableGST || false}
                      onChange={e => setTempSettings({...tempSettings, enableGST: e.target.checked})}
                    />
                    Enable Indian GST Format
                  </label>
                </div>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>Save Details</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingSettings(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="business-info">
              <div className="business-logo">
                <img src="/logo.png" alt="Tamizhan Groups Logo" width="50" height="50" style={{ borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <div className="business-details-text">
                <h2>{businessSettings.businessName}</h2>
                <p className="business-subtext">
                  {businessSettings.businessAddress} {businessSettings.businessPhone && `• ${businessSettings.businessPhone}`}
                </p>
              </div>
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
          <input
            className="input"
            placeholder="Email Address"
            type="email"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
          />
          {businessSettings.enableGST && (
            <>
              <input
                className="input"
                placeholder="Address"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
              />
              <input
                className="input"
                placeholder="GSTIN (If Registered)"
                value={customerGSTIN}
                onChange={e => setCustomerGSTIN(e.target.value)}
              />
              <input
                className="input"
                placeholder="State / Place of Supply"
                value={customerState}
                onChange={e => setCustomerState(e.target.value)}
              />
              <select
                className="input"
                value={taxType}
                onChange={e => setTaxType(e.target.value)}
                style={{ appearance: 'auto', cursor: 'pointer', color: taxType ? 'initial' : 'var(--light-gray)' }}
                title="Tax Type"
              >
                <option value="CGST/SGST">CGST & SGST Split</option>
                <option value="No GST">No GST</option>
              </select>
            </>
          )}
        </div>
      </div>

      <div className="items-section card">
        <div className="items-header">
          <h3>Items</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsCatalogOpen(true)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Manage Catalog
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleAddItem}>
               <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>

        <datalist id="item-catalog">
          {catalog.map(c => <option key={c.name} value={c.name} />)}
        </datalist>

        <div className="items-list">
          <div className={`items-row headers ${businessSettings.enableGST && taxType !== 'No GST' ? 'items-row-full' : 'items-row-simple'}`}>
            <div className="col-name">Description</div>
            {businessSettings.enableGST && taxType !== 'No GST' && <div className="col-hsn">HSN/SAC</div>}
            <div className="col-qty">Req Qty</div>
            <div className="col-unit">Unit</div>
            <div className="col-price">Rate</div>
            {taxType !== 'No GST' && <div className="col-gst">GST %</div>}
            <div className="col-total">Total</div>
            <div className="col-action"></div>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className={`items-row item-enter ${businessSettings.enableGST && taxType !== 'No GST' ? 'items-row-full' : 'items-row-simple'}`}>
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
              {businessSettings.enableGST && taxType !== 'No GST' && (
                <div className="col-hsn">
                  <input
                    className="input"
                    placeholder="HSN"
                    value={item.hsn || ''}
                    onChange={e => handleItemChange(item.id, 'hsn', e.target.value)}
                  />
                </div>
              )}
              <div className="col-qty">
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={item.quantity || ''}
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-unit">
                <input
                  className="input"
                  placeholder="Unit"
                  value={item.unit || ''}
                  onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
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
              {taxType !== 'No GST' && (
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
              )}
              <div className="col-total">
                <div className="total-display">
                  {formatCurrency(item.quantity * item.price * (1 + (taxType !== 'No GST' ? (Number(item.gst) || 0) : 0) / 100))}
                </div>
              </div>
              <div className="col-action col-action-group">
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
          <div className="payment-input card">
            <span style={{ fontWeight: 600 }}>Received Amount (₹):</span>
            <input 
              type="number" 
              min="0" 
              className="input" 
              style={{ width: '150px' }}
              value={receivedAmount} 
              onChange={e => setReceivedAmount(e.target.value)} 
              placeholder="0.00"
            />
          </div>
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

      {isCatalogOpen && (
        <div className="modal-overlay animate-fade">
          <div className="modal-container animate-slide-up" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Manage Item Catalog</h2>
              <div className="modal-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setIsCatalogOpen(false)}>Close</button>
              </div>
            </div>
            <div className="modal-body">
              <div className={`catalog-form ${businessSettings.enableGST && taxType !== 'No GST' ? 'catalog-form-full' : 'catalog-form-simple'}`}>
                <input className="input" placeholder="Item Name" value={newCatalogItem.name} onChange={e => setNewCatalogItem({...newCatalogItem, name: e.target.value})} />
                {businessSettings.enableGST && taxType !== 'No GST' && <input className="input" placeholder="HSN/SAC" value={newCatalogItem.hsn} onChange={e => setNewCatalogItem({...newCatalogItem, hsn: e.target.value})} />}
                <input type="number" min="0" className="input" placeholder="Rate" value={newCatalogItem.price} onChange={e => setNewCatalogItem({...newCatalogItem, price: e.target.value})} />
                {taxType !== 'No GST' && <input type="number" min="0" className="input" placeholder="GST %" value={newCatalogItem.gst} onChange={e => setNewCatalogItem({...newCatalogItem, gst: e.target.value})} />}
                <button className="btn btn-primary" onClick={handleAddCatalogItem}>Add Item</button>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="invoice-table" style={{ marginBottom: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      {businessSettings.enableGST && taxType !== 'No GST' && <th>HSN/SAC</th>}
                      <th className="text-right">Price</th>
                      {taxType !== 'No GST' && <th className="text-right">GST %</th>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.length === 0 && <tr><td colSpan={businessSettings.enableGST && taxType !== 'No GST' ? 5 : 4} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No items saved to catalog yet.</td></tr>}
                    {catalog.map(c => (
                       <tr key={c.name}>
                         <td>{c.name}</td>
                         {businessSettings.enableGST && taxType !== 'No GST' && <td>{c.hsn || '-'}</td>}
                         <td className="text-right">{formatCurrency(c.price)}</td>
                         {taxType !== 'No GST' && <td className="text-right">{c.gst ? `${c.gst}%` : '-'}</td>}
                         <td className="text-right">
                           <button className="btn btn-danger btn-sm" style={{padding: '4px 8px'}} onClick={() => handleRemoveCatalogItem(c.name)}>Del</button>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
