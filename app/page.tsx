"use client";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/auth/login-page";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function Home() {
  const { user, role, userName, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-accent"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <LoginPage />;
  }

  return <Dashboard role={role} userName={userName || "User"} onLogout={logout} />;
}
