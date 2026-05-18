"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { CreateBillPage } from "@/components/pages/create-bill-page";
import { BillsPage } from "@/components/pages/bills-page";
import { CustomersPage } from "@/components/pages/customers-page";
import { StaffManagementPage } from "@/components/pages/staff-management-page";
import { SettingsPage } from "@/components/pages/settings-page";
import { DashboardHome } from "@/components/pages/dashboard-home";
import InvoiceDetailsPage from "@/components/pages/invoice-details-page";
import { BillingDashboardPage } from "@/components/pages/billing-dashboard-page";
import { PaymentTrackingPage } from "@/components/pages/payment-tracking-page";
import { runAutoCleanup } from "@/lib/cleanup-service";

import { Button } from "@/components/ui/button";

interface DashboardProps {
  role: "owner" | "staff";
  userName: string;
  onLogout: () => void;
}

export function Dashboard({ role, userName, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Listen for navigation events from other components
  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) setCurrentPage(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  // Run automatic cleanup on dashboard mount
  useEffect(() => {
    runAutoCleanup();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <DashboardHome role={role} />;
      case "create-bill":
        return <CreateBillPage role={role} />;
      case "bills":
        return role === "owner" ? <BillsPage /> : <p>Access Denied</p>;
      case "customers":
        return <CustomersPage />;
      case "staff":
        return role === "owner" ? <StaffManagementPage /> : <p>Access Denied</p>;
      case "settings":
        return role === "owner" ? <SettingsPage /> : <p>Access Denied</p>;
      case "billing-dashboard":
        return role === "owner" ? <BillingDashboardPage /> : <p>Access Denied</p>;
      case "invoice-details":
        return <InvoiceDetailsPage />;
      case "payment-tracking":
        return <PaymentTrackingPage />;
      default:
        return <DashboardHome role={role} />;
    }
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          role={role}
          userName={userName}
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setIsSidebarOpen(false);
          }}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b flex items-center gap-4 bg-background sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
          <span className="font-semibold text-lg">Spinz Soda</span>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">{renderPage()}</div>
        </div>
      </div>
    </div>
  );
}
