import AsyncStorage from '@react-native-async-storage/async-storage';

const BILLS_KEY = 'gravelsand_bills';
const AUTH_KEY = 'gravelsand_auth';
const SETTINGS_KEY = 'gravelsand_settings';
const CATALOG_KEY = 'gravelsand_catalog';
const MAX_BILLS = 15;

// Simple encryption for local storage
const SECRET_KEY = 'tamizhan_groups_secure_storage_key_2024';

const encrypt = (data) => {
  if (!data) return null;
  return JSON.stringify(data); // Simplified - no crypto-js in RN
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    return JSON.parse(ciphertext);
  } catch (e) {
    return null;
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const CREDENTIALS = { username: 'admin', password: 'gravel123' };

export const getSession = async () => {
  try {
    const session = await AsyncStorage.getItem(AUTH_KEY);
    return decrypt(session);
  } catch (e) {
    return null;
  }
};

export const setSession = async (user) => {
  try {
    await AsyncStorage.setItem(AUTH_KEY, encrypt(user));
  } catch (e) {
    console.error('Error saving session', e);
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (e) {
    console.error('Error clearing session', e);
  }
};

export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

// ── Catalog ───────────────────────────────────────────────────────────────────
export const getCatalog = async () => {
  try {
    const catalog = await AsyncStorage.getItem(CATALOG_KEY);
    return decrypt(catalog) || [];
  } catch (e) {
    return [];
  }
};

export const saveToCatalog = async (item) => {
  try {
    const catalog = await getCatalog();
    const existingIndex = catalog.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
    
    if (existingIndex >= 0) {
      catalog[existingIndex] = { ...catalog[existingIndex], price: item.price, gst: item.gst, hsn: item.hsn };
    } else {
      catalog.push({ name: item.name, price: item.price, gst: item.gst, hsn: item.hsn });
    }
    
    await AsyncStorage.setItem(CATALOG_KEY, encrypt(catalog));
    return catalog;
  } catch (e) {
    console.error('Error saving catalog', e);
    return [];
  }
};

export const deleteFromCatalog = async (name) => {
  try {
    const catalog = (await getCatalog()).filter(i => i.name !== name);
    await AsyncStorage.setItem(CATALOG_KEY, encrypt(catalog));
    return catalog;
  } catch (e) {
    console.error('Error deleting from catalog', e);
    return [];
  }
};

// ── Bills ─────────────────────────────────────────────────────────────────────
export const getBills = async () => {
  try {
    const bills = await AsyncStorage.getItem(BILLS_KEY);
    return decrypt(bills) || [];
  } catch (e) {
    return [];
  }
};

export const saveBill = async (bill) => {
  try {
    const bills = await getBills();
    const updated = [bill, ...bills].slice(0, MAX_BILLS);
    await AsyncStorage.setItem(BILLS_KEY, encrypt(updated));
    return updated;
  } catch (e) {
    console.error('Error saving bill', e);
    return [];
  }
};

export const deleteBill = async (invoiceNo) => {
  try {
    const bills = (await getBills()).filter(b => b.invoiceNo !== invoiceNo);
    await AsyncStorage.setItem(BILLS_KEY, encrypt(bills));
    return bills;
  } catch (e) {
    console.error('Error deleting bill', e);
    return [];
  }
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    return decrypt(settings) || {
      businessName: 'Tamizhan Groups',
      businessAddress: '27/2 mahaveer nagar ext Ullur Kumbakonam',
      businessPhone: '9488188707',
      businessEmail: 'srmharinitravels@gmail.com',
      businessGST: '33BKQPN1414G1ZB',
      businessState: '33-Tamil Nadu',
      enableGST: true,
      bankName: 'INDIAN BANK, MUTT STREET',
      bankAccount: '7513201456',
      bankIFSC: 'IDIB000M138',
      bankHolder: 'Tamizhan Groups'
    };
  } catch (e) {
    return {
      businessName: 'Tamizhan Groups',
      businessAddress: '27/2 mahaveer nagar ext Ullur Kumbakonam',
      businessPhone: '9488188707',
      businessEmail: 'srmharinitravels@gmail.com',
      businessGST: '33BKQPN1414G1ZB',
      businessState: '33-Tamil Nadu',
      enableGST: true,
      bankName: 'INDIAN BANK, MUTT STREET',
      bankAccount: '7513201456',
      bankIFSC: 'IDIB000M138',
      bankHolder: 'Tamizhan Groups'
    };
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, encrypt(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

// ── Invoice Number ────────────────────────────────────────────────────────────
export const generateInvoiceNo = async () => {
  try {
    const bills = await getBills();
    const today = new Date();
    const year = today.getFullYear();
    const nextYear = String(year + 1).slice(-2);
    const finYear = today.getMonth() >= 3 ? `${year}-${nextYear}` : `${year - 1}-${String(year).slice(-2)}`;
    const seq = (bills.length + 1);
    return `${finYear}/${seq}`;
  } catch (e) {
    const today = new Date();
    const year = today.getFullYear();
    const nextYear = String(year + 1).slice(-2);
    const finYear = today.getMonth() >= 3 ? `${year}-${nextYear}` : `${year - 1}-${String(year).slice(-2)}`;
    return `${finYear}/1`;
  }
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
