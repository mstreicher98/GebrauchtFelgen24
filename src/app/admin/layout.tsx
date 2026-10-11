import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Admin · GebrauchtFelgen24", template: "%s · Admin GebrauchtFelgen24" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
