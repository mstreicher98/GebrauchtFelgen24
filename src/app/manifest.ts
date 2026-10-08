import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GebrauchtFelgen24",
    short_name: "Felgen24",
    description: "Gebrauchte Felgen & Kompletträder für Auto und Motorrad kaufen und verkaufen.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    lang: "de",
    categories: ["shopping", "auto"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Felgen suchen", url: "/suche" },
      { name: "Inserieren", url: "/inserat/neu" },
      { name: "Nachrichten", url: "/nachrichten" },
    ],
  };
}
