"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Printer, Send } from "lucide-react";

// Route segment config for static export with dynamic routes
export const dynamicParams = true;

interface InvoiceItem {
  type: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  total: number;
  status: "paid" | "pending" | "overdue";
  items: InvoiceItem[];
}

export default function InvoiceDetailsPage() {
  // ✅ Type-safe params (this removes the red underline)
  const params = useParams() as { invoiceId?: string };
  const invoiceId = params.invoiceId ?? "";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // 🔥 Fetch invoice from localStorage
  useEffect(() => {
    if (!invoiceId) return;

    try {
      const bills = localStorage.getItem("bills");
      if (bills) {
        const parsedBills = JSON.parse(bills) as Invoice[];
        const foundInvoice = parsedBills.find((b) => b.id === invoiceId);

        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          toast.error("Invoice not found");
        }
      } else {
        toast.error("No invoices found");
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice");
    }
  }, [invoiceId]);

  // 🖨️ Print
  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice?.id}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              width: 280px;
              margin: 10px auto;
            }
            h2, h3, p { text-align: center; margin: 4px 0; }
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
          <h2>🧃 SPINZ SODA</h2>
          <p>Refreshing Every Moment 💧</p>
          <p>Near Army Gate, Kamraj Nagar,<br/>
          Beodnabad, Sri Vijaya Puram<br/>
          Contact: 9933212458</p>
          <hr/>
          <p>
  <strong>Date:</strong>
  ${invoice?.createdAt
        ? new Date(invoice.createdAt).toLocaleDateString()
        : "-"}<br/>
  <strong>Time:</strong>
  ${invoice?.createdAt
        ? new Date(invoice.createdAt).toLocaleTimeString()
        : "-"}
</p>
<p>
  <strong>Customer:</strong> ${invoice?.customerName ?? "-"}<br/>
  <strong>Phone:</strong> ${invoice?.customerPhone ?? "-"}
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
              ${invoice?.items
        .map(
          (i) =>
            `<tr>
                      <td>${i.type}</td>
                      <td>${i.quantity}</td>
                      <td>₹${i.price}</td>
                      <td>₹${i.quantity * i.price}</td>
                    </tr>`
        )
        .join("")}
            </tbody>
          </table>
          <hr/>
          <p style="text-align:right;"><strong>Total: ₹${invoice?.total}</strong></p>
          <p style="text-align:right;">Status: ${invoice?.status.toUpperCase()}</p>
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

  // 💬 Send via WhatsApp
  const handleSendWhatsApp = () => {
    if (!invoice) return;
    const message = `Hi ${invoice.customerName},\nYour Spinz Soda Bill is ready.\nTotal: ₹${invoice.total}\nStatus: ${invoice.status.toUpperCase()}\nThank you for your purchase!`;
    const url = `https://wa.me/91${invoice.customerPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  if (!invoice) {
    return (
      <div className="text-center text-gray-500 py-10">Loading invoice...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Invoice #{invoice.id}
        </h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={18} /> Print
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Send size={18} /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Invoice View */}
      <div ref={printRef} className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-center text-xl font-bold mb-4 text-primary">
          SPINZ SODA
        </h2>
        <p className="text-center text-sm text-gray-600 leading-5">
          Near Army Gate, Kamraj Nagar, Beodnabad, Sri Vijaya Puram <br />
          Contact: 9933212458
        </p>
        <hr className="my-3" />

        <div className="flex justify-between text-sm text-gray-700">
          <p>Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p>Time: {new Date(invoice.createdAt).toLocaleTimeString()}</p>
        </div>

        <p className="mt-2 text-sm">
          <strong>Customer:</strong> {invoice.customerName}
        </p>
        <p className="text-sm mb-4">
          <strong>Phone:</strong> {invoice.customerPhone}
        </p>

        <table className="w-full text-sm border-t border-b">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-center">Rate</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((i, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 capitalize">{i.type}</td>
                <td className="p-2 text-center">{i.quantity}</td>
                <td className="p-2 text-center">₹{i.price}</td>
                <td className="p-2 text-right">₹{i.quantity * i.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4 font-bold text-lg">
          Total: ₹{invoice.total}
        </div>

        <p className="text-right text-sm text-gray-600 mt-1">
          Status: {invoice.status.toUpperCase()}
        </p>

        <hr className="my-4" />
        <p className="text-center text-gray-500 text-sm">
          Thank you for your purchase! <br /> Visit Again 💧
        </p>
      </div>
    </div>
  );
}


