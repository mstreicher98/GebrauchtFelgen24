import { clsx } from "clsx";
import { ArrowRight, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { SiteBannerData } from "@/lib/site-banner";

const TONE = {
  info: { cls: "bg-brand-soft text-brand", Icon: Info },
  warnung: { cls: "bg-red-soft text-red", Icon: TriangleAlert },
  erfolg: { cls: "bg-green-soft text-green", Icon: CircleCheck },
} as const;

/** Hinweis-Leiste über der Kopfzeile (vom Admin-Team gesetzt). */
export function SiteBanner({ banner }: { banner: SiteBannerData }) {
  const { cls, Icon } = TONE[banner.tone] ?? TONE.info;
  return (
    <div role="status" className={clsx("border-b border-line text-sm", cls)}>
      <div className="container-page flex items-center justify-center gap-2 py-2 text-center">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 font-medium text-pretty">
          {banner.text}
          {banner.link && (
            <a href={banner.link} className="ml-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              Mehr erfahren <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
