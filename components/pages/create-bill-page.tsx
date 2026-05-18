"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addBill, Bill, getBills } from "@/lib/bill-service";
import { addOrUpdateCustomer, getCustomerByPhone, getCustomers, Customer } from "@/lib/customer-service";
import { getPrices } from "@/lib/price-service";
import { getSettings } from "@/lib/settings-service";
import { Printer, Send, Bluetooth, User, Phone, Plus, Minus, CreditCard, Zap, QrCode, X } from "lucide-react";
import { CompanyHeader } from "@/components/branding/company-header";

interface CreateBillPageProps {
    role?: "owner" | "staff";
}

export function CreateBillPage({ role }: CreateBillPageProps) {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [sodaQty, setSodaQty] = useState(0);
    const [colorSodaQty, setColorSodaQty] = useState(0);
    const [goliSodaQty, setGoliSodaQty] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [lastBill, setLastBill] = useState<Bill | null>(null);
    const [paymentStats, setPaymentStats] = useState({ paid: 0, pending: 0, overdue: 0 });
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [qrCode1, setQrCode1] = useState<string | null>(null);
    const [qrCode2, setQrCode2] = useState<string | null>(null);
    const [selectedQr, setSelectedQr] = useState<"1" | "2" | "both" | "none">("1");
    const [showQrOptions, setShowQrOptions] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const [prices, setPrices] = useState({
        shop: { soda: 10, colorSoda: 15, goliSoda: 20 },
        bar: { soda: 15, colorSoda: 20, goliSoda: 25 }
    });
    const [priceCategory, setPriceCategory] = useState<"shop" | "bar">("shop");

    // Fetch prices on mount
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const fetchedPrices = await getPrices();

                // Handle migration from old structure to new structure
                if (fetchedPrices.shop && fetchedPrices.bar) {
                    // New structure exists
                    setPrices(fetchedPrices);
                } else if ('soda' in fetchedPrices) {
                    // Old structure - migrate to new structure
                    const oldPrices = fetchedPrices as any;
                    setPrices({
                        shop: {
                            soda: oldPrices.soda || 10,
                            colorSoda: oldPrices.colorSoda || 15,
                            goliSoda: oldPrices.goliSoda || 20,
                        },
                        bar: {
                            soda: (oldPrices.soda || 10) + 5,
                            colorSoda: (oldPrices.colorSoda || 15) + 5,
                            goliSoda: (oldPrices.goliSoda || 20) + 5,
                        }
                    });
                } else {
                    // Use defaults if neither structure exists
                    setPrices({
                        shop: { soda: 10, colorSoda: 15, goliSoda: 20 },
                        bar: { soda: 15, colorSoda: 20, goliSoda: 25 }
                    });
                }
            } catch (error) {
                console.error("Error fetching prices:", error);
                // Keep default prices on error
            }
        };
        fetchPrices();

        // Fetch customers for suggestions
        const fetchCustomers = async () => {
            const list = await getCustomers();
            setAllCustomers(list);
        };
        fetchCustomers();

        // Fetch settings for QR code and default selection
        const fetchSettings = async () => {
            const settings = await getSettings();
            if (settings.qrCode1) setQrCode1(settings.qrCode1);
            if (settings.qrCode2) setQrCode2(settings.qrCode2);
            if (settings.defaultQr) setSelectedQr(settings.defaultQr);
        };
        fetchSettings();
    }, []);

    // Calculate payment statistics
    useEffect(() => {
        const calculateStats = async () => {
            try {
                const bills = await getBills();

                const stats = bills.filter(b => !b.isDeleted).reduce((acc, bill) => {
                    acc.paid += bill.paidAmount || 0;
                    if (bill.status === "pending") {
                        acc.pending += bill.pendingAmount;
                    } else if (bill.status === "overdue") {
                        acc.overdue += bill.pendingAmount;
                    }
                    return acc;
                }, { paid: 0, pending: 0, overdue: 0 });

                setPaymentStats(stats);
            } catch (error) {
                console.error("Error calculating payment stats:", error);
            }
        };

        calculateStats();
    }, [lastBill]); // Recalculate when a new bill is created

    // Load selected customer from localStorage (when coming from Customers page)
    useEffect(() => {
        const selectedCustomer = localStorage.getItem("selectedCustomer");
        if (selectedCustomer) {
            try {
                const customer = JSON.parse(selectedCustomer);
                setCustomerName(customer.name);
                setCustomerPhone(customer.phone);
                toast.success(`Customer loaded: ${customer.name}`);
                // Clear the selected customer from localStorage
                localStorage.removeItem("selectedCustomer");
            } catch (error) {
                console.error("Error loading selected customer:", error);
            }
        }
    }, []);

    // Auto-fill Amount Received with Total Amount
    useEffect(() => {
        setPaidAmount(calculateTotal());
    }, [sodaQty, colorSodaQty, goliSodaQty, priceCategory, prices]);

    // Auto-fill customer details when phone number is entered
    useEffect(() => {
        const fetchCustomer = async () => {
            // Only auto-fill if phone is 10 digits and name field is empty
            if (customerPhone.length === 10 && !customerName) {
                const customer = await getCustomerByPhone(customerPhone);
                if (customer) {
                    setCustomerName(customer.name);
                    toast.success(`Customer found: ${customer.name}`);
                }
            }
        };
        fetchCustomer();
    }, [customerPhone, customerName]);

    const calculateTotal = () => {
        const currentPrices = prices[priceCategory];
        return (
            sodaQty * currentPrices.soda +
            colorSodaQty * currentPrices.colorSoda +
            goliSodaQty * currentPrices.goliSoda
        );
    };

    const calculatePending = () => {
        return Math.max(0, calculateTotal() - paidAmount);
    };

    const calculateAdvance = () => {
        return Math.max(0, paidAmount - calculateTotal());
    };

    const processSubmission = async () => {
        if (sodaQty === 0 && colorSodaQty === 0 && goliSodaQty === 0) {
            toast.error("Please add at least one item");
            return;
        }

        const total = calculateTotal();
        const currentStatus = paidAmount < total ? "pending" : "paid";
        const pending = Math.max(0, total - paidAmount);
        const advance = Math.max(0, paidAmount - total);

        // Customer name is completely optional now
        const finalName = customerName.trim() || "Customer";

        setLoading(true);

        try {
            const currentPrices = prices[priceCategory];
            const items = [];
            if (sodaQty > 0) items.push({ type: "Soda", quantity: sodaQty, price: currentPrices.soda });
            if (colorSodaQty > 0) items.push({ type: "Color Soda", quantity: colorSodaQty, price: currentPrices.colorSoda });
            if (goliSodaQty > 0) items.push({ type: "Goli Soda", quantity: goliSodaQty, price: currentPrices.goliSoda });

            const finalName = customerName.trim() || "Customer";
            const finalPhone = customerPhone.trim() || "NA";

            let finalStatus: "paid" | "pending" | "overdue" = currentStatus;

            // Debt Check: If adding a pending bill and they already have debt
            if (currentStatus !== "paid") {
                const existingBills = await getBills();
                const ownerId = localStorage.getItem("ownerId") || "default";
                
                const hasExistingDebt = existingBills.some(b => 
                    b.ownerId === ownerId &&
                    (b.status === "pending" || b.status === "overdue") &&
                    (
                        b.customerName.toLowerCase() === finalName.toLowerCase() ||
                        (finalPhone !== "NA" && b.customerPhone === finalPhone)
                    )
                );

                if (hasExistingDebt) {
                    finalStatus = "overdue";
                }
            }

            // Final auto-correct if paid in full
            if (pending === 0 && paidAmount > 0) {
                finalStatus = "paid";
            }

            const newBill = await addBill({
                customerName: finalName,
                customerPhone: finalPhone,
                items,
                total,
                paidAmount,
                pendingAmount: pending,
                advanceAmount: advance,
                selectedQr: selectedQr,
                status: finalStatus,
                priceCategory,
            });

            // Save customer if name or phone was provided
            const hasCustomerInfo = customerName.trim() && customerName.trim() !== "Customer";
            const hasPhone = finalPhone !== "NA" && finalPhone.length === 10;
            if (hasCustomerInfo || hasPhone) {
                await addOrUpdateCustomer(finalName, hasPhone ? finalPhone : "");
            }

            // Skip rendering print view if amount received is 0
            if (finalStatus !== "paid" && paidAmount === 0) {
                setLastBill(null);
                toast.success(`Saved as ${finalStatus.toUpperCase()}. View at Bills section.`);
            } else {
                setLastBill(newBill);
                toast.success("Bill created successfully!");
            }

            // Removed automatic navigation to customers section to allow users to print/whatsapp the bill or create a new one

            // Reset form
            setCustomerName("");
            setCustomerPhone("");
            setPaidAmount(0);
            setSodaQty(0);
            setColorSodaQty(0);
            setGoliSodaQty(0);
            

        } catch (error) {
            console.error("Error creating bill:", error);
            toast.error("Failed to create bill");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processSubmission();
    };

    const handlePrint = () => {
        if (!lastBill) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const itemsHtml = lastBill.items
            .map(
                (i) => `
        <tr>
          <td>${i.type}</td>
          <td>${i.quantity}</td>
          <td>₹${i.price}</td>
          <td>₹${i.quantity * i.price}</td>
        </tr>
      `
            )
            .join("");

        printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${lastBill.id}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              width: 280px;
              margin: 10px auto;
            }
            h2, h3, p { text-align: center; margin: 4px 0; }
            .logo { text-align: center; margin: 10px 0; }
            .logo img { width: 60px; height: 60px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
            }
            th, td {
              padding: 4px;
              text-align: left;
              border-bottom: 1px dashed #999;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/spinz-logo.png" alt="Spinz Logo" />
          </div>
          <h2>SPINZ SODA</h2>
          <p>Refreshing Every Moment</p>
          <p>Near Army Gate, Kamraj Nagar,<br/>
          Beodnabad, Sri Vijaya Puram<br/>
          Contact: 9933212458</p>
          <hr/>
          <p>
            <strong>Bill No:</strong> ${lastBill.billNumber || '-'}<br/>
            <strong>Date:</strong> ${lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleDateString() : "-"}<br/>
            <strong>Time:</strong> ${lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleTimeString() : "-"}
          </p>
          <p>
            <strong>Customer / Shop:</strong> ${lastBill.customerName}<br/>
            <strong>Phone:</strong> ${lastBill.customerPhone}
          </p>
          <hr/>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <hr/>
          <hr/>
          <table style="margin-top:0;">
            <tr>
              <td style="border:none;"><strong>Total:</strong></td>
              <td style="border:none; text-align:right;"><strong>₹${lastBill.total}</strong></td>
            </tr>
            <tr>
              <td style="border:none;">Paid Amount:</td>
              <td style="border:none; text-align:right;">₹${lastBill.paidAmount}</td>
            </tr>
            ${lastBill.pendingAmount > 0 ? `
            <tr>
              <td style="border:none;">Pending Amount:</td>
              <td style="border:none; text-align:right;">₹${lastBill.pendingAmount}</td>
             </tr>` : ""}
            ${lastBill.advanceAmount && lastBill.advanceAmount > 0 ? `
            <tr>
              <td style="border:none;"><strong>Advance Amount:</strong></td>
              <td style="border:none; text-align:right;"><strong>₹${lastBill.advanceAmount}</strong></td>
             </tr>` : ""}
          </table>
          <p style="text-align:right;">Status: ${lastBill.status.toUpperCase()}</p>
          <hr/>
          <hr/>
          ${lastBill.advanceAmount && lastBill.advanceAmount > 0 ? '' : `
          <div class="footer">
            ${(lastBill.selectedQr === "both" || lastBill.selectedQr === "1" || lastBill.selectedQr === "2") ? `
              <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 10px;">
                ${(lastBill.selectedQr === "1" || lastBill.selectedQr === "both") && qrCode1 ? `<div style="text-align: center;"><img src="${qrCode1}" style="width: 80px; height: 80px; object-fit: contain;" /><br/><span style="font-size: 8px; font-weight: bold;">PAYMENT 1</span></div>` : ''}
                ${(lastBill.selectedQr === "2" || lastBill.selectedQr === "both") && qrCode2 ? `<div style="text-align: center;"><img src="${qrCode2}" style="width: 80px; height: 80px; object-fit: contain;" /><br/><span style="font-size: 8px; font-weight: bold;">PAYMENT 2</span></div>` : ''}
              </div>
            ` : ''}
            <p>Thank you for your purchase!<br/>Visit Again</p>
          </div>
          `}
          ${lastBill.advanceAmount && lastBill.advanceAmount > 0 ? `
          <div class="footer">
             <p>Thank you for your purchase!<br/>Visit Again</p>
          </div>
          ` : ''}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

        printWindow.document.close();
    };

    const handleBluetoothPrint = async () => {
        if (!lastBill) return;

        try {
            toast.info("Select your Bluetooth printer...");

            // 1. Request Bluetooth device
            const nav = navigator as any;
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb'] // Common thermal printer services
            }).catch(() => {
                // Fallback for devices without standard services
                return nav.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb']
                });
            });

            if (!device || !device.gatt) {
                throw new Error("No device selected or GATT not supported");
            }

            // 2. Connect to GATT Server
            toast.info("Connecting to printer...");
            const server = await device.gatt.connect();

            // 3. Get primary service & writable characteristic
            const services = await server.getPrimaryServices();
            if (services.length === 0) {
                throw new Error("No services found on device");
            }

            let printCharacteristic = null;
            for (const service of services) {
                const characteristics = await service.getCharacteristics();
                for (const char of characteristics) {
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        printCharacteristic = char;
                        break;
                    }
                }
                if (printCharacteristic) break;
            }

            if (!printCharacteristic) {
                throw new Error("Could not find a writable characteristic for this printer");
            }

            // 4. Prepare text for printing
            toast.info("Printing...");
            let printText = "\x1B\x40"; // Initialize printer (ESC @)
            printText += "\x1B\x61\x01"; // Center align
            printText += "SPINZ SODA\n";
            printText += "Refreshing Every Moment\n";
            printText += "Contact: 9933212458\n";
            printText += "--------------------------------\n";
            printText += "\x1B\x61\x00"; // Left align
            if (lastBill.billNumber) printText += `Bill No: ${lastBill.billNumber}\n`;
            printText += `Date: ${lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleString() : "-"}\n`;
            printText += `Cust/Shop: ${lastBill.customerName}\n`;
            printText += `Phone: ${lastBill.customerPhone}\n`;
            printText += "--------------------------------\n";
            printText += "Item          Qty  Rate   Total\n";
            printText += "--------------------------------\n";

            lastBill.items.forEach(item => {
                let itemName = item.type.substring(0, 12).padEnd(14);
                let qty = item.quantity.toString().padStart(2);
                let rate = item.price.toString().padStart(5);
                let total = (item.quantity * item.price).toString().padStart(6);
                printText += `${itemName} ${qty} ${rate} ${total}\n`;
            });

            printText += "--------------------------------\n";
            printText += "\x1B\x61\x02"; // Right align
            printText += `Total: Rs.${lastBill.total}\n`;
            printText += `Paid: Rs.${lastBill.paidAmount}\n`;
            if (lastBill.pendingAmount > 0) printText += `Pending: Rs.${lastBill.pendingAmount}\n`;
            if (lastBill.advanceAmount && lastBill.advanceAmount > 0) printText += `Advance: Rs.${lastBill.advanceAmount}\n`;
            printText += "\x1B\x61\x01"; // Center align
            printText += "--------------------------------\n";
            printText += "Thank you for your purchase!\n";
            printText += "Visit Again\n\n\n\n";

            // 5. Send data in chunks (BLE has a max packet size)
            const encoder = new TextEncoder();
            const data = encoder.encode(printText);

            // Chunk size of 100 bytes is safe for most BLE modules
            const CHUNK_SIZE = 100;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                await printCharacteristic.writeValue(chunk);
                // Tiny delay between chunks
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            toast.success("Printed successfully via Bluetooth!");

            // Disconnect after printing
            device.gatt.disconnect();

        } catch (error: any) {
            console.error("Bluetooth print error:", error);
            // Some browsers throw a specific error if user cancels
            if (error.name !== "NotFoundError") {
                toast.error(`Bluetooth Error: ${error.message}`);
            }
        }
    };

    const getWhatsAppUrl = () => {
        if (!lastBill || !lastBill.customerPhone || lastBill.customerPhone === "NA") return "#";
        
        let phone = lastBill.customerPhone.replace(/\D/g, "");
        if (phone.length === 10) phone = "91" + phone;

        const dateStr = lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleString() : new Date().toLocaleString();
        const message = `SPINZ SODA\nRefreshing Every Moment\n\nBill Details:\nReceipt No: ${lastBill.billNumber || '-'}\nDate: ${dateStr}\nCustomer: ${lastBill.customerName}\n\nItems:\n${lastBill.items.map(i => `${i.type} x ${i.quantity} = ${i.quantity * i.price}`).join('\n')}\n\nTotal: Rs.${lastBill.total}\nPaid: Rs.${lastBill.paidAmount}\n${lastBill.pendingAmount > 0 ? `Balance: Rs.${lastBill.pendingAmount}\n` : ''}${lastBill.advanceAmount && lastBill.advanceAmount > 0 ? `Advance: Rs.${lastBill.advanceAmount}\n` : ''}\nThank you! Visit Again!`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };
    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <CompanyHeader />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Create Bill</h1>
                    <p className="text-sm text-foreground/60 mt-1">Generate new bills and record payments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Cash Collected", val: paymentStats.paid, color: "text-emerald-600", border: "border-l-emerald-500" },
                    { label: "Total Pending", val: paymentStats.pending, color: "text-orange-500", border: "border-l-orange-500" },
                    { label: "Total Overdue", val: paymentStats.overdue, color: "text-rose-600", border: "border-l-rose-500" },
                ].map((stat, i) => (
                    <Card key={i} className={`p-6 border border-slate-100 border-l-[6px] ${stat.border} shadow-sm bg-white rounded-2xl flex flex-col justify-between h-32 animate-in slide-in-from-top-2 duration-500`}>
                        <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                        <p className={`text-3xl font-black truncate ${stat.color}`} title={`₹${stat.val}`}>
                            ₹{Number(stat.val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </Card>
                ))}
            </div>

            <Card className="p-0 border-slate-200 shadow-xl rounded-3xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        New Billing
                    </h2>
                    <select
                        value={priceCategory}
                        onChange={(e) => setPriceCategory(e.target.value as "shop" | "bar")}
                        className="bg-white border rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm appearance-none"
                    >
                        <option value="shop">Shop Prices</option>
                        <option value="bar">Bar Prices</option>
                    </select>
                </div>

                <form id="billing-form" onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                    {/* Customer Information */}
                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                Customer Information (Optional)
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Name / Shop</label>
                                <input
                                    type="text"
                                    list="customer-suggestions"
                                    value={customerName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomerName(val);
                                        const match = allCustomers.find(c => c.name === val);
                                        if (match) {
                                            setCustomerPhone(match.phone);
                                            toast.success(`Loaded: ${match.name}`);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700 font-medium placeholder:text-slate-400"
                                    placeholder="Enter customer name"
                                />
                                <datalist id="customer-suggestions">
                                    {allCustomers.map((c, i) => (
                                        <option key={i} value={c.name}>{c.phone}</option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700 font-medium font-mono placeholder:text-slate-400"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Items</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { qty: sodaQty, set: setSodaQty, price: prices[priceCategory].soda, name: "Plain Soda" },
                                { qty: colorSodaQty, set: setColorSodaQty, price: prices[priceCategory].colorSoda, name: "Color Soda" },
                                { qty: goliSodaQty, set: setGoliSodaQty, price: prices[priceCategory].goliSoda, name: "Goli Soda" },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-start gap-1">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">{item.name} (₹{item.price})</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={item.qty === 0 ? "" : item.qty}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            item.set(val === "" ? 0 : parseInt(val) || 0);
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-700 font-medium"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment & Summary</h3>
                            <div className="px-3 py-1 bg-white rounded-full border shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Live Calculation
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-500" /> Amount Received
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={paidAmount}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setPaidAmount(val === "" ? 0 : parseInt(val) || 0);
                                        }}
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 focus:border-emerald-500/30 transition-all shadow-sm"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">₹</span>
                                </div>
                            </div>

                            <div className="space-y-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-inner">
                                <div className="flex justify-between items-center text-slate-500">
                                    <p className="text-[11px] font-bold uppercase tracking-wider">Total Amount</p>
                                    <p className="font-mono font-bold">₹{calculateTotal()}</p>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <p className="text-[11px] font-bold uppercase tracking-wider">Paid</p>
                                    <p className="font-mono font-bold text-emerald-600">₹{paidAmount}</p>
                                </div>
                                <div className="pt-2 mt-2 border-t flex justify-between items-center">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                                        {calculateAdvance() > 0 ? "Advance Amount" : "New Balance"}
                                    </p>
                                    <p className={`text-xl font-black font-mono ${calculateAdvance() > 0 ? "text-emerald-600" : calculatePending() > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                                        ₹{calculateAdvance() > 0 ? calculateAdvance() : calculatePending()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedQr !== "none" && (qrCode1 || qrCode2) && (
                            <Button 
                                type="button"
                                variant="outline"
                                className="w-full h-12 border-primary/30 text-primary font-bold rounded-2xl hover:bg-primary/5 flex items-center justify-center gap-2"
                                onClick={() => setShowQrModal(true)}
                            >
                                <QrCode size={18} /> Show QR Code to Customer
                            </Button>
                        )}

                        <Button 
                            type="submit"
                            disabled={loading || calculateTotal() === 0}
                            className="w-full h-16 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-black text-xl rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 border-none"
                            onClick={(e) => {
                                e.preventDefault();
                                processSubmission();
                            }}
                        >
                            {loading ? <div className="animate-spin h-6 w-6 border-4 border-white/30 border-t-white rounded-full"></div> : (
                                <>
                                    <Zap size={20} fill="currentColor" />
                                    Generate Bill
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>

            {lastBill && (
                <Card className="p-6 border-slate-200 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Last Bill Created</h2>
                            <p className="text-xs text-slate-500">#{lastBill.billNumber || '-'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handlePrint} variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold flex items-center gap-2">
                                <Printer size={16} /> Print
                            </Button>
                            <Button onClick={handleBluetoothPrint} variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold flex items-center gap-2 text-blue-600 border-blue-100 hover:bg-blue-50">
                                <Bluetooth size={16} /> BT Print
                            </Button>
                            {lastBill.customerPhone && lastBill.customerPhone !== "NA" && (
                                <a 
                                    href={getWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 text-white text-sm"
                                >
                                    <Send size={16} /> WhatsApp
                                </a>
                            )}
                        </div>
                    </div>

                    <div ref={printRef} className="border-2 border-slate-100 rounded-2xl p-6 bg-white shadow-inner flex flex-col items-center">
                        <img src="/spinz-logo.png" alt="Spinz Logo" className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-1">SPINZ SODA</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-6">
                            Refreshing Every Moment
                        </p>
                        
                        <div className="w-full space-y-4 text-sm mb-6">
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400 font-bold">CUSTOMER</span>
                                <span className="text-slate-800 font-black">{lastBill.customerName}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400 font-bold">DATE</span>
                                <span className="text-slate-800 font-bold">{lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleDateString() : "-"}</span>
                            </div>
                        </div>

                        <table className="w-full text-sm mb-6">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase font-black border-b-2 tracking-tighter">
                                    <th className="pb-2 text-left">Item</th>
                                    <th className="pb-2 text-center">Qty</th>
                                    <th className="pb-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lastBill.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-3 font-bold text-slate-700">{item.type}</td>
                                        <td className="py-3 text-center font-mono text-slate-500">{item.quantity}</td>
                                        <td className="py-3 text-right font-bold text-slate-800">₹{item.quantity * item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="w-full border-t border-b border-slate-200 py-3 space-y-1 my-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 font-bold">TOTAL AMOUNT</span>
                                <span className="text-slate-900 font-black">₹{lastBill.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Paid Amount</span>
                                <span className="text-slate-900">₹{lastBill.paidAmount}</span>
                            </div>
                            {lastBill.pendingAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Pending</span>
                                    <span className="text-slate-900">₹{lastBill.pendingAmount}</span>
                                </div>
                            )}
                            {lastBill.advanceAmount && lastBill.advanceAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Advance</span>
                                    <span className="text-slate-900">₹{lastBill.advanceAmount}</span>
                                </div>
                            )}
                        </div>


                        {(lastBill.selectedQr !== "none" && (qrCode1 || qrCode2)) && (
                            <div className="mt-6 pt-4 border-t border-dashed w-full space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Scan to Pay</p>
                                <div className="flex justify-center gap-6">
                                    {(lastBill.selectedQr === "1" || lastBill.selectedQr === "both") && qrCode1 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-24 h-24 p-1.5 bg-white border rounded-xl shadow-sm">
                                                <img src={qrCode1} alt="QR 1" className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Payment 1</span>
                                        </div>
                                    )}
                                    {(lastBill.selectedQr === "2" || lastBill.selectedQr === "both") && qrCode2 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-24 h-24 p-1.5 bg-white border rounded-xl shadow-sm">
                                                <img src={qrCode2} alt="QR 2" className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Payment 2</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Full Screen QR Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowQrModal(false)}>
                    <div className="bg-white p-8 rounded-3xl w-full max-w-sm relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            onClick={() => setShowQrModal(false)}
                        >
                            <X size={18} />
                        </button>
                        
                        <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Scan to Pay</h3>
                        
                        <div className="flex flex-col gap-6 items-center w-full">
                            {(selectedQr === "1" || selectedQr === "both") && qrCode1 && (
                                <div className="flex flex-col items-center w-full">
                                    <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm w-48 h-48 flex items-center justify-center">
                                        <img src={qrCode1} alt="QR 1" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <p className="mt-2 text-sm font-bold text-slate-500">PAYMENT 1</p>
                                </div>
                            )}
                            
                            {(selectedQr === "2" || selectedQr === "both") && qrCode2 && (
                                <div className="flex flex-col items-center w-full">
                                    <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm w-48 h-48 flex items-center justify-center">
                                        <img src={qrCode2} alt="QR 2" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <p className="mt-2 text-sm font-bold text-slate-500">PAYMENT 2</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="w-full mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount To Pay</span>
                            <span className="text-3xl font-black text-emerald-600">₹{calculateTotal()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
