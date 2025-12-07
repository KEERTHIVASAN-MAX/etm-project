export const BRANDING = {
  companyName: "Spinz Soda",
  tagline: "Fresh. Fast. Fizzy.",
  address: {
    line1: "10/1/9, Beodnabad",
    line2: "Andaman and Nicobar Islands",
    line3: "Port Blair, South Andamans",
    line4: "Near Army Gate - 744105",
    full: "10/1/9, Beodnabad Andaman and Nicobar Islands, Port Blair South Andamans, Near Army Gate-744101",
  },
  colors: {
    primary: "#1D4ED8",
    primaryDark: "#1E40AF",
    accent: "#22C55E",
    accentLight: "#4ADE80",
  },
  social: {
    whatsapp: "919476240000", // Example - replace with actual number
  },
}

export function getCompanyHeader() {
  return `${BRANDING.companyName} - ${BRANDING.tagline}`
}

export function formatAddress() {
  return [BRANDING.address.line1, BRANDING.address.line2, BRANDING.address.line3, BRANDING.address.line4]
}
