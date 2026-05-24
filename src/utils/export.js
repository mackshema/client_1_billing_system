export const exportToCSV = (bills) => {
  if (!bills || bills.length === 0) {
    alert("No bills available to export.");
    return;
  }

  const headers = [
    "Invoice No",
    "Date",
    "Customer Name",
    "Phone",
    "Address",
    "GSTIN",
    "State",
    "Tax Type",
    "Total Amount",
    "Received Amount",
    "Balance Amount",
    "Items (Name | Qty | Rate | GST%)"
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const text = String(str);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csvRows = bills.map(b => {
    const itemsStr = b.items?.map(i => `${i.name || ''} (Qty: ${i.quantity || 0}, Rate: ${i.price || 0}, GST: ${i.gst || 0}%)`).join(' | ') || '';
    
    return [
      escapeCSV(b.invoiceNo),
      escapeCSV(new Date(b.createdAt).toLocaleDateString('en-IN')),
      escapeCSV(b.customerName),
      escapeCSV(b.customerPhone),
      escapeCSV(b.customerAddress),
      escapeCSV(b.customerGSTIN),
      escapeCSV(b.customerState),
      escapeCSV(b.taxType),
      escapeCSV(b.totalAmount),
      escapeCSV(b.receivedAmount),
      escapeCSV(b.balanceAmount),
      escapeCSV(itemsStr)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `billing_logs_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
