"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { CompanyHeader } from "@/components/branding/company-header";

// ✅ Import correct Bill functions
import { getBills, deleteBill, exportBillsToCSV, updateBillStatus, Bill } from "../../lib/bill-service";

/* -----------------------------------------------
 🧾 BILLS PAGE COMPONENT
------------------------------------------------ */
export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [paymentStats, setPaymentStats] = useState({ paid: 0, pending: 0, overdue: 0 });
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
  useEffect(() => {
    const loadBills = async () => {
      try {
        const billsData = await getBills(); // ✅ Typed from bill-service.ts
        setBills(billsData);

        // Calculate payment stats
        const stats = billsData.reduce((acc: { paid: number; pending: number; overdue: number }, bill: Bill) => {
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
      } catch (err) {
        console.error("Error loading bills:", err);
        toast.error("Failed to load bills ❌");
      }
    };

    if (role === "owner") loadBills();
  }, [role]);

  /* ❌ Delete Bill */
  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteBill(billId);
      setBills((prev) => prev.filter((b) => b.id !== billId));
      toast.success("Bill deleted successfully 🗑");
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete bill ❌");
    }
  };

  /* ✅ Mark as Paid */
  const handleMarkAsPaid = async (billId: string) => {
    try {
      await updateBillStatus(billId, "paid");
      setBills((prev) => prev.map((b) => b.id === billId ? { ...b, status: "paid" } : b));
      toast.success("Bill marked as paid ✅");

      // Update stats
      setPaymentStats(prev => {
        // This is a simplified update, ideally we re-calculate or fetch fresh data
        // For now, let's just trigger a reload or leave it (re-calc is safer)
        return prev;
      });
      // Trigger re-fetch to get correct stats
      if (role === "owner") {
        const billsData = await getBills();
        setBills(billsData);
        const stats = billsData.reduce((acc: { paid: number; pending: number; overdue: number }, bill: Bill) => {
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
      }

    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update bill status ❌");
    }
  };

  /* 📤 Export CSV */
  const handleDownloadCSV = async () => {
    try {
      await exportBillsToCSV(bills);
      toast.success("CSV downloaded successfully ✅");
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast.error("Failed to export CSV ❌");
    }
  };

  /* 💬 Send WhatsApp Message */
  const handleSendMessage = (phone: string, customerName: string) => {
    const message = `Hi ${customerName}, your Spinz Soda bill is ready.\nThank you for your purchase! 💧`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  /* 🧾 Format items text */
  const getItemsLabel = (items: Bill["items"]) =>
    items.map((i: { type: string; quantity: number; price: number }) => `${i.type.replace("_", " ").toUpperCase()} x${i.quantity}`).join(", ");

  /* 🌀 Loading State */
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-foreground/60">
        <p>Checking permissions...</p>
      </div>
    );
  }

  /* -----------------------------------------------
   🖥 UI
  ------------------------------------------------ */
  return (
    <div className="space-y-6">
      <CompanyHeader />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bills</h1>
          <p className="text-sm text-foreground/60 mt-1">{bills.length} total bills</p>
        </div>
        <Button
          onClick={handleDownloadCSV}
          className="bg-accent hover:bg-accent-light text-primary-dark flex items-center gap-2"
        >
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      {/* Payment Overview */}
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

      {/* Bills List */}
      <Card className="p-6">
        {bills.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-foreground/60">No bills yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                {/* Customer Details */}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{bill.customerName}</p>
                  <p className="text-sm text-foreground/60">{bill.customerPhone}</p>
                  <p className="text-xs text-foreground/50 mt-1">{getItemsLabel(bill.items)}</p>
                </div>

                {/* Bill Details */}
                <div className="text-right">
                  <p className="font-bold text-accent text-lg">₹{bill.total}</p>
                  <p className="text-xs text-foreground/60">
                    {bill.createdAt
                      ? new Date(bill.createdAt).toLocaleDateString("en-IN")
                      : "-"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() =>
                      handleSendMessage(bill.customerPhone, bill.customerName)
                    }
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <MessageCircle size={18} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteBill(bill.id!)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                  {bill.status !== "paid" && (
                    <button
                      onClick={() => handleMarkAsPaid(bill.id!)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium text-green-600 border border-green-200"
                      title="Mark as Paid"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}