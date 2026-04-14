import { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoicePreview from './components/InvoicePreview';
import { Toast, useToast } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useBills } from './hooks/useBills';
import { getSettings, saveSettings } from './utils/storage';
import './App.css';

function App() {
  const { user, login, logout, loading, error, isAuthenticated } = useAuth();
  const { bills, addBill } = useBills();
  const { toasts, remove, toast } = useToast();
  
  const [businessSettings, setBusinessSettings] = useState(() => getSettings());
  const [selectedBill, setSelectedBill] = useState(null);
  const [previewBill, setPreviewBill] = useState(null);

  const handleSaveSettings = (newSettings) => {
    saveSettings(newSettings);
    setBusinessSettings(newSettings);
  };

  const handleGenerateBill = (billData) => {
    const newBill = addBill(billData);
    setPreviewBill(newBill);
    toast.success('Bill generated successfully!');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} error={error} loading={loading} />
        <Toast toasts={toasts} remove={remove} />
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        bills={bills} 
        onSelectBill={setPreviewBill} 
        selectedBillNo={previewBill?.invoiceNo}
        onLogout={logout} 
      />
      
      <main className="main-content">
        <Dashboard 
          businessSettings={businessSettings}
          onSaveSettings={handleSaveSettings}
          onGenerateBill={handleGenerateBill}
          toast={toast}
        />
      </main>

      {previewBill && (
        <InvoicePreview 
          bill={previewBill} 
          onClose={() => setPreviewBill(null)} 
        />
      )}
      
      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}

export default App;
