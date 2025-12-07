"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { OwnerLogin } from "./owner-login"
import { StaffLogin } from "./staff-login"

interface LoginPageProps {
  onLogin?: (role: "owner" | "staff", name: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loginType, setLoginType] = useState<"owner" | "staff" | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!loginType ? (
          <Card className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 relative">
                <Image src="/spinz-logo.png" alt="Spinz Logo" fill className="object-contain" priority />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-primary">Spinz Soda</h1>
                <p className="text-sm text-foreground/60">Electronic Ticketing Machine</p>
              </div>
            </div>

            <div className="bg-background/50 rounded-lg p-4 text-center">
              <p className="text-xs text-foreground/70">Company Address</p>
              <p className="text-xs font-medium text-foreground mt-1">
                Beodnabad Andaman and Nicobar Islands, Port Blair South Andamans, Near Army Gate-744105
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setLoginType("staff")}
                className="w-full bg-accent hover:bg-accent-light text-background h-12 font-semibold"
              >
                Staff Login
              </Button>
              <Button
                onClick={() => setLoginType("owner")}
                className="w-full bg-primary hover:bg-blue-700 text-white h-12 font-semibold"
              >
                Owner Login
              </Button>
            </div>

            <div className="text-center text-xs text-foreground/50">
              <p className="font-medium">Spinz Soda ETM</p>
              <p>Fresh. Fast. Fizzy. (v1.0.2)</p>
            </div>
          </Card>
        ) : loginType === "staff" ? (
          <StaffLogin onBack={() => setLoginType(null)} />
        ) : (
          <OwnerLogin onBack={() => setLoginType(null)} />
        )}
      </div>
    </div>
  )
}
