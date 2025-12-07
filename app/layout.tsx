import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { AutoLogin } from "@/components/auto-login"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Spinz Soda ETM",
  description: "Smart Billing and Store Management System",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spinz ETM",
  },
  icons: {
    icon: "/spinz-logo.png",
    apple: "/spinz-logo.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <AutoLogin />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
