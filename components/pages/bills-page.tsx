"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, MessageCircle, Printer, Bluetooth, Wallet, RotateCcw, Archive, Trash } from "lucide-react";
import { toast } from "sonner";
import { CompanyHeader } from "@/components/branding/company-header";

// ✅ Import correct Bill functions
import { getBills, deleteBill, exportBillsToCSV, updateBill, Bill } from "../../lib/bill-service";
import { getSettings } from "../../lib/settings-service";

/* -----------------------------------------------
 🧾 BILLS PAGE COMPONENT
------------------------------------------------ */
export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [qrCode1, setQrCode1] = useState<string | null>(null);
  const [qrCode2, setQrCode2] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showBin, setShowBin] = useState(false);
  const router = useRouter();

  /* 🔐 Role Check */
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole !== "owner") {
      toast.error("Access denied — only owners can view bills.");
      router.push("/");
    } else {
      setRole(storedRole);
    }
  }, [router]);

  /* 📦 Load Bills */
  const loadBills = async () => {
    try {
      const billsData = await getBills();
      setBills(billsData);
    } catch (err) {
      console.error("Error loading bills:", err);
      toast.error("Failed to load bills ❌");
    }
  };

  const filteredBills = bills.filter((bill) => {
      // 1. Handle deletion status
      if (showBin) {
          if (!bill.isDeleted) return false;
      } else {
          if (bill.isDeleted) return false;
      }

      // 2. Handle date filter
      if (!selectedDate) return true;
      const billDate = new Date(bill.createdAt || '').toISOString().split('T')[0];
      return billDate === selectedDate;
  });

  const paymentStats = filteredBills.reduce((acc, bill) => {
    acc.paid += bill.paidAmount || 0;
    if (bill.status === "pending") acc.pending += bill.pendingAmount;
    if (bill.status === "overdue") acc.overdue += bill.pendingAmount;
    return acc;
  }, { paid: 0, pending: 0, overdue: 0 });

  useEffect(() => {
    if (role === "owner") {
      loadBills();
      
      const fetchSettings = async () => {
        const settings = await getSettings();
        if (settings.qrCode1) setQrCode1(settings.qrCode1);
        if (settings.qrCode2) setQrCode2(settings.qrCode2);
      };
      fetchSettings();
    }
  }, [role]);

  /* ❌ Delete Bill (Soft or Hard) */
  const handleDeleteBill = async (billId: string) => {
    const isHardDelete = showBin;
    const msg = isHardDelete 
      ? "Permanently delete this bill? This cannot be undone." 
      : "Move this bill to Recycle Bin?";
      
    if (!confirm(msg)) return;
    
    try {
      if (isHardDelete) {
        await deleteBill(billId);
        setBills((prev) => prev.filter((b) => b.id !== billId));
        toast.success("Bill deleted permanently 🗑");
      } else {
        await updateBill(billId, { isDeleted: true });
        toast.success("Bill moved to Recycle Bin 📁");
        loadBills();
      }
    } catch (error) {
      toast.error("Failed to delete bill ❌");
    }
  };

  /* 🔄 Restore Bill */
  const handleRestoreBill = async (billId: string) => {
    try {
      await updateBill(billId, { isDeleted: false });
      toast.success("Bill restored successfully 🔄");
      loadBills();
    } catch (error) {
      toast.error("Failed to restore bill ❌");
    }
  };

  /* 🧹 Clear All Bills (Filtered ones) */
  const handleClearAll = async () => {
    if (filteredBills.length === 0) return;
    if (!confirm(`Move all ${filteredBills.length} bills from ${selectedDate} to Recycle Bin?`)) return;
    
    try {
      const promises = filteredBills.map(bill => updateBill(bill.id!, { isDeleted: true }));
      await Promise.all(promises);
      toast.success("All bills moved to Recycle Bin 📁");
      loadBills();
    } catch (error) {
      toast.error("Failed to clear bills ❌");
    }
  };

  /* 💰 Record Payment */
  const handleRecordPayment = async (bill: Bill) => {
    const amountStr = prompt(`Balance: ₹${bill.pendingAmount}. How much is the customer paying?`, bill.pendingAmount.toString());
    if (amountStr === null) return;

    const paidNow = parseFloat(amountStr);
    if (isNaN(paidNow) || paidNow < 0) {
      toast.error("Invalid amount");
      return;
    }

    const newPaidAmount = bill.paidAmount + paidNow;
    const newPendingAmount = Math.max(0, bill.total - newPaidAmount);
    const newAdvanceAmount = Math.max(0, newPaidAmount - bill.total);
    const newStatus = newPendingAmount === 0 ? "paid" : bill.status;

    try {
      await updateBill(bill.id!, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        advanceAmount: newAdvanceAmount,
        status: newStatus as any
      });
      toast.success(`Payment recorded: ₹${paidNow} ✅`);
      loadBills(); // Refresh UI and stats
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  /* 📤 Export CSV */
  const handleDownloadCSV = async () => {
    try {
      await exportBillsToCSV(bills);
      toast.success("CSV downloaded successfully ✅");
    } catch (error) {
      toast.error("Failed to export CSV ❌");
    }
  };

  /* 💬 Send WhatsApp Message */
  const handleSendWhatsApp = (e: React.MouseEvent, bill: Bill) => {
    e.preventDefault();
    e.stopPropagation();

    if (!bill.customerPhone || bill.customerPhone === "NA") {
        toast.error("No phone number");
        return;
    }
    let phone = bill.customerPhone.replace(/\D/g, "");
    if (phone.length === 10) phone = "91" + phone;

    const message = `SPINZ SODA\n\nBill Details:\nReceipt No: ${bill.billNumber || '-'}\nCustomer: ${bill.customerName}\n\nItems:\n${bill.items.map(i => `${i.type} x ${i.quantity} = ${i.quantity * i.price}`).join('\n')}\n\nTotal: Rs.${bill.total}\nPaid: Rs.${bill.paidAmount}\n${bill.pendingAmount > 0 ? `Pending: Rs.${bill.pendingAmount}\n` : ''}${bill.advanceAmount && bill.advanceAmount > 0 ? `Advance: Rs.${bill.advanceAmount}\n` : ''}\nThank you! Visit Again!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  /* 🖨 Browser Print */
  const handlePrint = (bill: Bill) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = bill.items.map(i => `
        <tr>
          <td>${i.type}</td>
          <td>${i.quantity}</td>
          <td>₹${i.price}</td>
          <td>₹${i.quantity * i.price}</td>
        </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            body { font-family: sans-serif; width: 280px; margin: 10px auto; font-size: 12px; }
            h2, p { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 5px; border-bottom: 1px dashed #ccc; }
            .total-cell { text-align: right; }
          </style>
        </head>
        <body>
          <h2>SPINZ SODA</h2>
          <p>Refreshing Every Moment 🥤</p>
          <hr/>
          <p>Bill No: ${bill.billNumber || '-'}<br/>Date: ${new Date(bill.createdAt || '').toLocaleString()}</p>
          <p>Customer: ${bill.customerName}</p>
          <hr/>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <table>
            <tr><td>Total:</td><td class="total-cell">₹${bill.total}</td></tr>
            <tr><td>Paid:</td><td class="total-cell">₹${bill.paidAmount}</td></tr>
            ${bill.pendingAmount > 0 ? `<tr><td>Pending:</td><td class="total-cell">₹${bill.pendingAmount}</td></tr>` : ''}
            ${bill.advanceAmount && bill.advanceAmount > 0 ? `<tr><td>Advance:</td><td class="total-cell">₹${bill.advanceAmount}</td></tr>` : ''}
          </table>
          <p>Status: ${bill.status.toUpperCase()}</p>
          <hr/>
          ${(qrCode1 || qrCode2) && bill.status !== "paid" ? `
          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px;">
            ${qrCode1 ? `<div style="text-align: center;"><img src="${qrCode1}" style="width: 80px; height: 80px; object-fit: contain;" /><br/><span style="font-size: 8px; font-weight: bold;">PAYMENT 1</span></div>` : ''}
            ${qrCode2 ? `<div style="text-align: center;"><img src="${qrCode2}" style="width: 80px; height: 80px; object-fit: contain;" /><br/><span style="font-size: 8px; font-weight: bold;">PAYMENT 2</span></div>` : ''}
          </div>
          ` : ''}
          <p>Thank you! Visit Again! ✨</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  /* 🔵 Bluetooth Print */
  const handleBluetoothPrint = async (bill: Bill) => {
    try {
        const nav = navigator as any;
        const device = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        let char = null;
        for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
            }
            if (char) break;
        }

        if (!char) throw new Error("No characteristic");

        let text = "\x1B\x40\x1B\x61\x01SPINZ SODA\nRefreshing Every Moment\n--------------------------------\n";
        text += `\x1B\x61\x00Bill: ${bill.billNumber}\nCust/Shop: ${bill.customerName}\n--------------------------------\n`;
        bill.items.forEach(i => {
            text += `${i.type.substring(0, 10).padEnd(12)} x${i.quantity} ₹${i.quantity * i.price}\n`;
        });
        text += `--------------------------------\n\x1B\x61\x02Total: Rs.${bill.total}\nPaid: Rs.${bill.paidAmount}\n`;
        if (bill.pendingAmount > 0) text += `Pending: Rs.${bill.pendingAmount}\n`;
        if (bill.advanceAmount && bill.advanceAmount > 0) text += `Advance: Rs.${bill.advanceAmount}\n`;
        text += "\n\x1B\x61\x01Visit Again! ✨\n\n\n\n\n";

        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        for (let i = 0; i < data.length; i += 100) {
            await char.writeValue(data.slice(i, i + 100));
            await new Promise(r => setTimeout(r, 50));
        }
        toast.success("Printed!");
        device.gatt.disconnect();
    } catch (e: any) {
        toast.error("Bluetooth Error");
    }
  };

  /* 📄 Print Daily Collection */
  const handlePrintDailyCollection = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const stats = filteredBills.reduce((acc, bill) => {
        acc.total += bill.total;
        acc.paid += bill.paidAmount || 0;
        if (bill.status === "pending") acc.pending += bill.pendingAmount;
        if (bill.status === "overdue") acc.overdue += bill.pendingAmount;
        return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Collection - ${selectedDate}</title>
          <style>
            body { font-family: sans-serif; width: 280px; margin: 10px auto; font-size: 12px; }
            h2, p { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 5px; border-bottom: 1px dashed #ccc; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>SPINZ SODA</h2>
          <p>Daily Collection Report</p>
          <p>Date: ${new Date(selectedDate).toLocaleDateString('en-IN')}</p>
          <hr/>
          <table>
            <tr><td>Total Bills:</td><td class="right">${filteredBills.length}</td></tr>
            <tr><td>Total Sales:</td><td class="right">₹${stats.total}</td></tr>
            <tr><td>Cash Collected:</td><td class="right">₹${stats.paid}</td></tr>
            <tr><td>Pending Due:</td><td class="right">₹${stats.pending}</td></tr>
          </table>
          <hr/>
          <p>Report Generated: ${new Date().toLocaleTimeString('en-IN')}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  /* -----------------------------------------------
   🖥 UI
  ------------------------------------------------ */
  return (
    <div className="space-y-6">
      <CompanyHeader />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {showBin ? "Recycle Bin" : "Bills Records"}
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            {showBin ? "View and manage deleted bills" : "Manage and track all customer bills"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm"
            />
            {!showBin && (
              <>
                <Button onClick={handlePrintDailyCollection} variant="outline" className="flex items-center gap-2 border-primary/20 text-primary">
                    <Printer size={16} /> Print Collection
                </Button>
                <Button onClick={handleDownloadCSV} className="bg-accent hover:bg-accent-light text-primary-dark flex items-center gap-2">
                    <Download size={18} />
                    Export Data
                </Button>
              </>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
          <p className="text-sm font-medium text-foreground/60">Cash Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{paymentStats.paid}</p>
        </Card>
        <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
          <p className="text-sm font-medium text-foreground/60">Total Pending</p>
          <p className="text-2xl font-bold text-orange-500">₹{paymentStats.pending}</p>
        </Card>
        <Card className="p-6 border-l-4 border-l-red-500 shadow-sm">
          <p className="text-sm font-medium text-foreground/60">Total Overdue</p>
          <p className="text-2xl font-bold text-red-600">₹{paymentStats.overdue}</p>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredBills.length === 0 ? (
          <p className="text-center py-10 text-foreground/40">
            {showBin ? "Bin is empty." : "No bills found for this date."}
          </p>
        ) : (
          filteredBills.map((bill) => (
            <Card key={bill.id} className={`p-5 transition-all hover:shadow-md border-l-4 ${
                bill.status === "paid" ? "border-l-green-500 bg-green-50/20" : 
                bill.status === "pending" ? "border-l-orange-500 bg-orange-50/20" : "border-l-red-500 bg-red-50/20"
            }`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-primary/10 px-2 py-1 rounded text-primary">
                        {bill.billNumber}
                    </span>
                    <h3 className="font-bold text-lg">{bill.customerName}</h3>
                  </div>
                  <p className="text-sm text-foreground/60 flex items-center gap-2">
                    {bill.customerPhone} • {new Date(bill.createdAt || '').toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs italic text-foreground/50">
                    {bill.items.map(i => `${i.type} x${i.quantity}`).join(", ")}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-center min-w-[140px]">
                   <p className="text-2xl font-black text-foreground">₹{bill.total}</p>
                   <div className="text-sm text-right mt-1">
                      <p className="text-green-700 font-medium">Paid: ₹{bill.paidAmount}</p>
                      {bill.pendingAmount > 0 && <p className="text-red-500 font-bold">Due: ₹{bill.pendingAmount}</p>}
                      {bill.advanceAmount && bill.advanceAmount > 0 && <p className="text-emerald-600 font-bold italic">Advance: ₹{bill.advanceAmount}</p>}
                   </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                   {/* Record Payment */}
                   {bill.pendingAmount > 0 && (
                     <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white flex items-center gap-1"
                        onClick={() => handleRecordPayment(bill)}
                     >
                       <Wallet size={14} /> Record Payment
                     </Button>
                   )}

                   {/* Actions Group */}
                   <div className="flex gap-1">
                     {showBin ? (
                       <Button size="icon" variant="ghost" onClick={() => handleRestoreBill(bill.id!)} title="Restore Bill">
                         <RotateCcw size={18} className="text-blue-600" />
                       </Button>
                     ) : (
                       <>
                         <Button size="icon" variant="ghost" onClick={() => handlePrint(bill)} title="Print Bill">
                           <Printer size={18} className="text-gray-600" />
                         </Button>
                         <Button size="icon" variant="ghost" onClick={() => handleBluetoothPrint(bill)} title="Bluetooth Print">
                           <Bluetooth size={18} className="text-blue-600" />
                         </Button>
                         {bill.customerPhone && bill.customerPhone !== "NA" && (
                           <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={(e) => handleSendWhatsApp(e, bill)}
                              title="Send WhatsApp"
                           >
                             <MessageCircle size={18} className="text-green-600" />
                           </Button>
                         )}
                       </>
                     )}
                     <Button size="icon" variant="ghost" onClick={() => handleDeleteBill(bill.id!)} title={showBin ? "Permanently Delete" : "Move to Bin"}>
                       <Trash2 size={18} className="text-red-400" />
                     </Button>
                   </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 🚀 Floating Action Buttons (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {!showBin && filteredBills.length > 0 && (
          <Button 
            onClick={handleClearAll} 
            variant="destructive" 
            className="shadow-2xl rounded-2xl h-14 px-6 font-bold animate-in slide-in-from-bottom-4 duration-300"
          >
            <Trash size={20} className="mr-2" /> Clear All Today
          </Button>
        )}
        <Button 
          onClick={() => setShowBin(!showBin)} 
          variant={showBin ? "default" : "secondary"}
          className={`shadow-2xl rounded-2xl h-14 px-6 font-bold animate-in slide-in-from-bottom-2 duration-300 ${!showBin ? "bg-white border-2 border-primary/10 text-primary hover:bg-slate-50" : ""}`}
        >
          {showBin ? <RotateCcw size={20} className="mr-2" /> : <Archive size={20} className="mr-2" />}
          {showBin ? "Back to Bills" : "Recycle Bin"}
        </Button>
      </div>
    </div>
  );
}