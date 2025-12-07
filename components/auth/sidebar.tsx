"use client";

import Link from "next/link";
import { Home, FileText, Users, UserPlus } from "lucide-react";

export function Sidebar({ role }: { role: "owner" | "staff" }) {
  return (
    <aside className="w-64 bg-card border-r border-border p-4">
      <nav className="flex flex-col gap-2">
        {/* Dashboard — visible to all */}
        <Link href="/" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
          <Home size={18} />
          Dashboard
        </Link>

        {/* Bills — only for Owner */}
        {role === "owner" && (
          <Link href="/bills" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
            <FileText size={18} />
            Bills
          </Link>
        )}

        {/* Customers — visible to all */}
        <Link href="/customers" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
          <Users size={18} />
          Customers
        </Link>

        {/* Staff Management — Owner only */}
        {role === "owner" && (
          <Link href="/staff-management" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
            <UserPlus size={18} />
            Staff Management
          </Link>
        )}

        {/* Create Bill — Staff only */}
        {role === "staff" && (
          <Link href="/create-bill" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/10">
            <FileText size={18} />
            Create Bill
          </Link>
        )}
      </nav>
    </aside>
  );
}