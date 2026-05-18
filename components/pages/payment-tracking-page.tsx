"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Printer } from "lucide-react";
import { Bluetooth } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { Search } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getBills, updateBill, Bill } from "../../lib/bill-service";

export function PaymentTrackingPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const allBills = await getBills();
            // Filter to only show bills that are NOT fully paid AND NOT deleted
            const unsettled = allBills.filter(b => !b.isDeleted && (b.status === "pending" || b.status === "overdue"));
            setBills(unsettled);
        } catch (error) {
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    /* 💰 Record Payment Logic */
    const handleRecordPayment = async (bill: Bill) => {
        const amountStr = prompt(`Balance: ₹${bill.pendingAmount}. How much is the customer paying?`, bill.pendingAmount.toString());
        if (amountStr === null) return;

        const paidNow = parseFloat(amountStr);
        if (isNaN(paidNow) || paidNow < 0) {
            toast.error("Invalid amount");
            return;
        }

        if (paidNow > bill.pendingAmount) {
            toast.error("Amount exceeds balance!");
            return;
        }

        const newPaidAmount = bill.paidAmount + paidNow;
        const newPendingAmount = Math.max(0, bill.total - newPaidAmount);
        const newStatus = newPendingAmount === 0 ? "paid" : bill.status;

        try {
            await updateBill(bill.id!, {
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus as any
            });
            toast.success(`Payment recorded: ₹${paidNow} ✅`);
            loadData(); // Refresh list (it will disappear from here if fully paid)
        } catch (error) {
            toast.error("Failed to update payment");
        }
    };

    /* 🖨 Browser Print */
    const handlePrint = (bill: Bill) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        const itemsHtml = bill.items.map(i => `<tr><td>${i.type}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${i.quantity * i.price}</td></tr>`).join("");
        printWindow.document.write(`<html><head><title>Bill</title><style>body{font-family:sans-serif;width:280px;margin:10px auto;font-size:12px;}h2,p{text-align:center;}table{width:100%;border-collapse:collapse;}th,td{padding:5px;border-bottom:1px dashed #ccc;}</style></head>
        <body><h2>SPINZ SODA</h2><p>Refreshing Every Moment</p><hr/><p>Bill No: ${bill.billNumber}<br/>Customer / Shop: ${bill.customerName}</p><hr/><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <p style="text-align:right">Total: ₹${bill.total}<br/>Paid: ₹${bill.paidAmount}<br/>Pending: ₹${bill.pendingAmount}</p><p>Status: ${bill.status.toUpperCase()}</p></body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    /* 🔵 Bluetooth Print */
    const handleBluetoothPrint = async (bill: Bill) => {
        try {
            const nav = navigator as any;
            const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] });
            const server = await device.gatt.connect();
            const services = await server.getPrimaryServices();
            let char: any = null;
            for (const s of services) {
                const chars = await s.getCharacteristics();
                for (const c of chars) { if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; } }
                if (char) break;
            }
            if (!char) throw new Error("No char");
            let text = `\x1B\x40\x1B\x61\x01SPINZ SODA\n\x1B\x61\x00Bill: ${bill.billNumber}\nCust/Shop: ${bill.customerName}\n--------------------------------\nTotal: Rs.${bill.total}\nPaid: Rs.${bill.paidAmount}\nPending: Rs.${bill.pendingAmount}\n\n\n\n`;
            await char.writeValue(new TextEncoder().encode(text));
            toast.success("Printed!");
            device.gatt.disconnect();
        } catch (e) { toast.error("BT Print Error"); }
    };

    /* 💬 WhatsApp */
    const handleWhatsApp = (bill: Bill) => {
        if (!bill.customerPhone || bill.customerPhone === "NA") return toast.error("No phone");
        let phone = bill.customerPhone.replace(/\D/g, "");
        if (phone.length === 10) phone = "91" + phone;
        const msg = `*SPINZ SODA*\n\nHello ${bill.customerName},\nYour payment of ₹${bill.paidAmount} has been recorded.\nRemaining Balance: ₹${bill.pendingAmount}\n\nThank you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    };

    const filteredBills = bills.filter(b => 
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.customerPhone.includes(searchTerm) ||
        b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Collect Payments</h1>
                    <p className="text-sm text-foreground/60">Collect pending amounts from Customer / Shop</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold animate-pulse">
                    <AlertCircle size={18} />
                    {bills.length} Pending Bills
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Customer / Shop, Phone, or Bill Number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <p className="text-center py-10">Loading payments...</p>
                ) : filteredBills.length === 0 ? (
                    <Card className="p-10 text-center text-foreground/40">
                        {searchTerm ? "No orders match your search" : "Great! No pending payments at the moment."}
                    </Card>
                ) : (
                    filteredBills.map((bill) => (
                        <Card key={bill.id} className={`p-5 border-l-4 ${bill.status === 'overdue' ? 'border-l-red-500 bg-red-50/10' : 'border-l-orange-500 bg-orange-50/10'}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${bill.status === 'overdue' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                                            {bill.status}
                                        </span>
                                        <h3 className="font-bold text-lg">{bill.customerName}</h3>
                                    </div>
                                    <p className="text-sm text-foreground/60">{bill.customerPhone} • {bill.billNumber}</p>
                                    <p className="text-sm text-red-600 font-bold italic">Balance Due: ₹{bill.pendingAmount}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-10 px-4"
                                        onClick={() => handleRecordPayment(bill)}
                                    >
                                        <Wallet size={16} /> Collect Cash
                                    </Button>
                                    <div className="flex gap-1 border-l pl-2">
                                        <Button size="icon" variant="ghost" onClick={() => handlePrint(bill)}><Printer size={18} /></Button>
                                        <Button size="icon" variant="ghost" className="text-blue-600" onClick={() => handleBluetoothPrint(bill)}><Bluetooth size={18} /></Button>
                                        <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleWhatsApp(bill)}><MessageCircle size={18} /></Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
