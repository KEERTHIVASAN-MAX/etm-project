"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getBills } from "../../lib/bill-service";

export function PaymentTrackingPage() {
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [totalOverdue, setTotalOverdue] = useState(0);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const bills = await getBills();

            // Calculate paid amount
            const paid = bills
                .filter(bill => bill.status === "paid")
                .reduce((sum, bill) => sum + bill.total, 0);
            setTotalPaid(paid);

            // Calculate pending amount
            const pending = bills
                .filter(bill => bill.status === "pending")
                .reduce((sum, bill) => sum + bill.total, 0);
            setTotalPending(pending);

            // Calculate overdue amount
            const overdue = bills
                .filter(bill => bill.status === "overdue")
                .reduce((sum, bill) => sum + bill.total, 0);
            setTotalOverdue(overdue);

            // Get recent payments (last 10 paid bills)
            const recent = bills
                .filter(bill => bill.status === "paid")
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                })
                .slice(0, 10);
            setRecentPayments(recent);
        };

        loadData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Payment Tracking</h1>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Overview</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <span className="font-medium">Total Paid</span>
                        <span className="text-green-600 font-bold">₹{totalPaid}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <span className="font-medium">Total Pending</span>
                        <span className="text-orange-500 font-bold">₹{totalPending}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <span className="font-medium">Total Overdue</span>
                        <span className="text-red-500 font-bold">₹{totalOverdue}</span>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
                {recentPayments.length === 0 ? (
                    <p className="text-foreground/60 text-center py-4">No payment records yet</p>
                ) : (
                    <div className="space-y-3">
                        {recentPayments.map((bill) => (
                            <div key={bill.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{bill.customerName}</p>
                                    <p className="text-sm text-foreground/60">
                                        {bill.customerPhone}
                                    </p>
                                    <p className="text-xs text-foreground/40">
                                        {new Date(bill.createdAt || Date.now()).toLocaleDateString()} - {new Date(bill.createdAt || Date.now()).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">₹{bill.total}</p>
                                    <p className="text-xs text-green-600">PAID</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
