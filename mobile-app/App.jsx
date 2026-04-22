import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getSettings, saveSettings, getBills, saveBill, isAuthenticated, setSession, clearSession, CREDENTIALS } from './utils/storage';

export default function App() {
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [businessSettings, setBusinessSettings] = useState({
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
  });
  const [bills, setBills] = useState([]);
  const [previewBill, setPreviewBill] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadSettings();
    loadBills();
  }, []);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuthenticatedState(authenticated);
    setLoading(false);
  };

  const loadSettings = async () => {
    const settings = await getSettings();
    setBusinessSettings(settings);
  };

  const loadBills = async () => {
    const loadedBills = await getBills();
    setBills(loadedBills);
  };

  const handleLogin = async (username, password) => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      await setSession({ username });
      setIsAuthenticatedState(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = async () => {
    await clearSession();
    setIsAuthenticatedState(false);
  };

  const handleSaveSettings = async (newSettings) => {
    await saveSettings(newSettings);
    setBusinessSettings(newSettings);
  };

  const handleGenerateBill = async (billData) => {
    const bill = {
      ...billData,
      invoiceNo: `${new Date().getFullYear()}-${bills.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    const updated = await saveBill(bill);
    setBills(updated);
    setPreviewBill(bill);
    Alert.alert('Success', 'Bill generated successfully!');
    return bill;
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticatedState) {
    return (
      <SafeAreaView style={styles.container}>
        <Login 
          onLogin={handleLogin} 
          error={loginError} 
          loading={false} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Dashboard 
        businessSettings={businessSettings}
        onSaveSettings={handleSaveSettings}
        onGenerateBill={handleGenerateBill}
        toast={{ success: (msg) => Alert.alert('Success', msg), error: (msg) => Alert.alert('Error', msg) }}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
});
