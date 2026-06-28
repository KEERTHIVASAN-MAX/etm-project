"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Phone, Lock, Printer, Bluetooth } from "lucide-react"
import { toast } from "sonner"
import { verifyStaffCredentials } from "../../lib/staff-service"
import { connectBluetoothPrinter, getConnectedPrinter } from "../../lib/bluetooth-printer"

interface StaffLoginProps {
  onBack: () => void
}

export function StaffLogin({ onBack }: StaffLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [printerConnected, setPrinterConnected] = useState(false)

  useEffect(() => {
    const { char } = getConnectedPrinter()
    setPrinterConnected(!!char)
  }, [])

  const handleConnectPrinter = async () => {
    try {
      await connectBluetoothPrinter()
      setPrinterConnected(true)
      toast.success("Printer connected successfully!")
    } catch (error) {
      toast.error("Failed to connect printer")
    }
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber || !password) {
      toast.error("Please fill all fields")
      return
    }

    setLoading(true)
    try {
      // Verify staff credentials against staff members added by owner
      const staffMember = await verifyStaffCredentials(phoneNumber, password)

      if (!staffMember) {
        toast.error("Invalid credentials. Contact owner to add you as staff.")
        return
      }

      // Login successful - staff member exists
      localStorage.setItem("uid", phoneNumber)
      localStorage.setItem("role", "staff")
      localStorage.setItem("userName", staffMember.name)
      localStorage.setItem("staffPhone", phoneNumber)
      localStorage.setItem("lastLoginTime", Date.now().toString())

      console.log("✅ Staff login successful:", {
        uid: phoneNumber,
        role: "staff",
        userName: staffMember.name
      })

      toast.success(`Welcome back, ${staffMember.name}!`)

      // Force reload to refresh auth context
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error("Staff login error:", error)
      toast.error("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
          ←
        </Button>
        <h2 className="text-2xl font-bold text-primary">Staff Login</h2>
      </div>

      <form onSubmit={handleStaffLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg">
            <Phone size={18} className="text-foreground/40" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="9876543210"
              className="flex-1 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg">
            <Lock size={18} className="text-foreground/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 outline-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-background h-12 font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="border-t border-border pt-4 mt-4 space-y-2">
        <p className="text-xs text-muted-foreground text-center">Need to connect a printer?</p>
        <Button
          type="button"
          onClick={handleConnectPrinter}
          className={`w-full flex items-center justify-center gap-2 font-semibold h-12 rounded-xl transition-all ${
            printerConnected
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {printerConnected ? <Printer size={18} /> : <Bluetooth size={18} />}
          {printerConnected ? "Printer Ready" : "Connect Printer"}
        </Button>
      </div>
    </Card>
  )
}
