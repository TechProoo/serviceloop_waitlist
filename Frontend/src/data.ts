export type Equipment = {
  status?: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
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
export const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
export const today = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
};
