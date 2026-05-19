"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface AuthContextType {
  user: any;
  uid: string | null;
  role: "owner" | "staff" | null;
  userName: string | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<"owner" | "staff" | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authResolved = false;

    // Safety fallback: if Firebase hangs, force loading to false after 2 seconds
    const fallbackTimer = setTimeout(() => {
      if (!authResolved) {
        console.warn("⚠️ Firebase Auth timed out. Falling back to localStorage.");
        const storedRole = localStorage.getItem("role");
        const storedUid = localStorage.getItem("uid");
        const storedName = localStorage.getItem("userName");
        
        if (storedRole === "staff" || storedRole === "owner") {
          setUid(storedUid);
          setRole(storedRole as "owner" | "staff");
          setUserName(storedName);
          setUser({ uid: storedUid, role: storedRole });
        }
        setLoading(false);
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      authResolved = true;
      clearTimeout(fallbackTimer);

      if (firebaseUser) {
        console.log("✅ Firebase User restored:", firebaseUser.email);
        setUser(firebaseUser);
        setUid(firebaseUser.uid);
        setRole("owner");
        setUserName(firebaseUser.displayName || "Owner");

        localStorage.setItem("uid", firebaseUser.uid);
        localStorage.setItem("role", "owner");
        localStorage.setItem("userName", firebaseUser.displayName || "Owner");
      } else {
        const storedRole = localStorage.getItem("role");
        const storedUid = localStorage.getItem("uid");
        const storedName = localStorage.getItem("userName");

        if (storedRole === "staff" || storedRole === "owner") {
          console.log(`✅ ${storedRole} session restored from localStorage (Offline Mode)`);
          setUid(storedUid);
          setRole(storedRole as "owner" | "staff");
          setUserName(storedName);
          setUser({ uid: storedUid, role: storedRole });
        } else {
          console.log("❌ No active session");
          setUser(null);
          setUid(null);
          setRole(null);
          setUserName(null);
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      if (role === "owner") {
        await signOut(auth);
      }

      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      setUser(null);
      setUid(null);
      setRole(null);
      setUserName(null);

      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, uid, role, userName, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
