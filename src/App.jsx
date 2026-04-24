import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoicePreview from './components/InvoicePreview';
import RecentBills from './components/RecentBills';
import { Toast, useToast } from './components/Toast';
import { useBills } from './hooks/useBills';
import { getSettings, saveSettings } from './utils/storage';
import './App.css';

function App() {
  const { bills, addBill } = useBills();
  const { toasts, remove, toast } = useToast();
  
  const [businessSettings, setBusinessSettings] = useState(() => getSettings());
  const [previewBill, setPreviewBill] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isRecentBillsOpen, setIsRecentBillsOpen] = useState(false);

  const handleSaveSettings = (newSettings) => {
    saveSettings(newSettings);
    setBusinessSettings(newSettings);
  };

  const handleGenerateBill = (billData) => {
    const newBill = addBill(billData);
    setPreviewBill(newBill);
    toast.success('Bill generated successfully!');
  };

  return (
    <div className="app-container">
      <Sidebar 
        bills={bills} 
        onSelectBill={(bill) => { setPreviewBill(bill); setIsDrawerOpen(false); setIsRecentBillsOpen(false); }} 
        selectedBillNo={previewBill?.invoiceNo}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenSettings={() => { setIsEditingSettings(true); setIsDrawerOpen(false); }}
        onOpenCatalog={() => { setIsCatalogOpen(true); setIsDrawerOpen(false); }}
        onOpenRecentBills={() => { setIsRecentBillsOpen(true); setIsDrawerOpen(false); }}
      />
      
      <main className="main-content">
        <Dashboard 
          businessSettings={businessSettings}
          onSaveSettings={handleSaveSettings}
          onGenerateBill={handleGenerateBill}
          toast={toast}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          isEditingSettings={isEditingSettings}
          setIsEditingSettings={setIsEditingSettings}
          isCatalogOpen={isCatalogOpen}
          setIsCatalogOpen={setIsCatalogOpen}
        />
      </main>

      {previewBill && (
        <InvoicePreview 
          bill={previewBill} 
          onClose={() => setPreviewBill(null)} 
        />
      )}
      
      {isRecentBillsOpen && (
        <RecentBills 
          bills={bills} 
          onSelectBill={(bill) => { setPreviewBill(bill); setIsRecentBillsOpen(false); }} 
          selectedBillNo={previewBill?.invoiceNo}
          onClose={() => setIsRecentBillsOpen(false)}
        />
      )}
      
      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}

export default App;
