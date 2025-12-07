"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getBills } from "../../lib/bill-service";
import { getCustomers } from "../../lib/customer-service";

export function BillingDashboardPage() {
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingPayments, setPendingPayments] = useState(0);
    const [completedBills, setCompletedBills] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            // Load bills
            const bills = await getBills();

            // Calculate total revenue (all bills)
            const revenue = bills.reduce((sum, bill) => sum + bill.total, 0);
            setTotalRevenue(revenue);

            // Calculate pending payments
            const pending = bills
                .filter(bill => bill.status === "pending" || bill.status === "overdue")
                .reduce((sum, bill) => sum + bill.total, 0);
            setPendingPayments(pending);

            // Count completed bills
            const completed = bills.filter(bill => bill.status === "paid").length;
            setCompletedBills(completed);

            // Load customers
            const customers = await getCustomers();
            setTotalCustomers(customers.length);

            // Get recent activity (last 5 bills)
            const recent = bills
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                })
                .slice(0, 5);
            setRecentActivity(recent);
        };

        loadData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Billing Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-primary">₹{totalRevenue}</p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2">Pending Payments</h3>
                    <p className="text-3xl font-bold text-orange-500">₹{pendingPayments}</p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2">Completed Bills</h3>
                    <p className="text-3xl font-bold text-green-600">{completedBills}</p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-foreground/60 mb-2">Total Customers</h3>
                    <p className="text-3xl font-bold text-blue-600">{totalCustomers}</p>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                    <p className="text-foreground/60">No recent activity</p>
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map((bill) => (
                            <div key={bill.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{bill.customerName}</p>
                                    <p className="text-sm text-foreground/60">
                                        {new Date(bill.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">₹{bill.total}</p>
                                    <p className={`text-sm ${bill.status === 'paid' ? 'text-green-600' :
                                        bill.status === 'pending' ? 'text-orange-500' :
                                            'text-red-500'
                                        }`}>
                                        {bill.status.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
