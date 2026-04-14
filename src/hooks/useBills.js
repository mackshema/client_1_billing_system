import { useState, useCallback } from 'react';
import { getBills, saveBill, deleteBill, generateInvoiceNo } from '../utils/storage';

export const useBills = () => {
  const [bills, setBills] = useState(() => getBills());

  const addBill = useCallback((billData) => {
    const bill = {
      ...billData,
      invoiceNo: generateInvoiceNo(),
      createdAt: new Date().toISOString(),
    };
    const updated = saveBill(bill);
    setBills(updated);
    return bill;
  }, []);

  const removeBill = useCallback((invoiceNo) => {
    const updated = deleteBill(invoiceNo);
    setBills(updated);
  }, []);

  const refresh = useCallback(() => {
    setBills(getBills());
  }, []);

  return { bills, addBill, removeBill, refresh };
};
