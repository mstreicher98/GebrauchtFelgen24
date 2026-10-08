import localFont from "next/font/local";

// Inter (Fließtext) & Saira (Überschriften, Logo-Schrift) – SIL Open Font License, selbst gehostet
export const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const saira = localFont({
  src: "./fonts/saira-latin.woff2",
  weight: "100 900",
  variable: "--font-saira",
  display: "swap",
  adjustFontFallback: "Arial",
});
