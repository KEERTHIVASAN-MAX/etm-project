import { BRANDING } from "@/lib/branding"

export function CompanyFooter() {
  return (
    <div className="border-t border-border pt-4 text-center text-xs text-foreground/60 space-y-1">
      <p className="font-semibold text-foreground">{BRANDING.companyName}</p>
      {BRANDING.address.line1 && <p>{BRANDING.address.line1}</p>}
      {BRANDING.address.line2 && <p>{BRANDING.address.line2}</p>}
      {BRANDING.address.line3 && <p>{BRANDING.address.line3}</p>}
      {BRANDING.address.line4 && <p>{BRANDING.address.line4}</p>}
    </div>
  )
}
