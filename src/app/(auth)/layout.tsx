import { HeroRim } from "@/components/hero-rim";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="carbon relative overflow-hidden">
      <div className="pointer-events-none absolute -right-48 top-10 hidden w-[36rem] opacity-25 lg:block">
        <HeroRim />
      </div>
      <div className="container-page relative flex min-h-[75vh] items-center justify-center py-12">
        <div className="card animate-rise w-full max-w-md p-6 shadow-[var(--shadow)] sm:p-8">{children}</div>
      </div>
    </div>
  );
}
