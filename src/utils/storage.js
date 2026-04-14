const BILLS_KEY = 'gravelsand_bills';
const AUTH_KEY = 'gravelsand_auth';
const SETTINGS_KEY = 'gravelsand_settings';
const CATALOG_KEY = 'gravelsand_catalog';
const MAX_BILLS = 15;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const CREDENTIALS = { username: 'admin', password: 'gravel123' };

export const getSession = () => {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)); }
  catch { return null; }
};

export const setSession = (user) => sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
export const clearSession = () => sessionStorage.removeItem(AUTH_KEY);
export const isAuthenticated = () => !!getSession();

// ── Catalog ───────────────────────────────────────────────────────────────────
export const getCatalog = () => {
  try { return JSON.parse(localStorage.getItem(CATALOG_KEY)) || []; }
  catch { return []; }
};

export const saveToCatalog = (item) => {
  const catalog = getCatalog();
  const existingIndex = catalog.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
  
  if (existingIndex >= 0) {
    catalog[existingIndex] = { ...catalog[existingIndex], price: item.price, gst: item.gst };
  } else {
    catalog.push({ name: item.name, price: item.price, gst: item.gst });
  }
  
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  return catalog;
};

export const deleteFromCatalog = (name) => {
  const catalog = getCatalog().filter(i => i.name !== name);
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  return catalog;
};

// ── Bills ─────────────────────────────────────────────────────────────────────
export const getBills = () => {
  try { return JSON.parse(localStorage.getItem(BILLS_KEY)) || []; }
  catch { return []; }
};

export const saveBill = (bill) => {
  const bills = getBills();
  const updated = [bill, ...bills].slice(0, MAX_BILLS);
  localStorage.setItem(BILLS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteBill = (invoiceNo) => {
  const bills = getBills().filter(b => b.invoiceNo !== invoiceNo);
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  return bills;
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
      businessName: 'Sri Murugan Gravel & Sand',
      businessAddress: 'Main Road, Your City - 600001',
      businessPhone: '+91 99999 00000',
      businessGST: '',
    };
  } catch { return {}; }
};

export const saveSettings = (settings) =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

// ── Invoice Number ────────────────────────────────────────────────────────────
export const generateInvoiceNo = () => {
  const bills = getBills();
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const seq = (bills.length + 1).toString().padStart(4, '0');
  return `GS${year}${month}${seq}`;
};

// ── Format ────────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
