"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getBills } from "../../lib/bill-service";
import { getCustomers } from "../../lib/customer-service";
import { getStaffMembers } from "../../lib/staff-service";

interface DashboardHomeProps {
    role: "owner" | "staff";
}

export function DashboardHome({ role }: DashboardHomeProps) {
    const [totalBills, setTotalBills] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [totalStaff, setTotalStaff] = useState(0);
    const [todayBills, setTodayBills] = useState(0);
    const [todayCollection, setTodayCollection] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            // Load bills from Firebase
            const bills = await getBills();
            setTotalBills(bills.length);

            // Calculate today's bills and collection
            if (role === "owner") {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todaysBills = bills.filter((bill) => {
                    if (!bill.createdAt) return false;
                    const billDate = new Date(bill.createdAt);
                    billDate.setHours(0, 0, 0, 0);
                    return billDate.getTime() === today.getTime();
                });

                setTodayBills(todaysBills.length);
                setTodayCollection(todaysBills.reduce((sum, bill) => sum + bill.total, 0));
            }

            // Load customers from Firebase
            const customers = await getCustomers();
            setTotalCustomers(customers.length);

            // Load staff from Firebase
            const staff = await getStaffMembers();
            setTotalStaff(staff.length);
        };

        loadData();
    }, [role]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-foreground/60 mt-1">
                    Welcome back! Role: {role}
                </p>
            </div>

            {/* Today's Stats - Only for Owner */}
            {role === "owner" && (
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Today's Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <h3 className="text-lg font-semibold mb-2 text-blue-900">Today's Bills</h3>
                            <p className="text-4xl font-bold text-blue-600">{todayBills}</p>
                            <p className="text-sm text-blue-700 mt-2">Bills created today</p>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                            <h3 className="text-lg font-semibold mb-2 text-green-900">Today's Collection</h3>
                            <p className="text-4xl font-bold text-green-600">₹{todayCollection}</p>
                            <p className="text-sm text-green-700 mt-2">Total revenue today</p>
                        </Card>
                    </div>
                </div>
            )}

            {/* Overall Stats */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Bills</h3>
                        <p className="text-3xl font-bold text-primary">{totalBills}</p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Customers</h3>
                        <p className="text-3xl font-bold text-primary">{totalCustomers}</p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Staff Members</h3>
                        <p className="text-3xl font-bold text-primary">{totalStaff}</p>
                    </Card>
                </div>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <p className="text-foreground/60">
                    Use the sidebar to navigate to different sections of the dashboard.
                </p>
            </Card>
        </div>
    );
}
