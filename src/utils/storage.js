import CryptoJS from 'crypto-js';

const BILLS_KEY = 'gravelsand_bills';
const AUTH_KEY = 'gravelsand_auth';
const SETTINGS_KEY = 'gravelsand_settings';
const CATALOG_KEY = 'gravelsand_catalog';
const MAX_BILLS = 15;

// This should ideally be in an environment variable, but for a standalone local app, 
// using a consistent hash of a internal string provides basic local encryption.
const SECRET_KEY = 'srm_agencies_secure_storage_key_2024';

const encrypt = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (e) {
    // If decryption fails, it might be old plaintext data
    try { return JSON.parse(ciphertext); }
    catch { return null; }
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const CREDENTIALS = { username: 'admin', password: 'gravel123' };

export const getSession = () => decrypt(sessionStorage.getItem(AUTH_KEY));

export const setSession = (user) => sessionStorage.setItem(AUTH_KEY, encrypt(user));
export const clearSession = () => sessionStorage.removeItem(AUTH_KEY);
export const isAuthenticated = () => !!getSession();

// ── Catalog ───────────────────────────────────────────────────────────────────
export const getCatalog = () => decrypt(localStorage.getItem(CATALOG_KEY)) || [];

export const saveToCatalog = (item) => {
  const catalog = getCatalog();
  const existingIndex = catalog.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
  
  if (existingIndex >= 0) {
    catalog[existingIndex] = { ...catalog[existingIndex], price: item.price, gst: item.gst, hsn: item.hsn };
  } else {
    catalog.push({ name: item.name, price: item.price, gst: item.gst, hsn: item.hsn });
  }
  
  localStorage.setItem(CATALOG_KEY, encrypt(catalog));
  return catalog;
};

export const deleteFromCatalog = (name) => {
  const catalog = getCatalog().filter(i => i.name !== name);
  localStorage.setItem(CATALOG_KEY, encrypt(catalog));
  return catalog;
};

// ── Bills ─────────────────────────────────────────────────────────────────────
export const getBills = () => decrypt(localStorage.getItem(BILLS_KEY)) || [];

export const saveBill = (bill) => {
  const bills = getBills();
  const updated = [bill, ...bills].slice(0, MAX_BILLS);
  localStorage.setItem(BILLS_KEY, encrypt(updated));
  return updated;
};

export const deleteBill = (invoiceNo) => {
  const bills = getBills().filter(b => b.invoiceNo !== invoiceNo);
  localStorage.setItem(BILLS_KEY, encrypt(bills));
  return bills;
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => {
  return decrypt(localStorage.getItem(SETTINGS_KEY)) || {
    businessName: 'SRM AGENCIES',
    businessAddress: '27/2 mahaveer nagar ext Ullur Kumbakonam',
    businessPhone: '9488188707',
    businessEmail: 'srmharinitravels@gmail.com',
    businessGST: '33BKQPN1414G1ZB',
    businessState: '33-Tamil Nadu',
    enableGST: true,
    bankName: 'INDIAN BANK, MUTT STREET',
    bankAccount: '7513201456',
    bankIFSC: 'IDIB000M138',
    bankHolder: 'SRM AGENCIES'
  };
};

export const saveSettings = (settings) =>
  localStorage.setItem(SETTINGS_KEY, encrypt(settings));

// ── Invoice Number ────────────────────────────────────────────────────────────
export const generateInvoiceNo = () => {
  const bills = getBills();
  const today = new Date();
  const year = today.getFullYear();
  const nextYear = String(year + 1).slice(-2);
  const finYear = today.getMonth() >= 3 ? `${year}-${nextYear}` : `${year - 1}-${String(year).slice(-2)}`;
  const seq = (bills.length + 1);
  return `${finYear}/${seq}`;
};

// ── Format ────────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

export const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str.trim();
};
