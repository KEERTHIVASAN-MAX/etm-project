"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addBill, Bill, getBills } from "@/lib/bill-service";
import { addOrUpdateCustomer, getCustomerByPhone } from "@/lib/customer-service";
import { getPrices } from "@/lib/price-service";
import { Printer, Send } from "lucide-react";

interface CreateBillPageProps {
    role?: "owner" | "staff";
}

export function CreateBillPage({ role }: CreateBillPageProps) {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [sodaQty, setSodaQty] = useState(0);
    const [colorSodaQty, setColorSodaQty] = useState(0);
    const [goliSodaQty, setGoliSodaQty] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending" | "overdue">("paid");
    const [loading, setLoading] = useState(false);
    const [lastBill, setLastBill] = useState<Bill | null>(null);
    const [paymentStats, setPaymentStats] = useState({ paid: 0, pending: 0, overdue: 0 });
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
    }, []);

    // Calculate payment statistics
    useEffect(() => {
        const calculateStats = async () => {
            try {
                const bills = await getBills();

                const stats = bills.reduce((acc, bill) => {
                    if (bill.status === "paid") {
                        acc.paid += bill.total;
                    } else if (bill.status === "pending") {
                        acc.pending += bill.total;
                    } else if (bill.status === "overdue") {
                        acc.overdue += bill.total;
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
    }, [customerPhone]); // Removed customerName from dependencies to allow auto-fill

    const calculateTotal = () => {
        const currentPrices = prices[priceCategory];
        return (
            sodaQty * currentPrices.soda +
            colorSodaQty * currentPrices.colorSoda +
            goliSodaQty * currentPrices.goliSoda
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName || !customerPhone) {
            toast.error("Please enter customer details");
            return;
        }

        if (sodaQty === 0 && colorSodaQty === 0 && goliSodaQty === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setLoading(true);

        try {
            const currentPrices = prices[priceCategory];
            const items = [];
            if (sodaQty > 0) items.push({ type: "Soda", quantity: sodaQty, price: currentPrices.soda });
            if (colorSodaQty > 0) items.push({ type: "Color Soda", quantity: colorSodaQty, price: currentPrices.colorSoda });
            if (goliSodaQty > 0) items.push({ type: "Goli Soda", quantity: goliSodaQty, price: currentPrices.goliSoda });

            const newBill = await addBill({
                customerName,
                customerPhone,
                items,
                total: calculateTotal(),
                status: paymentStatus,
            });

            await addOrUpdateCustomer(customerName, customerPhone);

            setLastBill(newBill);
            toast.success("Bill created successfully!");

            // Reset form
            setCustomerName("");
            setCustomerPhone("");
            setSodaQty(0);
            setColorSodaQty(0);
            setGoliSodaQty(0);
            setPaymentStatus("paid");
        } catch (error) {
            console.error("Error creating bill:", error);
            toast.error("Failed to create bill");
        } finally {
            setLoading(false);
        }
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
            <img src="/spinz-logo.png" alt="Spinz Logo" />
          </div>
          <h2>SPINZ SODA</h2>
          <p>Refreshing Every Moment 💧</p>
          <p>Near Army Gate, Kamraj Nagar,<br/>
          Beodnabad, Sri Vijaya Puram<br/>
          Contact: 9933212458</p>
          <hr/>
          <p>
            <strong>Date:</strong> ${lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleDateString() : "-"}<br/>
            <strong>Time:</strong> ${lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleTimeString() : "-"}
          </p>
          <p>
            <strong>Customer:</strong> ${lastBill.customerName}<br/>
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
          <p style="text-align:right;"><strong>Total: ₹${lastBill.total}</strong></p>
          <p style="text-align:right;">Status: ${lastBill.status.toUpperCase()}</p>
          <hr/>
          <div class="footer">
            <p>Thank you for your purchase!<br/>Visit Again 💫</p>
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.print();
    };

    const handleSendWhatsApp = () => {
        if (!lastBill) {
            toast.error("No bill to send");
            return;
        }

        // Ensure phone number has country code (default to +91 if 10 digits)
        let phone = lastBill.customerPhone.replace(/\D/g, "");
        if (phone.length === 10) {
            phone = "91" + phone;
        }

        const message = `*SPINZ SODA* 🥤\nRefreshing Every Moment 💧\n\nHello ${lastBill.customerName},\n\n🧾 *Bill Details:*\n${lastBill.items.map(i => `${i.type} x ${i.quantity} = ₹${i.quantity * i.price}`).join('\n')}\n\n*Total: ₹${lastBill.total}*\nStatus: ${lastBill.status.toUpperCase()} ${lastBill.status === 'paid' ? '✅' : '⚠️'}\n\nThank you for your purchase! 🙏\nVisit Again 💫\n\n📍 Near Army Gate, Kamraj Nagar\n📞 9933212458`;

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Payment Overview - Only for Owner */}
            {role === "owner" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Payment Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-foreground">Total Paid</span>
                                <span className="text-2xl font-bold text-green-600">₹{paymentStats.paid}</span>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-foreground">Total Pending</span>
                                <span className="text-2xl font-bold text-orange-600">₹{paymentStats.pending}</span>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-foreground">Total Overdue</span>
                                <span className="text-2xl font-bold text-red-600">₹{paymentStats.overdue}</span>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Price Category</label>
                        <select
                            value={priceCategory}
                            onChange={(e) => setPriceCategory(e.target.value as "shop" | "bar")}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="shop">Shop Prices</option>
                            <option value="bar">Bar Prices</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter customer name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Soda (₹{prices[priceCategory].soda})</label>
                            <input
                                type="number"
                                min="0"
                                value={sodaQty}
                                onChange={(e) => setSodaQty(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Color Soda (₹{prices[priceCategory].colorSoda})</label>
                            <input
                                type="number"
                                min="0"
                                value={colorSodaQty}
                                onChange={(e) => setColorSodaQty(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Goli Soda (₹{prices[priceCategory].goliSoda})</label>
                            <input
                                type="number"
                                min="0"
                                value={goliSodaQty}
                                onChange={(e) => setGoliSodaQty(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending" | "overdue")}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-2xl font-bold">Total: ₹{calculateTotal()}</p>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Creating..." : "Create Bill"}
                    </Button>
                </form>
            </Card>

            {lastBill && (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Last Bill Created</h2>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                                <Printer size={16} /> Print
                            </Button>
                            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 flex items-center gap-2" size="sm">
                                <Send size={16} /> WhatsApp
                            </Button>
                        </div>
                    </div>

                    <div ref={printRef} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-center mb-2">
                            <img src="/spinz-logo.png" alt="Spinz Logo" className="w-16 h-16" />
                        </div>
                        <h3 className="text-center text-lg font-bold mb-2">SPINZ SODA</h3>
                        <p className="text-center text-xs text-gray-600 mb-3">
                            Near Army Gate, Kamraj Nagar, Beodnabad<br />
                            Contact: 9933212458
                        </p>
                        <hr className="my-2" />

                        <div className="text-sm mb-2">
                            <p><strong>Customer:</strong> {lastBill.customerName}</p>
                            <p><strong>Phone:</strong> {lastBill.customerPhone}</p>
                            <p><strong>Date:</strong> {lastBill.createdAt ? new Date(lastBill.createdAt).toLocaleString() : "-"}</p>
                        </div>

                        <table className="w-full text-sm border-t border-b my-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 text-left">Item</th>
                                    <th className="p-2 text-center">Qty</th>
                                    <th className="p-2 text-center">Rate</th>
                                    <th className="p-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastBill.items.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2">{item.type}</td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-center">₹{item.price}</td>
                                        <td className="p-2 text-right">₹{item.quantity * item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="text-right font-bold text-lg mt-2">
                            Total: ₹{lastBill.total}
                        </div>
                        <p className="text-right text-sm text-gray-600">Status: {lastBill.status.toUpperCase()}</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
