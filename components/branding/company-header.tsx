import Image from "next/image"
import { BRANDING } from "@/lib/branding"

export function CompanyHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-white shadow-sm">
        <Image src="/spinz-logo.png" alt="Spinz Logo" fill className="object-contain p-1" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">{BRANDING.companyName}</h1>
        <p className="text-xs text-foreground/60">{BRANDING.tagline}</p>
      </div>
    </div>
  )
}
