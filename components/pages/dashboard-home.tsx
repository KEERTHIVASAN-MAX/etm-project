"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBills } from "../../lib/bill-service";
import { getCustomers } from "../../lib/customer-service";
import { getStaffMembers } from "../../lib/staff-service";

import { useAuth } from "@/lib/auth-context";

interface DashboardHomeProps {
    role: "owner" | "staff";
}

export function DashboardHome({ role }: DashboardHomeProps) {
    const { uid } = useAuth();
    const [totalBills, setTotalBills] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [totalStaff, setTotalStaff] = useState(0);
    const [todayBills, setTodayBills] = useState(0);
    const [todayCollection, setTodayCollection] = useState(0);
    const [pendingBillsCount, setPendingBillsCount] = useState(0);
    const [pendingAmountTotal, setPendingAmountTotal] = useState(0);
    const [staffCollectionCount, setStaffCollectionCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            // Load bills from Firebase
            const allBills = await getBills();
            const bills = allBills.filter(b => !b.isDeleted);
            setTotalBills(bills.length);

            // Calculate stats for CURRENT staff member
            if (role === "staff" && uid) {
                const myBills = bills.filter(b => b.createdBy === uid);
                setStaffCollectionCount(myBills.length);
            }

            // Calculate pending
            const pending = bills.filter(b => b.status === "pending" || b.status === "overdue");
            setPendingBillsCount(pending.length);
            setPendingAmountTotal(pending.reduce((s, b) => s + b.pendingAmount, 0));

            // Calculate today's bills and collection
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysBills = bills.filter((bill) => {
                if (!bill.createdAt) return false;
                const billDate = new Date(bill.createdAt);
                billDate.setHours(0, 0, 0, 0);
                return billDate.getTime() === today.getTime();
            });

            setTodayBills(todaysBills.length);
            setTodayCollection(todaysBills.reduce((sum, bill) => sum + bill.paidAmount, 0));

            // Load customers from Firebase
            const customers = await getCustomers();
            setTotalCustomers(customers.length);

            // Load staff from Firebase
            if (role === "owner") {
                const staff = await getStaffMembers();
                setTotalStaff(staff.length);
            }
        };

        loadData();
    }, [role, uid]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-foreground/60 mt-1">
                    Welcome back! Role: {role.toUpperCase()}
                </p>
            </div>

            {/* 🔥 NEW: Pending Collections Section for Both Staff & Owner */}
            {pendingBillsCount > 0 && (
                <Card className="p-6 bg-orange-50 border-orange-200 border-2 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                                <span className="animate-bounce">⚠️</span> {pendingBillsCount} Pending Payments
                            </h2>
                            <p className="text-orange-700 mt-1">
                                There is a total of <span className="font-bold">₹{Number(pendingAmountTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> waiting to be collected.
                            </p>
                        </div>
                        <Button 
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'payment-tracking' }));
                            }}
                        >
                            Collect Now
                        </Button>
                    </div>
                </Card>
            )}

            {/* Today's Stats - Only for Owner */}
            {role === "owner" && (
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Today's Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-6 bg-blue-50 border-blue-200 border-2 shadow-md">
                            <h3 className="text-lg font-semibold mb-2 text-blue-900 border-b border-blue-100 pb-1">Today's Orders</h3>
                            <p className="text-5xl font-black text-blue-700">{todayBills}</p>
                            <p className="text-sm text-blue-600 mt-2 font-medium">New sales added today</p>
                        </Card>

                        <Card className="p-6 bg-emerald-50 border-emerald-200 border-2 shadow-md">
                            <h3 className="text-lg font-semibold mb-2 text-emerald-900 border-b border-emerald-100 pb-1">Today's Cash</h3>
                            <p className="text-5xl font-black text-emerald-700 truncate" title={`₹${todayCollection}`}>
                                ₹{Number(todayCollection).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-emerald-600 mt-2 font-medium">Cash collected today</p>
                        </Card>
                    </div>
                </div>
            )}

            {/* Overall Stats - Custom for Role */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {role === "staff" && (
                        <Card className="p-6 border-l-4 border-l-primary border-2 border-primary/20 shadow-md">
                            <h3 className="text-lg font-semibold mb-2 text-foreground/70">My Collections</h3>
                            <p className="text-4xl font-bold text-primary">{staffCollectionCount}</p>
                            <p className="text-sm text-foreground/50 mt-1">Total bills you recorded</p>
                        </Card>
                    )}

                    {role === "owner" && (
                        <Card className="p-6 border-l-4 border-l-primary border-2 border-primary/20 shadow-md">
                            <h3 className="text-lg font-semibold mb-2 text-foreground/70">Total Bills</h3>
                            <p className="text-4xl font-bold text-primary">{totalBills}</p>
                        </Card>
                    )}

                    <Card className="p-6 border-l-4 border-l-blue-500 border-2 border-blue-100 shadow-md">
                        <h3 className="text-lg font-semibold mb-2 text-foreground/70">Total Customers</h3>
                        <p className="text-4xl font-bold text-blue-600">{totalCustomers}</p>
                    </Card>

                    {role === "owner" && (
                        <Card className="p-6 border-l-4 border-l-purple-500 border-2 border-purple-100 shadow-md">
                            <h3 className="text-lg font-semibold mb-2 text-foreground/70">Staff Members</h3>
                            <p className="text-4xl font-bold text-purple-600">{totalStaff}</p>
                        </Card>
                    )}
                </div>
            </div>

            <Card className="p-6 bg-secondary/20">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'create-bill' }))}>
                        Create New Bill
                    </Button>
                    <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'customers' }))}>
                        View Customers
                    </Button>
                </div>
            </Card>
        </div>
    );
}
