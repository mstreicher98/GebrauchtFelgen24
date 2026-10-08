"use client";
import { clsx } from "clsx";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import { toast } from "./toaster";

export function FavoriteButton({
  listingId,
  initial,
  variant = "overlay",
}: {
  listingId: number;
  initial: boolean;
  variant?: "overlay" | "button";
}) {
  const [fav, setFav] = useState(initial);
  const [anim, setAnim] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    setAnim((a) => a + 1);
    start(async () => {
      const res = await toggleFavorite(listingId, next);
      if (res.error === "login") {
        setFav(!next);
        router.push(`/anmelden?weiter=${encodeURIComponent(location.pathname)}`);
      } else if (res.error) {
        setFav(!next);
        toast(res.error, "error");
      } else {
        toast(next ? "Zur Merkliste hinzugefügt" : "Von der Merkliste entfernt", "info");
      }
    });
  };

  if (variant === "button") {
    return (
      <button type="button" onClick={onClick} disabled={pending} className={clsx("btn btn-outline", fav && "border-brand text-brand")}>
        <Heart key={anim} className={clsx("h-5 w-5", fav && "animate-pop fill-current")} />
        {fav ? "Gemerkt" : "Merken"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Von Merkliste entfernen" : "Zur Merkliste hinzufügen"}
      className="relative z-10 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-transform hover:scale-110"
    >
      <Heart key={anim} className={clsx("h-[1.1rem] w-[1.1rem]", fav && "animate-pop fill-red text-red")} />
    </button>
  );
}
