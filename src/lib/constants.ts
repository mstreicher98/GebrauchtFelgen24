export const VEHICLE_TYPES = { auto: "Auto", motorrad: "Motorrad" } as const;
export const LISTING_KINDS = { felge: "Felgen", komplettrad: "Kompletträder" } as const;
export const LISTING_KIND_SINGULAR = { felge: "Felge", komplettrad: "Komplettrad" } as const;
export const MATERIALS = {
  alu: "Aluminium",
  stahl: "Stahl",
  geschmiedet: "Alu geschmiedet",
  carbon: "Carbon",
  magnesium: "Magnesium",
  speiche: "Speichenrad",
} as const;
export const CONDITIONS = {
  neu: "Neu",
  neuwertig: "Wie neu",
  gebraucht: "Gebraucht",
  beschaedigt: "Mit Mängeln",
} as const;
export const SEASONS = { sommer: "Sommer", winter: "Winter", ganzjahr: "Ganzjahr" } as const;
export const PRICE_TYPES = { fest: "Festpreis", vb: "VB" } as const;
export const WHEEL_POSITIONS = { alle: "Satz / alle", vorne: "Vorderrad", hinten: "Hinterrad" } as const;
export const LISTING_STATUS = {
  aktiv: "Aktiv",
  verkauft: "Verkauft",
  deaktiviert: "Deaktiviert",
  abgelaufen: "Abgelaufen",
  gesperrt: "Gesperrt",
} as const;
export const COUNTRIES = { AT: "Österreich", DE: "Deutschland", CH: "Schweiz" } as const;

export const COMMON_PCDS = [
  "4x98",
  "4x100",
  "4x108",
  "4x114.3",
  "5x98",
  "5x100",
  "5x105",
  "5x108",
  "5x110",
  "5x112",
  "5x114.3",
  "5x115",
  "5x120",
  "5x127",
  "5x130",
  "5x160",
  "6x114.3",
  "6x139.7",
];

export const CAR_DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
export const MOTO_DIAMETERS = [10, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23];

export const RIM_BRANDS = [
  "Original (OEM)",
  "AEZ",
  "Alutec",
  "ATS",
  "Autec",
  "Barracuda",
  "BBS",
  "Borbet",
  "Brock",
  "Corspeed",
  "Dezent",
  "Dotz",
  "Enkei",
  "Keskin",
  "MAK",
  "Momo",
  "MSW",
  "OZ Racing",
  "Oxigin",
  "Platin",
  "Proline",
  "Rial",
  "Ronal",
  "Rotiform",
  "RH",
  "Tomason",
  "Ultra Wheels",
  "Vossen",
  "Wolfrace",
  "Marchesini",
  "Rotobox",
  "Excel",
  "Kineo",
  "Haan Wheels",
];

export const REPORT_REASONS = [
  "Betrugsverdacht",
  "Falsche Angaben",
  "Artikel bereits verkauft",
  "Beleidigung / Belästigung",
  "Spam / Werbung",
  "Verbotener Inhalt",
  "Sonstiges",
];

export const MAX_IMAGES = 12;
export const PAGE_SIZE = 24;

export type VehicleType = keyof typeof VEHICLE_TYPES;
export type ListingKind = keyof typeof LISTING_KINDS;
