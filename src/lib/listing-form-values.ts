export type FitmentItem = { id: number; label: string };

export type ListingFormValues = {
  vehicleType: "auto" | "motorrad" | "";
  kind: "felge" | "komplettrad" | "";
  title: string;
  description: string;
  material: string;
  rimBrand: string;
  rimModel: string;
  diameter: string;
  width: string;
  pcd: string;
  et: string;
  centerBore: string;
  quantity: string;
  wheelPosition: "alle" | "vorne" | "hinten";
  condition: string;
  hasCertificate: boolean;
  tireSize: string;
  tireBrand: string;
  season: string;
  treadDepth: string;
  dot: string;
  tpms: boolean;
  price: string;
  priceType: "fest" | "vb";
  shipping: boolean;
  pickup: boolean;
  shippingCost: string;
  zip: string;
  zipLabel: string;
  country: "AT" | "DE" | "CH";
  showPhone: boolean;
  imageKeys: string[];
  fitments: FitmentItem[];
};

export const emptyListingForm = (zip = "", country: "AT" | "DE" | "CH" = "AT", zipLabel = ""): ListingFormValues => ({
  vehicleType: "",
  kind: "",
  title: "",
  description: "",
  material: "alu",
  rimBrand: "",
  rimModel: "",
  diameter: "",
  width: "",
  pcd: "",
  et: "",
  centerBore: "",
  quantity: "4",
  wheelPosition: "alle",
  condition: "gebraucht",
  hasCertificate: false,
  tireSize: "",
  tireBrand: "",
  season: "",
  treadDepth: "",
  dot: "",
  tpms: false,
  price: "",
  priceType: "vb",
  shipping: false,
  pickup: true,
  shippingCost: "",
  zip,
  zipLabel,
  country,
  showPhone: false,
  imageKeys: [],
  fitments: [],
});
