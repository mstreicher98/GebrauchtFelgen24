"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Fallback für ältere Browser: blendet `.reveal`-Elemente per IntersectionObserver ein. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    // Browser mit scroll-gesteuerten CSS-Animationen brauchen kein JavaScript
    if (CSS.supports("animation-timeline: view()")) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    const scan = () => document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}
