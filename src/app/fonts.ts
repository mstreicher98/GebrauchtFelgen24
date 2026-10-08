import localFont from "next/font/local";

// Inter & Oswald (SIL Open Font License), selbst gehostet – keine Anfragen an Google
export const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const oswald = localFont({
  src: "./fonts/oswald-latin.woff2",
  weight: "200 700",
  variable: "--font-oswald",
  display: "swap",
  adjustFontFallback: "Arial",
});
