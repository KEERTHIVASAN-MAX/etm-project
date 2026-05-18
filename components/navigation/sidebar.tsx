"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Home } from "lucide-react";
import { FileText } from "lucide-react";
import { Users } from "lucide-react";
import { Settings } from "lucide-react";
import { LogOut } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { Users2 } from "lucide-react";
import { CreditCard } from "lucide-react";
import { Wallet } from "lucide-react";

interface SidebarProps {
  role: "owner" | "staff";
  userName: string;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  role,
  userName,
  currentPage,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const isActive = (page: string) => currentPage === page;

  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, show: true },
    { id: "create-bill", label: "Create Bill", icon: ShoppingCart, show: true },
    { id: "bills", label: "Bills", icon: FileText, show: role === "owner" },
    { id: "customers", label: "Customers", icon: Users, show: true },
    { id: "staff", label: "Staff", icon: Users2, show: role === "owner" },
    {
      id: "billing-dashboard",
      label: "Billing",
      icon: CreditCard,
      show: role === "owner",
    },
    {
      id: "payment-tracking",
      label: "Payments",
      icon: Wallet,
      show: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      show: role === "owner",
    },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-[#0B2851] to-[#1B3B74] text-white flex flex-col h-[100dvh] overflow-y-auto pb-24">
      {/* Logo */}
      <div className="p-6 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <Image
              src="/spinz-logo.png"
              alt="Spinz Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg">Spinz Soda</h1>
            <p className="text-xs text-white/70">ETM System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-white/10 border-b border-white/20 flex-shrink-0">
        <p className="text-sm text-white/70">Welcome,</p>
        <p className="font-semibold text-white">{userName}</p>
        <p className="text-xs text-green-400 mt-1 capitalize">{role}</p>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(
          (item) =>
            item.show && (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.id)
                  ? "bg-green-500 text-primary-dark font-semibold"
                  : "text-white hover:bg-white/10"
                  }`}
              >
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            )
        )}
      </nav>

      {/* Logout - Always Visible */}
      <div className="p-4 border-t border-white/20 flex-shrink-0">
        <Button
          onClick={onLogout}
          className="w-full flex items-center gap-2 bg-green-500 hover:bg-green-400 text-primary-dark font-semibold"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>

      {/* Company Info - Always Visible */}
      <div className="px-6 py-4 border-t border-white/20 bg-white/5 text-xs text-white/70 space-y-1 flex-shrink-0">
        <p className="font-semibold text-white/90">Spinz Soda</p>
        <p>10/1/9, Beodnabad</p>
        <p>Andaman and Nicobar Islands</p>
        <p>Port Blair, South Andamans</p>
        <p className="text-green-400">Near Army Gate - 744105</p>
      </div>
    </div>
  );
}