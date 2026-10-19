export type Equipment = {
  id: number;
  name: string;
  category: string;
  location: string;
  rate: number;
  image: string;
  capacity: string;
  operator: boolean;
  available: boolean;
  vendor: string;
  description: string;
};
export const categories = [
  "Heavy machinery",
  "Lifting equipment",
  "Power & generators",
  "Concrete equipment",
  "Scaffolding",
  "Transport",
];
export const equipment: Equipment[] = [
  {
    id: 1,
    name: "CAT 320 Excavator",
    category: "Heavy machinery",
    location: "Lekki, Lagos",
    rate: 180000,
    image: "/images/excavator.jpg",
    capacity: "20 tonnes",
    operator: true,
    available: true,
    vendor: "Atlas Equipment",
    description:
      "A versatile 20-tonne excavator for foundations, site clearing and earthmoving. Enclosed air-conditioned cab, tracked undercarriage, and a standard digging bucket.",
  },
  {
    id: 2,
    name: "50-tonne Mobile Crane",
    category: "Lifting equipment",
    location: "Ikeja, Lagos",
    rate: 250000,
    image: "/images/crane.jpg",
    capacity: "50 tonnes",
    operator: true,
    available: true,
    vendor: "Mainland Lifting",
    description:
      "All-terrain mobile crane for structural steel, heavy installations and site lifting. Share your lift plan and site access details with the owner for a tailored mobilisation quote.",
  },
  {
    id: 3,
    name: "100 kVA Diesel Generator",
    category: "Power & generators",
    location: "Ajah, Lagos",
    rate: 45000,
    image: "/images/generator.jpg",
    capacity: "100 kVA",
    operator: false,
    available: true,
    vendor: "Site Power Co.",
    description:
      "Sound-attenuated diesel generator for reliable site power. Suitable for temporary construction facilities and power tools. Fuel is supplied separately by the renter.",
  },
  {
    id: 4,
    name: "Concrete Mixer",
    category: "Concrete equipment",
    location: "Surulere, Lagos",
    rate: 25000,
    image: "/images/mixer.png",
    capacity: "400 litres",
    operator: false,
    available: true,
    vendor: "BuildRight Rentals",
    description:
      "Portable concrete mixer for small-to-medium site work. Easy to position on site and ideal for foundations, slabs and general concrete preparation.",
  },
  {
    id: 5,
    name: "Steel Scaffolding Set",
    category: "Scaffolding",
    location: "Lekki, Lagos",
    rate: 15000,
    image: "",
    capacity: "20 frames",
    operator: false,
    available: true,
    vendor: "Structure Hire",
    description:
      "Modular steel scaffolding for access and finishing work. The sample set includes 20 frames; installation, ties and site-specific requirements are quoted separately.",
  },
  {
    id: 6,
    name: "20-tonne Tipper Truck",
    category: "Transport",
    location: "Gwarinpa, Abuja",
    rate: 120000,
    image: "",
    capacity: "20 tonnes",
    operator: true,
    available: true,
    vendor: "Capital Haulage",
    description:
      "Tipper truck for moving aggregate, sand and excavated material. A driver is included; route, mileage, loading and fuel requirements are confirmed in the quote.",
  },
  {
    id: 7,
    name: "Backhoe Loader",
    category: "Heavy machinery",
    location: "GRA, Port Harcourt",
    rate: 150000,
    image: "",
    capacity: "8 tonnes",
    operator: true,
    available: false,
    vendor: "Rivers Plant Hire",
    description:
      "A flexible earthmoving option for trenching and site preparation. Request your dates to check the next available rental window.",
  },
  {
    id: 8,
    name: "60 kVA Site Generator",
    category: "Power & generators",
    location: "Bodija, Ibadan",
    rate: 35000,
    image: "/images/generator.jpg",
    capacity: "60 kVA",
    operator: false,
    available: true,
    vendor: "Oyo Power Rentals",
    description:
      "Compact generator for site offices and everyday construction equipment. Delivery and fuel terms are confirmed separately before booking.",
  },
];
export const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browsing remains available when storage is disabled. */
  }
}
