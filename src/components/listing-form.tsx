"use client";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Bike, Car, Check, CircleDot, Disc3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveListing } from "@/app/actions/listings";
import { CAR_DIAMETERS, COMMON_PCDS, CONDITIONS, MATERIALS, MOTO_DIAMETERS, RIM_BRANDS, SEASONS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { fieldErrors, listingSchema } from "@/lib/listing-schema";
import type { ListingFormValues } from "@/lib/listing-form-values";
import { FitmentSelector } from "./fitment-selector";
import { ImageUploader } from "./image-uploader";
import { PlzInput } from "./plz-input";
import { toast } from "./toaster";

const STEPS = [
  { key: "art", label: "Art", fields: ["vehicleType", "kind"] },
  { key: "fotos", label: "Fotos", fields: ["imageKeys"] },
  { key: "felge", label: "Felge", fields: ["rimBrand", "rimModel", "material", "diameter", "width", "pcd", "et", "centerBore", "quantity", "condition", "fitments", "tireSize", "tireBrand", "season", "treadDepth", "dot"] },
  { key: "preis", label: "Preis & Text", fields: ["price", "priceType", "shipping", "pickup", "shippingCost", "zip", "title", "description"] },
] as const;

function suggestTitle(v: ListingFormValues) {
  const size = v.width && v.diameter ? `${formatNumber(Number(v.width.replace(",", ".")))}x${v.diameter}` : v.diameter ? `${v.diameter} Zoll` : "";
  const parts = [
    v.rimBrand && v.rimBrand !== "Original (OEM)" ? v.rimBrand : v.rimBrand ? "Original" : "",
    v.rimModel,
    size,
    v.vehicleType === "auto" && v.et ? `ET${v.et}` : "",
    v.vehicleType === "auto" ? v.pcd : "",
  ];
  let t = parts.filter(Boolean).join(" ");
  if (v.kind === "komplettrad") t += ` ${v.season ? SEASONS[v.season as keyof typeof SEASONS] + "-" : ""}Kompletträder`;
  else if (v.vehicleType === "motorrad" && v.wheelPosition !== "alle") t += v.wheelPosition === "vorne" ? " Vorderrad" : " Hinterrad";
  if (v.fitments[0]) t += ` für ${v.fitments[0].label.replace(/\s*\((seit )?\d{4}[^)]*\)\s*$/, "")}`;
  return t.trim().slice(0, 90);
}

export function ListingForm({ initial, listingId, userPhone }: { initial: ListingFormValues; listingId?: number; userPhone?: string | null }) {
  const [v, setV] = useState<ListingFormValues>(initial);
  const [step, setStep] = useState(listingId ? 2 : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [titleTouched, setTitleTouched] = useState(!!initial.title);
  const router = useRouter();

  const set = <K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  const autoTitle = useMemo(() => suggestTitle(v), [v]);
  const title = titleTouched ? v.title : autoTitle;

  const payload = () => ({ ...v, title, fitments: v.fitments.map((f) => f.id) });

  const validateStep = (s: number) => {
    const r = listingSchema.safeParse(payload());
    if (r.success) return true;
    const all = fieldErrors(r.error);
    const relevant = Object.fromEntries(Object.entries(all).filter(([k]) => (STEPS[s].fields as readonly string[]).includes(k)));
    setErrors(relevant);
    if (Object.keys(relevant).length) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true], [data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    for (let s = 0; s < STEPS.length; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    start(async () => {
      const r = await saveListing(listingId ?? null, payload());
      if (r.ok) {
        toast(listingId ? "Änderungen gespeichert" : "Dein Inserat ist online! 🎉");
        router.push(r.url);
        router.refresh();
      } else {
        setErrors(r.errors);
        if (r.errors._) toast(r.errors._, "error");
        const firstStep = STEPS.findIndex((st) => (st.fields as readonly string[]).some((f) => r.errors[f]));
        if (firstStep >= 0) setStep(firstStep);
      }
    });
  };

  const isCar = v.vehicleType === "auto";
  const diameters = v.vehicleType === "motorrad" ? MOTO_DIAMETERS : CAR_DIAMETERS;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Fortschritt */}
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Fortschritt">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              disabled={i > step && !listingId}
              onClick={() => (i < step || listingId ? setStep(i) : undefined)}
              className="group w-full text-left"
              aria-current={i === step ? "step" : undefined}
            >
              <span className={clsx("block h-1.5 rounded-full transition-all duration-500", i <= step ? "bg-brand" : "bg-surface-3")} />
              <span className={clsx("mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider", i === step ? "text-fg" : "text-faint")}>
                {i < step ? <Check className="h-3.5 w-3.5 text-brand" /> : <span>{i + 1}.</span>}
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div key={step} className="animate-fade-up">
        {/* SCHRITT 1 */}
        {step === 0 && (
          <div className="space-y-8">
            <Block title="Für welches Fahrzeug?" error={errors.vehicleType}>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["auto", "Auto", Car, "PKW, SUV, Transporter"],
                    ["motorrad", "Motorrad", Bike, "Motorrad & Roller"],
                  ] as const
                ).map(([val, label, Icon, sub]) => (
                  <BigChoice key={val} active={v.vehicleType === val} onClick={() => setV((s) => ({ ...s, vehicleType: val, fitments: s.vehicleType === val ? s.fitments : [], quantity: val === "motorrad" ? "1" : "4" }))} icon={<Icon className="h-8 w-8" />} label={label} sub={sub} />
                ))}
              </div>
            </Block>
            <Block title="Was verkaufst du?" error={errors.kind}>
              <div className="grid grid-cols-2 gap-3">
                <BigChoice active={v.kind === "felge"} onClick={() => set("kind", "felge")} icon={<Disc3 className="h-8 w-8" />} label="Felgen" sub="ohne Reifen" />
                <BigChoice active={v.kind === "komplettrad"} onClick={() => set("kind", "komplettrad")} icon={<CircleDot className="h-8 w-8" />} label="Kompletträder" sub="Felge mit Reifen" />
              </div>
            </Block>
          </div>
        )}

        {/* SCHRITT 2 */}
        {step === 1 && (
          <Block title="Fotos" sub="Bis zu 12 Fotos. Gute Fotos verkaufen schneller!" error={errors.imageKeys}>
            <ImageUploader value={v.imageKeys} onChange={(k) => set("imageKeys", k)} invalid={!!errors.imageKeys} />
          </Block>
        )}

        {/* SCHRITT 3 */}
        {step === 2 && (
          <div className="space-y-8">
            <Block title="Felge">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Felgenmarke" error={errors.rimBrand}>
                  <input className="input" list="rim-brands" value={v.rimBrand} onChange={(e) => set("rimBrand", e.target.value)} placeholder="z. B. BBS oder Original (OEM)" aria-invalid={!!errors.rimBrand} />
                  <datalist id="rim-brands">
                    {RIM_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Modell / Design (optional)">
                  <input className="input" value={v.rimModel} onChange={(e) => set("rimModel", e.target.value)} placeholder="z. B. CH-R, Austin" />
                </Field>
                <Field label="Material" error={errors.material}>
                  <select className="select" value={v.material} onChange={(e) => set("material", e.target.value)}>
                    {Object.entries(MATERIALS)
                      .filter(([k]) => isCar ? k !== "speiche" : true)
                      .map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Zustand" error={errors.condition}>
                  <select className="select" value={v.condition} onChange={(e) => set("condition", e.target.value)}>
                    {Object.entries(CONDITIONS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Block>

            <Block title="Maße" sub="Die Daten findest du meist auf der Innenseite der Felge eingeprägt, z. B. „8Jx18 ET45 5x112“.">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Durchmesser (Zoll)" error={errors.diameter}>
                  <select className="select" value={v.diameter} onChange={(e) => set("diameter", e.target.value)} aria-invalid={!!errors.diameter}>
                    <option value="">Bitte wählen</option>
                    {diameters.map((d) => (
                      <option key={d} value={d}>
                        {d}&quot;
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Breite (J)" error={errors.width}>
                  <input className="input" inputMode="decimal" value={v.width} onChange={(e) => set("width", e.target.value)} placeholder={isCar ? "z. B. 8,5" : "z. B. 3,50"} aria-invalid={!!errors.width} />
                </Field>
                {isCar && (
                  <>
                    <Field label="Lochkreis" error={errors.pcd}>
                      <input className="input" list="pcds" value={v.pcd} onChange={(e) => set("pcd", e.target.value.replace(/\s/g, "").replace(",", ".").replace("×", "x"))} placeholder="z. B. 5x112" aria-invalid={!!errors.pcd} />
                      <datalist id="pcds">
                        {COMMON_PCDS.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                    </Field>
                    <Field label="Einpresstiefe (ET)" error={errors.et}>
                      <input className="input" inputMode="numeric" value={v.et} onChange={(e) => set("et", e.target.value)} placeholder="z. B. 45" aria-invalid={!!errors.et} />
                    </Field>
                    <Field label="Mittenloch (mm)" error={errors.centerBore} hint="optional, verbessert die Passungsprüfung">
                      <input className="input" inputMode="decimal" value={v.centerBore} onChange={(e) => set("centerBore", e.target.value)} placeholder="z. B. 57,1" />
                    </Field>
                  </>
                )}
                <Field label="Anzahl" error={errors.quantity}>
                  <select className="select" value={v.quantity} onChange={(e) => set("quantity", e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} Stück
                      </option>
                    ))}
                  </select>
                </Field>
                {!isCar && (
                  <Field label="Position">
                    <select className="select" value={v.wheelPosition} onChange={(e) => set("wheelPosition", e.target.value as ListingFormValues["wheelPosition"])}>
                      <option value="vorne">Vorderrad</option>
                      <option value="hinten">Hinterrad</option>
                      <option value="alle">Satz (vorne + hinten)</option>
                    </select>
                  </Field>
                )}
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={v.hasCertificate} onChange={(e) => set("hasCertificate", e.target.checked)} />
                Gutachten / ABE / Teilegutachten vorhanden
              </label>
            </Block>

            <Block
              title={isCar ? "Passend für (optional)" : "Passend für"}
              sub={isCar ? "Von welchem Fahrzeug stammen die Felgen? Hilft Käufern bei der Suche." : "Motorradfelgen passen meist nur modellspezifisch – bitte mindestens ein Modell angeben."}
              error={errors.fitments}
            >
              <FitmentSelector type={v.vehicleType || "auto"} value={v.fitments} onChange={(f) => set("fitments", f)} invalid={!!errors.fitments} />
            </Block>

            {v.kind === "komplettrad" && (
              <Block title="Reifen">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Reifengröße" error={errors.tireSize} className="col-span-2 sm:col-span-1">
                    <input className="input" value={v.tireSize} onChange={(e) => set("tireSize", e.target.value)} placeholder={isCar ? "z. B. 225/45 R18 95Y" : "z. B. 180/55 ZR17"} aria-invalid={!!errors.tireSize} />
                  </Field>
                  <Field label="Reifenmarke">
                    <input className="input" value={v.tireBrand} onChange={(e) => set("tireBrand", e.target.value)} placeholder="z. B. Michelin" />
                  </Field>
                  <Field label="Saison" error={errors.season}>
                    <select className="select" value={v.season} onChange={(e) => set("season", e.target.value)} aria-invalid={!!errors.season}>
                      <option value="">Bitte wählen</option>
                      {Object.entries(SEASONS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Profiltiefe (mm)" error={errors.treadDepth}>
                    <input className="input" inputMode="decimal" value={v.treadDepth} onChange={(e) => set("treadDepth", e.target.value)} placeholder="z. B. 6" aria-invalid={!!errors.treadDepth} />
                  </Field>
                  <Field label="DOT (Produktionswoche)" error={errors.dot} hint="4 Ziffern, z. B. 2321">
                    <input className="input" inputMode="numeric" maxLength={4} value={v.dot} onChange={(e) => set("dot", e.target.value.replace(/\D/g, ""))} placeholder="KWJJ" />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-2 self-end pb-3 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={v.tpms} onChange={(e) => set("tpms", e.target.checked)} />
                    RDKS-Sensoren verbaut
                  </label>
                </div>
              </Block>
            )}
          </div>
        )}

        {/* SCHRITT 4 */}
        {step === 3 && (
          <div className="space-y-8">
            <Block title="Preis">
              <div className="grid grid-cols-2 gap-4">
                <Field label={`Preis gesamt (€)${Number(v.quantity) > 1 ? ` für ${v.quantity} Stück` : ""}`} error={errors.price}>
                  <input className="input text-lg font-semibold" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="z. B. 650" aria-invalid={!!errors.price} />
                </Field>
                <Field label="Preisart">
                  <div className="grid grid-cols-2 gap-2">
                    {(["vb", "fest"] as const).map((p) => (
                      <button key={p} type="button" className="chip justify-center py-2.5" data-active={v.priceType === p} onClick={() => set("priceType", p)}>
                        {p === "vb" ? "VB" : "Festpreis"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Block>

            <Block title="Übergabe & Standort" error={errors.pickup}>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip" data-active={v.pickup} onClick={() => set("pickup", !v.pickup)}>
                  Abholung
                </button>
                <button type="button" className="chip" data-active={v.shipping} onClick={() => set("shipping", !v.shipping)}>
                  Versand
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Standort (PLZ)" error={errors.zip}>
                  <PlzInput
                    value={v.zip}
                    initialLabel={v.zipLabel}
                    invalid={!!errors.zip}
                    onChange={(zip, country, place) => {
                      setV((s) => ({ ...s, zip, country: (country as ListingFormValues["country"]) ?? s.country, zipLabel: place ?? s.zipLabel }));
                    }}
                  />
                </Field>
                {v.shipping && (
                  <Field label="Versandkosten (€, optional)">
                    <input className="input" inputMode="decimal" value={v.shippingCost} onChange={(e) => set("shippingCost", e.target.value)} placeholder="z. B. 30" />
                  </Field>
                )}
              </div>
              {userPhone && (
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={v.showPhone} onChange={(e) => set("showPhone", e.target.checked)} />
                  Telefonnummer ({userPhone}) im Inserat anzeigen
                </label>
              )}
            </Block>

            <Block title="Titel & Beschreibung">
              <Field label="Titel" error={errors.title} hint={!titleTouched ? "Automatisch erstellt – du kannst ihn anpassen." : `${title.length}/90`}>
                <div className="relative">
                  <input
                    className="input pr-10"
                    value={title}
                    maxLength={90}
                    onChange={(e) => {
                      setTitleTouched(true);
                      set("title", e.target.value);
                    }}
                    aria-invalid={!!errors.title}
                  />
                  {!titleTouched && <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />}
                </div>
              </Field>
              <Field label="Beschreibung" className="mt-4" hint={`${v.description.length}/4000`}>
                <textarea
                  className="textarea min-h-40"
                  maxLength={4000}
                  value={v.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Zustand, Schäden, Grund des Verkaufs, Zubehör (Zentrierringe, Schrauben, Nabendeckel) …"
                />
              </Field>
            </Block>
          </div>
        )}
      </div>

      {errors._ && <p className="mt-6 rounded-xl bg-red-soft px-4 py-3 text-sm text-red">{errors._}</p>}

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-10 flex items-center justify-between gap-3 rounded-full border border-line bg-surface/90 p-2 backdrop-blur md:bottom-4">
        <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        {step < STEPS.length - 1 ? (
          <div className="flex gap-2">
            {listingId && (
              <button type="button" className="btn btn-outline" onClick={submit} disabled={pending}>
                Speichern
              </button>
            )}
            <button type="button" className="btn btn-brand" onClick={next}>
              Weiter <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-brand" onClick={submit} disabled={pending}>
            {pending ? "Speichere …" : listingId ? "Änderungen speichern" : "Jetzt veröffentlichen"}
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Block({ title, sub, error, children }: { title: string; sub?: string; error?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl uppercase tracking-wide">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      <div className="mt-4">{children}</div>
      {error && <p className="mt-3 text-sm text-red" data-error>{error}</p>}
    </section>
  );
}

function Field({ label, error, hint, className, children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red">{error}</p> : hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

function BigChoice({ active, onClick, icon, label, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-300 sm:p-7",
        active ? "scale-[1.02] border-brand bg-brand-soft text-brand shadow-[var(--shadow-brand)]" : "border-line text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {icon}
      <span className="font-display text-lg font-semibold uppercase tracking-wide text-fg">{label}</span>
      <span className="text-xs">{sub}</span>
    </button>
  );
}
