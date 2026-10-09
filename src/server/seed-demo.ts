import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import {
  account,
  listing,
  listingFitment,
  listingImage,
  user,
  vehicleGeneration,
  vehicleMake,
  vehicleModel,
} from "@/db/schema";
import { env } from "@/lib/env";
import { processAndStoreImage } from "@/lib/images";
import { lookupPostalCode } from "@/lib/search";
import { DEMO_STYLES, rimSvg } from "./rim-art";

type DemoListing = {
  seller: 0 | 1 | 2;
  vehicleType: "auto" | "motorrad";
  kind: "felge" | "komplettrad";
  title: string;
  description: string;
  material: "alu" | "stahl" | "geschmiedet" | "speiche";
  rimBrand: string;
  rimModel?: string;
  diameter: number;
  width: number;
  pcd?: [number, number];
  et?: number;
  centerBore?: number;
  quantity: number;
  wheelPosition?: "alle" | "vorne" | "hinten";
  condition: "neu" | "neuwertig" | "gebraucht" | "beschaedigt";
  hasCertificate?: boolean;
  tireSize?: string;
  tireBrand?: string;
  season?: "sommer" | "winter" | "ganzjahr";
  treadDepth?: number;
  dot?: string;
  tpms?: boolean;
  price: number;
  priceType: "fest" | "vb";
  shipping: boolean;
  zip: string;
  country: "AT" | "DE" | "CH";
  fits?: [string, string, string][]; // [Marke, Modell, Generation]
  style: number;
  featured?: boolean;
  daysAgo: number;
};

const DEMO: DemoListing[] = [
  { seller: 1, vehicleType: "auto", kind: "felge", title: "BBS CH-R 8,5x19 ET45 5x112 – Satz, Satin Black", hasCertificate: true, description: "Verkaufe einen Satz BBS CH-R in Satin Black. Keine Bordsteinschäden, nur leichte Gebrauchsspuren. Mit Gutachten. Passend z. B. für VW Golf 7/8, Audi A3, Skoda Octavia (Eintragung je nach Fahrzeug).", material: "alu", rimBrand: "BBS", rimModel: "CH-R", diameter: 19, width: 8.5, pcd: [5, 112], et: 45, centerBore: 82, quantity: 4, condition: "neuwertig", price: 1290, priceType: "vb", shipping: true, zip: "1100", country: "AT", style: 1, featured: true, daysAgo: 1, fits: [["Volkswagen", "Golf", "Golf VII (5G)"], ["Audi", "A3", "A3 (8V)"]] },
  { seller: 0, vehicleType: "auto", kind: "komplettrad", title: "Original VW Golf 7 GTI „Austin\" 18 Zoll Winterkompletträder", description: "Original VW Austin Felgen mit Continental WinterContact TS850P, ca. 6 mm Profil. Inkl. RDKS-Sensoren. Wurden nur 2 Winter gefahren.", material: "alu", rimBrand: "Original (OEM)", rimModel: "Austin", diameter: 18, width: 7.5, pcd: [5, 112], et: 49, centerBore: 57.1, quantity: 4, condition: "gebraucht", tireSize: "225/40 R18 92V", tireBrand: "Continental", season: "winter", treadDepth: 6, dot: "3921", tpms: true, price: 890, priceType: "vb", shipping: false, zip: "8010", country: "AT", style: 3, daysAgo: 2, fits: [["Volkswagen", "Golf", "Golf VII (5G)"]] },
  { seller: 2, vehicleType: "auto", kind: "felge", title: "BMW M Doppelspeiche 791M 19\" Mischbereifung G20/G21", description: "Original BMW M Performance Felgen 791M in Jet Black. Vorne 8x19 ET27, hinten 8,5x19 ET40. Ein Rad mit minimaler Bordsteinberührung (siehe Fotos).", material: "alu", rimBrand: "Original (OEM)", rimModel: "791M", diameter: 19, width: 8, pcd: [5, 112], et: 27, centerBore: 66.6, quantity: 4, condition: "gebraucht", price: 1450, priceType: "vb", shipping: true, zip: "80331", country: "DE", style: 5, daysAgo: 3, fits: [["BMW", "3er", "3er (G20/G21)"], ["BMW", "4er", "4er (G22/G23/G26)"]] },
  { seller: 1, vehicleType: "auto", kind: "komplettrad", title: "Mercedes C-Klasse W205 AMG 18\" Sommerräder Michelin", description: "AMG 5-Doppelspeichen-Räder mit Michelin Pilot Sport 4, Profil 5 mm. Mischbereifung. Händlerware, gereinigt und gewuchtet. Versand möglich.", material: "alu", rimBrand: "Original (OEM)", rimModel: "AMG", diameter: 18, width: 7.5, pcd: [5, 112], et: 44, centerBore: 66.6, quantity: 4, condition: "gebraucht", tireSize: "225/45 R18 95Y", tireBrand: "Michelin", season: "sommer", treadDepth: 5, dot: "1222", tpms: true, price: 1190, priceType: "fest", shipping: true, zip: "1100", country: "AT", style: 0, featured: true, daysAgo: 1, fits: [["Mercedes-Benz", "C-Klasse", "C-Klasse (W205)"]] },
  { seller: 0, vehicleType: "auto", kind: "felge", title: "Stahlfelgen 6,5x16 5x112 ET46 für Golf / Octavia / Leon", description: "4 Stahlfelgen, ideal für Winterräder. Leichter Flugrost, sonst top.", material: "stahl", rimBrand: "Original (OEM)", diameter: 16, width: 6.5, pcd: [5, 112], et: 46, centerBore: 57.1, quantity: 4, condition: "gebraucht", price: 120, priceType: "vb", shipping: false, zip: "4020", country: "AT", style: 6, daysAgo: 4 },
  { seller: 2, vehicleType: "auto", kind: "felge", title: "OZ Ultraleggera 8x18 ET45 5x112 Matt Graphite", hasCertificate: true, description: "Leichtbau-Klassiker von OZ. 4 Stück, keine Schäden, mit ABE. Zentrierringe 57,1 mm liegen bei.", material: "alu", rimBrand: "OZ Racing", rimModel: "Ultraleggera", diameter: 18, width: 8, pcd: [5, 112], et: 45, centerBore: 75, quantity: 4, condition: "neuwertig", price: 980, priceType: "vb", shipping: true, zip: "70173", country: "DE", style: 1, daysAgo: 5 },
  { seller: 1, vehicleType: "auto", kind: "komplettrad", title: "Tesla Model 3 Aero 18\" Winterkompletträder mit TPMS", description: "Originale Aero-Felgen inkl. Kappen mit Pirelli Sottozero 3. Profil 7 mm. TPMS-Sensoren verbaut.", material: "alu", rimBrand: "Original (OEM)", rimModel: "Aero", diameter: 18, width: 8.5, pcd: [5, 114.3], et: 40, centerBore: 64.1, quantity: 4, condition: "neuwertig", tireSize: "235/45 R18 98V", tireBrand: "Pirelli", season: "winter", treadDepth: 7, dot: "4022", tpms: true, price: 1350, priceType: "vb", shipping: false, zip: "5020", country: "AT", style: 4, featured: true, daysAgo: 0, fits: [["Tesla", "Model 3", "Model 3"]] },
  { seller: 0, vehicleType: "auto", kind: "felge", title: "Audi A4 B9 S-Line 18\" Originalfelgen 8x18", description: "Originale Audi Felgen vom A4 B9, 5x112, Mittenloch 66,5. Ohne Reifen.", material: "alu", rimBrand: "Original (OEM)", diameter: 18, width: 8, pcd: [5, 112], et: 40, centerBore: 66.5, quantity: 4, condition: "gebraucht", price: 590, priceType: "vb", shipping: true, zip: "6020", country: "AT", style: 0, daysAgo: 6, fits: [["Audi", "A4", "A4 (B9/8W)"]] },
  { seller: 2, vehicleType: "auto", kind: "komplettrad", title: "Ganzjahresräder Skoda Octavia 4 – 16 Zoll", description: "Kompletträder mit Goodyear Vector 4Seasons Gen-3, 6 mm. Originalfelgen „Velorum\".", material: "alu", rimBrand: "Original (OEM)", rimModel: "Velorum", diameter: 16, width: 6.5, pcd: [5, 112], et: 46, centerBore: 57.1, quantity: 4, condition: "gebraucht", tireSize: "205/55 R16 91H", tireBrand: "Goodyear", season: "ganzjahr", treadDepth: 6, dot: "2321", tpms: false, price: 540, priceType: "fest", shipping: false, zip: "10115", country: "DE", style: 6, daysAgo: 7, fits: [["Skoda", "Octavia", "Octavia IV (NX)"]] },
  { seller: 0, vehicleType: "auto", kind: "felge", title: "Rotiform LAS-R 8,5x19 ET45 5x112 – nur 2 Stück", description: "Zwei Felgen übrig nach Unfall (die anderen zwei waren betroffen, diese nicht). Ideal als Ersatz.", material: "alu", rimBrand: "Rotiform", rimModel: "LAS-R", diameter: 19, width: 8.5, pcd: [5, 112], et: 45, centerBore: 66.6, quantity: 2, condition: "gebraucht", price: 420, priceType: "vb", shipping: true, zip: "20095", country: "DE", style: 2, daysAgo: 8 },
  { seller: 1, vehicleType: "auto", kind: "felge", title: "Ford Focus ST 18\" Originalfelgen 8x18 ET55", description: "Originale Focus III ST Felgen, 5x108. Neu pulverbeschichtet in Anthrazit.", material: "alu", rimBrand: "Original (OEM)", diameter: 18, width: 8, pcd: [5, 108], et: 55, centerBore: 63.4, quantity: 4, condition: "neuwertig", price: 650, priceType: "vb", shipping: true, zip: "1100", country: "AT", style: 5, daysAgo: 9, fits: [["Ford", "Focus", "Focus III"]] },
  { seller: 0, vehicleType: "auto", kind: "komplettrad", title: "Hyundai i30 Winterräder 16\" auf Stahlfelge", description: "Stahlfelgen mit Radkappen, Reifen Hankook Winter i*cept RS2 mit 5 mm.", material: "stahl", rimBrand: "Original (OEM)", diameter: 16, width: 6.5, pcd: [5, 114.3], et: 50, centerBore: 67.1, quantity: 4, condition: "gebraucht", tireSize: "205/55 R16 91T", tireBrand: "Hankook", season: "winter", treadDepth: 5, dot: "3820", tpms: false, price: 260, priceType: "vb", shipping: false, zip: "3100", country: "AT", style: 6, daysAgo: 10, fits: [["Hyundai", "i30", "i30 (PD)"]] },
  { seller: 2, vehicleType: "auto", kind: "felge", title: "Vossen HF-5 9x20 ET35 5x112 Gloss Graphite", description: "Hybrid Forged Felgen, top Zustand, ohne Kratzer. Passend für viele Audi/Mercedes/VW SUV (Gutachten beachten).", material: "geschmiedet", rimBrand: "Vossen", rimModel: "HF-5", diameter: 20, width: 9, pcd: [5, 112], et: 35, centerBore: 66.5, quantity: 4, condition: "neuwertig", price: 1990, priceType: "vb", shipping: true, zip: "8001", country: "CH", style: 2, daysAgo: 11 },
  { seller: 0, vehicleType: "auto", kind: "felge", title: "Fiat 500 15\" Alufelgen 4x98", description: "Originale Fiat 500 Alufelgen 6x15 ET35. Leichte Kratzer.", material: "alu", rimBrand: "Original (OEM)", diameter: 15, width: 6, pcd: [4, 98], et: 35, centerBore: 58.1, quantity: 4, condition: "gebraucht", price: 180, priceType: "vb", shipping: true, zip: "9020", country: "AT", style: 0, daysAgo: 12, fits: [["Fiat", "500", "500 (312)"]] },
  // Motorrad
  { seller: 0, vehicleType: "motorrad", kind: "felge", title: "Yamaha MT-07 Hinterradfelge 5,50x17 original", description: "Originale Hinterradfelge der MT-07 (RM04). Ohne Reifen, ohne Bremsscheibe. Keine Schäden.", material: "alu", rimBrand: "Original (OEM)", diameter: 17, width: 5.5, quantity: 1, wheelPosition: "hinten", condition: "gebraucht", price: 160, priceType: "vb", shipping: true, zip: "1100", country: "AT", style: 7, daysAgo: 1, fits: [["Yamaha", "MT-07", "MT-07"], ["Yamaha", "XSR700", "XSR700"]] },
  { seller: 1, vehicleType: "motorrad", kind: "komplettrad", title: "BMW R 1250 GS Kreuzspeichenräder Satz mit Michelin Anakee", description: "Originale Kreuzspeichenräder vorne 3,00x19 und hinten 4,50x17 mit Michelin Anakee Adventure, ca. 50 %.", material: "speiche", rimBrand: "Original (OEM)", diameter: 19, width: 3, quantity: 2, wheelPosition: "alle", condition: "gebraucht", tireSize: "120/70 R19 + 170/60 R17", tireBrand: "Michelin", season: "sommer", treadDepth: 4, dot: "1923", price: 1150, priceType: "vb", shipping: true, zip: "1100", country: "AT", style: 4, featured: true, daysAgo: 2, fits: [["BMW Motorrad", "R 1250 GS", "R 1250 GS"], ["BMW Motorrad", "R 1300 GS", "R 1300 GS"]] },
  { seller: 2, vehicleType: "motorrad", kind: "felge", title: "KTM 1290 Super Duke R Vorderrad 3,50x17", description: "Vorderradfelge, schwarz, ohne Scheiben. Wurde auf Rennstrecke gegen Schmiedefelge getauscht.", material: "alu", rimBrand: "Original (OEM)", diameter: 17, width: 3.5, quantity: 1, wheelPosition: "vorne", condition: "neuwertig", price: 240, priceType: "fest", shipping: true, zip: "50667", country: "DE", style: 7, daysAgo: 3, fits: [["KTM", "1290 Super Duke R", "1290 Super Duke R"]] },
  { seller: 0, vehicleType: "motorrad", kind: "felge", title: "Marchesini M10RS Kompe Schmiederäder Kawasaki Z900", hasCertificate: true, description: "Satz Marchesini Schmiederäder 3,50x17 / 5,50x17, ABE vorhanden. Spart ca. 2,5 kg.", material: "geschmiedet", rimBrand: "Marchesini", rimModel: "M10RS Kompe", diameter: 17, width: 5.5, quantity: 2, wheelPosition: "alle", condition: "neuwertig", price: 1650, priceType: "vb", shipping: true, zip: "8020", country: "AT", style: 2, daysAgo: 5, fits: [["Kawasaki", "Z900", "Z900"]] },
  { seller: 1, vehicleType: "motorrad", kind: "komplettrad", title: "Ducati Monster 937 Hinterrad mit Pirelli Rosso IV", description: "Originales Hinterrad 5,50x17 mit Pirelli Diablo Rosso IV 180/55 ZR17, ca. 70 %.", material: "alu", rimBrand: "Original (OEM)", diameter: 17, width: 5.5, quantity: 1, wheelPosition: "hinten", condition: "gebraucht", tireSize: "180/55 ZR17", tireBrand: "Pirelli", season: "sommer", treadDepth: 4.5, dot: "0824", price: 390, priceType: "vb", shipping: true, zip: "1100", country: "AT", style: 3, daysAgo: 6, fits: [["Ducati", "Monster", "Monster (937)"]] },
  { seller: 2, vehicleType: "motorrad", kind: "felge", title: "Honda CB650R Vorderradfelge 3,50x17", description: "Originale Vorderradfelge, minimale Gebrauchsspuren.", material: "alu", rimBrand: "Original (OEM)", diameter: 17, width: 3.5, quantity: 1, wheelPosition: "vorne", condition: "gebraucht", price: 130, priceType: "vb", shipping: true, zip: "80331", country: "DE", style: 1, daysAgo: 9, fits: [["Honda", "CB650R / CBR650R", "CB650R / CBR650R"]] },
];

async function demoImage(styleIdx: number, variant: number, tire: boolean) {
  const base = DEMO_STYLES[styleIdx % DEMO_STYLES.length];
  const svg = rimSvg({ ...base, tire, angle: variant * 17 });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return processAndStoreImage(png);
}

async function ensureDemoUser(email: string, name: string, accountType: "privat" | "haendler", extra: Partial<typeof user.$inferInsert>) {
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing) return existing.id;
  const id = crypto.randomUUID().replace(/-/g, "");
  await db.insert(user).values({ id, email, name, emailVerified: true, accountType, ...extra });
  await db.insert(account).values({
    id: crypto.randomUUID().replace(/-/g, ""),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword("Demo1234!"),
  });
  return id;
}

async function findGeneration(makeName: string, modelName: string, genName: string) {
  const [g] = await db
    .select({ id: vehicleGeneration.id })
    .from(vehicleGeneration)
    .innerJoin(vehicleModel, eq(vehicleModel.id, vehicleGeneration.modelId))
    .innerJoin(vehicleMake, eq(vehicleMake.id, vehicleModel.makeId))
    .where(and(eq(vehicleMake.name, makeName), eq(vehicleModel.name, modelName), eq(vehicleGeneration.name, genName)))
    .limit(1);
  return g?.id ?? null;
}

/** Legt Demo-Nutzer und -Inserate an (nur wenn SEED_DEMO=true und noch keine Inserate existieren). */
export async function seedDemo() {
  if (!env.seedDemo) return false;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(listing);
  if (n > 0) return false;

  const sellers = [
    await ensureDemoUser("demo@gebrauchtfelgen24.at", "Lukas Demo", "privat", { zip: "1100", city: "Wien", country: "AT" }),
    await ensureDemoUser("haendler@gebrauchtfelgen24.at", "Reifen & Felgen Demo GmbH", "haendler", {
      companyName: "Reifen & Felgen Demo GmbH",
      zip: "1100",
      city: "Wien",
      country: "AT",
      phone: "+43 1 234 56 78",
    }),
    await ensureDemoUser("anna@gebrauchtfelgen24.at", "Anna Beispiel", "privat", { zip: "80331", city: "München", country: "DE" }),
  ];

  for (const d of DEMO) {
    const pc = await lookupPostalCode(d.zip, d.country);
    const published = new Date(Date.now() - d.daysAgo * 86400_000 - Math.random() * 3600_000);
    const [row] = await db
      .insert(listing)
      .values({
        userId: sellers[d.seller],
        vehicleType: d.vehicleType,
        kind: d.kind,
        title: d.title,
        description: d.description,
        material: d.material,
        rimBrand: d.rimBrand,
        rimModel: d.rimModel ?? null,
        diameter: d.diameter,
        width: d.width,
        boltCount: d.pcd?.[0] ?? null,
        boltCircle: d.pcd?.[1] ?? null,
        et: d.et ?? null,
        centerBore: d.centerBore ?? null,
        quantity: d.quantity,
        wheelPosition: d.wheelPosition ?? "alle",
        condition: d.condition,
        hasCertificate: d.hasCertificate ?? false,
        tireSize: d.tireSize ?? null,
        tireBrand: d.tireBrand ?? null,
        season: d.season ?? null,
        treadDepth: d.treadDepth ?? null,
        dot: d.dot ?? null,
        tpms: d.tpms ?? null,
        priceCents: d.price * 100,
        priceType: d.priceType,
        shipping: d.shipping,
        pickup: true,
        zip: d.zip,
        city: pc?.place ?? d.zip,
        country: d.country,
        lat: pc?.lat ?? null,
        lng: pc?.lng ?? null,
        showPhone: d.seller === 1,
        featuredUntil: d.featured ? new Date(Date.now() + 14 * 86400_000) : null,
        publishedAt: published,
        createdAt: published,
        expiresAt: new Date(published.getTime() + env.listingLifetimeDays * 86400_000),
        viewCount: Math.floor(Math.random() * 300),
      })
      .returning({ id: listing.id });

    const count = 2 + (row.id % 3);
    for (let i = 0; i < count; i++) {
      const img = await demoImage(d.style, i, d.kind === "komplettrad");
      await db.insert(listingImage).values({ ...img, userId: sellers[d.seller], listingId: row.id, position: i });
    }
    for (const [mk, md, gn] of d.fits ?? []) {
      const gid = await findGeneration(mk, md, gn);
      if (gid) await db.insert(listingFitment).values({ listingId: row.id, generationId: gid }).onConflictDoNothing();
    }
  }
  console.info(`[seed] ${DEMO.length} Demo-Inserate angelegt (Login: demo@gebrauchtfelgen24.at / Demo1234!)`);
  return true;
}
