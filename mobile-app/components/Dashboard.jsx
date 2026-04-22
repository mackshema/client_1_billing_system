import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  FlatList
} from 'react-native';
import { generateInvoiceNo, formatCurrency, getCatalog, saveToCatalog, deleteFromCatalog } from '../utils/storage';

const DEFAULT_ITEM = { name: '', hsn: '', quantity: 1, unit: 'unit', price: 0, gst: 0 };

export default function Dashboard({ businessSettings, onSaveSettings, onGenerateBill, toast, onToggleDrawer }) {
  const [items, setItems] = useState([{ ...DEFAULT_ITEM, id: Date.now() }]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [taxType, setTaxType] = useState('CGST/SGST');
  const [receivedAmount, setReceivedAmount] = useState('');
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', hsn: '', price: '', gst: '' });
  const [tempSettings, setTempSettings] = useState(businessSettings);
  const [catalog, setCatalog] = useState([]);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  useEffect(() => {
    loadCatalog();
    loadInvoiceNo();
  }, []);

  const loadCatalog = async () => {
    const cat = await getCatalog();
    setCatalog(cat);
  };

  const loadInvoiceNo = async () => {
    const invNo = await generateInvoiceNo();
    setCurrentInvoiceNo(invNo);
  };

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

  const handleAddCatalogItem = async () => {
    if (!newCatalogItem.name) {
      Alert.alert('Error', 'Item name is required.');
      return;
    }
    const updated = await saveToCatalog({ 
      name: newCatalogItem.name, 
      hsn: newCatalogItem.hsn || '',
      price: Number(newCatalogItem.price) || 0, 
      gst: Number(newCatalogItem.gst) || 0 
    });
    setCatalog(updated);
    setNewCatalogItem({ name: '', hsn: '', price: '', gst: '' });
    Alert.alert('Success', 'Item added to catalog');
  };

  const handleRemoveCatalogItem = async (name) => {
    const updated = await deleteFromCatalog(name);
    setCatalog(updated);
    Alert.alert('Success', 'Item removed from catalog');
  };

  const handleSaveSettings = async () => {
    await onSaveSettings(tempSettings);
    setIsEditingSettings(false);
    Alert.alert('Success', 'Business details updated');
  };

  const handleGenerate = async () => {
    if (items.some(i => !i.name || i.quantity <= 0 || i.price <= 0)) {
      Alert.alert('Error', 'Please fill all item details correctly.');
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
      items: items.map(({ id, ...rest }) => rest),
      totalAmount,
      receivedAmount: Number(receivedAmount) || 0,
      balanceAmount: totalAmount - (Number(receivedAmount) || 0),
      businessDetails: businessSettings,
    };
    
    await onGenerateBill(billData);
    
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
    const newInvNo = await generateInvoiceNo();
    setCurrentInvoiceNo(newInvNo);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.drawerButton} onPress={onToggleDrawer}>
            <Text style={styles.drawerButtonText}>☰ Recent Bills</Text>
          </TouchableOpacity>
          
          {isEditingSettings ? (
            <View style={styles.settingsEditWrapper}>
              <View style={styles.settingsFields}>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={[styles.input, styles.boldInput]}
                    value={tempSettings.businessName}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessName: text})}
                    placeholder="Business Name"
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Place</Text>
                  <TextInput
                    style={styles.input}
                    value={tempSettings.businessAddress}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessAddress: text})}
                    placeholder="E.g. Main Road, City"
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={tempSettings.businessPhone}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessPhone: text})}
                    placeholder="E.g. +91 99999 00000"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={tempSettings.businessEmail || ''}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessEmail: text})}
                    placeholder="E.g. example@gmail.com"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>GSTIN</Text>
                  <TextInput
                    style={styles.input}
                    value={tempSettings.businessGST || ''}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessGST: text})}
                    placeholder="E.g. 33AAAAA0000A1Z5"
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={tempSettings.businessState || ''}
                    onChangeText={(text) => setTempSettings({...tempSettings, businessState: text})}
                    placeholder="E.g. Tamil Nadu"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput style={styles.input} value={tempSettings.bankName || ''} onChangeText={(text) => setTempSettings({...tempSettings, bankName: text})} placeholder="E.g. STATE BANK OF INDIA" />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>Account No</Text>
                  <TextInput style={styles.input} value={tempSettings.bankAccount || ''} onChangeText={(text) => setTempSettings({...tempSettings, bankAccount: text})} placeholder="E.g. 1234567890" keyboardType="numeric" />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>IFSC Code</Text>
                  <TextInput style={styles.input} value={tempSettings.bankIFSC || ''} onChangeText={(text) => setTempSettings({...tempSettings, bankIFSC: text})} placeholder="E.g. SBIN0001234" />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.fieldLabel}>A/C Holder</Text>
                  <TextInput style={styles.input} value={tempSettings.bankHolder || ''} onChangeText={(text) => setTempSettings({...tempSettings, bankHolder: text})} placeholder="E.g. Tamizhan Groups" />
                </View>
                <View style={[styles.inputGroupInline, styles.checkboxGroup]}>
                  <TouchableOpacity 
                    style={styles.checkboxLabel}
                    onPress={() => setTempSettings({...tempSettings, enableGST: !tempSettings.enableGST})}
                  >
                    <View style={[styles.checkbox, tempSettings.enableGST && styles.checkboxChecked]}>
                      {tempSettings.enableGST && <Text style={styles.checkboxText}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabelText}>Enable Indian GST Format</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.settingsActions}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveSettings}>
                  <Text style={styles.btnPrimaryText}>Save Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setIsEditingSettings(false)}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.businessInfo}>
              <View style={styles.businessLogo}>
                <Text style={styles.logoPlaceholder}>TG</Text>
              </View>
              <View style={styles.businessDetailsText}>
                <Text style={styles.businessName}>{businessSettings.businessName}</Text>
                <Text style={styles.businessSubtext}>
                  {businessSettings.businessAddress} {businessSettings.businessPhone ? `• ${businessSettings.businessPhone}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditingSettings(true)}>
                <Text style={styles.editBtnText}>✎</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.invoiceMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Invoice No</Text>
              <Text style={styles.metaValue}>{currentInvoiceNo}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{currentDate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Details <Text style={styles.optional}>(Optional)</Text></Text>
        <View style={styles.customerGrid}>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
          />
          {businessSettings.enableGST && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="GSTIN (If Registered)"
                value={customerGSTIN}
                onChangeText={setCustomerGSTIN}
              />
              <TextInput
                style={styles.input}
                placeholder="State / Place of Supply"
                value={customerState}
                onChangeText={setCustomerState}
              />
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerText}>{taxType}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.itemsHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.btnGhostSmall} onPress={() => setIsCatalogOpen(true)}>
              <Text style={styles.btnGhostSmallText}>📦 Manage Catalog</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhostSmall} onPress={handleAddItem}>
              <Text style={styles.btnGhostSmallText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemsList}>
          <View style={[styles.itemsRow, styles.headers]}>
            <Text style={styles.colName}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colPrice}>Rate</Text>
            <Text style={styles.colTotal}>Total</Text>
            <Text style={styles.colAction}></Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemsRow}>
              <View style={styles.colName}>
                <TextInput
                  style={styles.input}
                  placeholder="E.g., M-Sand, 40mm Gravel..."
                  value={item.name}
                  onChangeText={(text) => handleItemChange(item.id, 'name', text)}
                />
              </View>
              <View style={styles.colQty}>
                <TextInput
                  style={styles.input}
                  value={String(item.quantity)}
                  onChangeText={(text) => handleItemChange(item.id, 'quantity', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.colUnit}>
                <TextInput
                  style={styles.input}
                  placeholder="Unit"
                  value={item.unit || ''}
                  onChangeText={(text) => handleItemChange(item.id, 'unit', text)}
                />
              </View>
              <View style={styles.colPrice}>
                <TextInput
                  style={styles.input}
                  value={String(item.price)}
                  onChangeText={(text) => handleItemChange(item.id, 'price', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.totalDisplay}>
                  {formatCurrency(item.quantity * item.price * (1 + (Number(item.gst) || 0) / 100))}
                </Text>
              </View>
              <View style={styles.colAction}>
                <TouchableOpacity 
                  style={styles.btnDanger} 
                  onPress={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Text style={styles.btnDangerText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={[styles.card, styles.paymentInput]}>
            <Text style={styles.paymentLabel}>Received Amount (₹):</Text>
            <TextInput 
              style={[styles.input, styles.receivedInput]}
              value={receivedAmount} 
              onChangeText={setReceivedAmount} 
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text style={styles.summaryLabel}>Grand Total</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.btnPrimary, styles.generateBtn, totalAmount === 0 && styles.btnDisabled]}
            onPress={handleGenerate}
            disabled={totalAmount === 0}
          >
            <Text style={styles.btnPrimaryText}>Generate Bill</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isCatalogOpen}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Item Catalog</Text>
              <TouchableOpacity style={styles.btnClose} onPress={() => setIsCatalogOpen(false)}>
                <Text style={styles.btnCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.catalogForm}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Item Name" 
                  value={newCatalogItem.name} 
                  onChangeText={(text) => setNewCatalogItem({...newCatalogItem, name: text})} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Rate" 
                  value={newCatalogItem.price} 
                  onChangeText={(text) => setNewCatalogItem({...newCatalogItem, price: text})}
                  keyboardType="numeric"
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="GST %" 
                  value={newCatalogItem.gst} 
                  onChangeText={(text) => setNewCatalogItem({...newCatalogItem, gst: text})}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={handleAddCatalogItem}>
                  <Text style={styles.btnPrimaryText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.catalogList}>
                {catalog.length === 0 && (
                  <Text style={styles.emptyCatalog}>No items saved to catalog yet.</Text>
                )}
                {catalog.map(c => (
                  <View key={c.name} style={styles.catalogItem}>
                    <View style={styles.catalogItemInfo}>
                      <Text style={styles.catalogItemName}>{c.name}</Text>
                      <Text style={styles.catalogItemPrice}>{formatCurrency(c.price)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.btnDangerSmall} 
                      onPress={() => handleRemoveCatalogItem(c.name)}
                    >
                      <Text style={styles.btnDangerSmallText}>Del</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    gap: 16,
  },
  drawerButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  drawerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsEditWrapper: {
    gap: 12,
  },
  settingsFields: {
    gap: 12,
  },
  inputGroupInline: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  boldInput: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
  },
  checkboxText: {
    color: '#fff',
    fontSize: 12,
  },
  checkboxLabelText: {
    fontWeight: '600',
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnPrimary: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  btnGhostText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  businessLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  businessDetailsText: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  businessSubtext: {
    fontSize: 12,
    color: '#666',
  },
  editBtn: {
    padding: 8,
  },
  editBtnText: {
    fontSize: 18,
    color: '#666',
  },
  invoiceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optional: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
  },
  customerGrid: {
    gap: 12,
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btnGhostSmall: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  btnGhostSmallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsList: {
    gap: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headers: {
    marginBottom: 8,
  },
  colName: {
    flex: 2,
  },
  colQty: {
    flex: 1,
  },
  colUnit: {
    flex: 1,
  },
  colPrice: {
    flex: 1,
  },
  colTotal: {
    flex: 1,
  },
  colAction: {
    flex: 0.5,
    alignItems: 'center',
  },
  totalDisplay: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnDanger: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
  },
  btnDangerText: {
    fontSize: 16,
  },
  summarySection: {
    marginTop: 16,
    gap: 12,
  },
  paymentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontWeight: '600',
  },
  receivedInput: {
    width: 120,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#1976d2',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  actionsSection: {
    marginTop: 16,
  },
  generateBtn: {
    padding: 16,
  },
  btnDisabled: {
    backgroundColor: '#b0bec5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnClose: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  btnCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  catalogForm: {
    gap: 12,
    marginBottom: 16,
  },
  catalogList: {
    maxHeight: 300,
  },
  emptyCatalog: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  catalogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  catalogItemInfo: {
    flex: 1,
  },
  catalogItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  catalogItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  btnDangerSmall: {
    backgroundColor: '#ffebee',
    padding: 6,
    borderRadius: 4,
  },
  btnDangerSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c62828',
  },
});
