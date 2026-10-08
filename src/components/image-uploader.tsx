"use client";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, ImagePlus, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_IMAGES } from "@/lib/constants";
import { imageUrl } from "@/lib/image-url";
import { Spinner } from "./logo";

/** Verkleinert Fotos im Browser (spart Datenvolumen am Handy). Fällt bei Fehlern auf das Original zurück. */
async function downscale(file: File, max = 2400): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 3_000_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File, purpose: "inserat" | "chat" = "inserat") {
  const blob = await downscale(file);
  const fd = new FormData();
  fd.append("file", blob, file.name.replace(/\.\w+$/, ".jpg"));
  const r = await fetch(`/api/upload${purpose === "chat" ? "?zweck=chat" : ""}`, { method: "POST", body: fd });
  const data = await r.json().catch(() => ({ error: "Upload fehlgeschlagen" }));
  if (!r.ok) throw new Error(data.error ?? "Upload fehlgeschlagen");
  return data as { key: string; width: number; height: number };
}

type Item = { id: string; key?: string; preview?: string; error?: string };

export function ImageUploader({ value, onChange, invalid }: { value: string[]; onChange: (keys: string[]) => void; invalid?: boolean }) {
  const [pending, setPending] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const keysRef = useRef(value);
  keysRef.current = value;

  const add = async (files: FileList | File[]) => {
    const free = MAX_IMAGES - keysRef.current.length - pending.length;
    const list = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).slice(0, Math.max(0, free));
    const items = list.map((f) => ({ id: Math.random().toString(36).slice(2), preview: URL.createObjectURL(f), file: f }));
    setPending((p) => [...p, ...items]);
    await Promise.all(
      items.map(async (it) => {
        try {
          const res = await uploadImage(it.file);
          keysRef.current = [...keysRef.current, res.key];
          onChange(keysRef.current);
          setPending((p) => p.filter((x) => x.id !== it.id));
        } catch (err) {
          setPending((p) => p.map((x) => (x.id === it.id ? { ...x, error: (err as Error).message } : x)));
        } finally {
          setTimeout(() => URL.revokeObjectURL(it.preview), 5000);
        }
      }),
    );
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((key, i) => (
          <div
            key={key}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null) move(dragIdx, i);
              setDragIdx(null);
            }}
            className={clsx("animate-scale-in group relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-2", i === 0 ? "border-gold" : "border-transparent")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(key, 400)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="badge absolute left-1.5 top-1.5 bg-gold text-on-gold">
                <Star className="h-3 w-3" /> Titelbild
              </span>
            )}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== key))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white" aria-label="Foto entfernen">
              <X className="h-4 w-4" />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white disabled:opacity-30" aria-label="Nach vorne">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} className="grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white disabled:opacity-30" aria-label="Nach hinten">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.preview && <img src={p.preview} alt="" className="h-full w-full object-cover opacity-40" />}
            <div className="absolute inset-0 grid place-items-center p-2 text-center">
              {p.error ? (
                <div>
                  <p className="text-xs text-red">{p.error}</p>
                  <button type="button" className="mt-1 text-xs underline" onClick={() => setPending((x) => x.filter((y) => y.id !== p.id))}>
                    Entfernen
                  </button>
                </div>
              ) : (
                <Spinner className="h-8 w-8" />
              )}
            </div>
          </div>
        ))}
        {value.length + pending.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length) void add(e.dataTransfer.files);
            }}
            className={clsx(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm text-muted transition-all hover:border-gold hover:text-gold",
              drag ? "scale-[1.02] border-gold bg-gold-soft text-gold" : invalid ? "border-red" : "border-line-strong",
            )}
          >
            <ImagePlus className="h-7 w-7" />
            <span>Fotos hinzufügen</span>
            <span className="text-xs text-faint">
              {value.length}/{MAX_IMAGES}
            </span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void add(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-faint">
        Tipp: Fotografiere die Felgen von vorne, die Innenseite mit Stempel (Größe, ET, Lochkreis) und eventuelle Schäden. Das erste Foto ist das Titelbild – per Pfeil oder Drag &amp; Drop sortieren.
      </p>
    </div>
  );
}
