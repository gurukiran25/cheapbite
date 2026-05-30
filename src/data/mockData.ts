// Seeded mock data simulating multiple food delivery platforms.
// Prices in INR. Replace with real partner APIs later.

export type Platform = {
  id: string;
  name: string;
  color: string; // tailwind-safe hex (used inline only for brand chip)
  rating: number;
};

export const PLATFORMS: Platform[] = [
  { id: "swiggy", name: "Swiggy", color: "#FC8019", rating: 4.3 },
  { id: "zomato", name: "Zomato", color: "#E23744", rating: 4.2 },
  { id: "eatsure", name: "EatSure", color: "#1FA463", rating: 4.1 },
  { id: "dominos", name: "Domino's", color: "#0078AE", rating: 4.4 },
  { id: "mcd", name: "McDonald's", color: "#FFC72C", rating: 4.0 },
];

export type Offer = {
  id: string;
  restaurant: string;
  platformId: string;
  itemName: string;
  basePrice: number;
  deliveryFee: number;
  discountPct: number; // 0-100
  couponCode?: string;
  etaMins: number;
  rating: number;
  isVeg: boolean;
  distanceKm: number;
};

export type FoodItem = {
  slug: string;
  name: string;
  category: "Veg" | "Non-Veg" | "Dessert" | "Beverage";
  emoji: string;
  trending?: boolean;
  offers: Offer[];
};

// Helper to deterministically vary numbers
const v = (base: number, seed: number, spread: number) =>
  Math.round(base + ((seed * 9301 + 49297) % 233280) / 233280 * spread - spread / 2);

const makeOffers = (
  itemName: string,
  isVeg: boolean,
  basePrice: number,
  seed: number,
  restaurants: Record<string, string>,
): Offer[] =>
  PLATFORMS.filter((p) => restaurants[p.id]).map((p, i) => ({
    id: `${itemName}-${p.id}`,
    restaurant: restaurants[p.id],
    platformId: p.id,
    itemName,
    basePrice: v(basePrice, seed + i, 60),
    deliveryFee: [0, 19, 25, 29, 35, 39][((seed + i) % 6 + 6) % 6],
    discountPct: [0, 10, 15, 20, 25, 30, 40, 50][((seed + i * 3) % 8 + 8) % 8],
    couponCode: i % 2 === 0 ? ["WELCOME50", "STUDENT20", "HOSTEL15", "FLAT30"][((seed + i) % 4 + 4) % 4] : undefined,
    etaMins: 20 + ((seed + i * 7) % 30),
    rating: 3.8 + ((seed + i * 5) % 12) / 10,
    isVeg,
    distanceKm: 0.8 + ((seed + i * 4) % 35) / 10,
  }));

export const FOOD_ITEMS: FoodItem[] = [
  {
    slug: "veg-fried-rice",
    name: "Veg Fried Rice",
    category: "Veg",
    emoji: "🍚",
    trending: true,
    offers: makeOffers("Veg Fried Rice", true, 220, 11, {
      swiggy: "China Town",
      zomato: "Wok Express",
      eatsure: "Faasos Bowls",
      dominos: "",
      mcd: "",
    }),
  },
  {
    slug: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    category: "Veg",
    emoji: "🍛",
    trending: true,
    offers: makeOffers("Paneer Butter Masala", true, 280, 23, {
      swiggy: "Punjabi Tadka",
      zomato: "Behrouz Biryani",
      eatsure: "Oven Story",
      dominos: "",
      mcd: "",
    }),
  },
  {
    slug: "chicken-biryani",
    name: "Chicken Biryani",
    category: "Non-Veg",
    emoji: "🍗",
    trending: true,
    offers: makeOffers("Chicken Biryani", false, 320, 37, {
      swiggy: "Paradise Biryani",
      zomato: "Behrouz Biryani",
      eatsure: "Biryani Blues",
      dominos: "",
      mcd: "",
    }),
  },
  {
    slug: "margherita-pizza",
    name: "Margherita Pizza",
    category: "Veg",
    emoji: "🍕",
    trending: true,
    offers: makeOffers("Margherita Pizza", true, 260, 51, {
      swiggy: "La Pino'z",
      zomato: "Pizza Hut",
      eatsure: "Oven Story",
      dominos: "Domino's Pizza",
      mcd: "",
    }),
  },
  {
    slug: "mcaloo-tikki-burger",
    name: "McAloo Tikki Burger",
    category: "Veg",
    emoji: "🍔",
    offers: makeOffers("McAloo Tikki Burger", true, 60, 67, {
      swiggy: "McDonald's",
      zomato: "McDonald's",
      eatsure: "",
      dominos: "",
      mcd: "McDonald's",
    }),
  },
  {
    slug: "masala-dosa",
    name: "Masala Dosa",
    category: "Veg",
    emoji: "🥞",
    offers: makeOffers("Masala Dosa", true, 120, 83, {
      swiggy: "Sagar Ratna",
      zomato: "Dosa Plaza",
      eatsure: "Faasos",
      dominos: "",
      mcd: "",
    }),
  },
  {
    slug: "chocolate-shake",
    name: "Chocolate Shake",
    category: "Beverage",
    emoji: "🥤",
    offers: makeOffers("Chocolate Shake", true, 140, 97, {
      swiggy: "Keventers",
      zomato: "Frozen Bottle",
      eatsure: "",
      dominos: "",
      mcd: "McDonald's",
    }),
  },
  {
    slug: "veg-thali",
    name: "Hostel Veg Thali",
    category: "Veg",
    emoji: "🍱",
    trending: true,
    offers: makeOffers("Veg Thali", true, 180, 113, {
      swiggy: "Annapurna Mess",
      zomato: "Rajdhani",
      eatsure: "The Good Bowl",
      dominos: "",
      mcd: "",
    }),
  },
];

export function computeFinal(o: Offer) {
  const discounted = Math.round(o.basePrice * (1 - o.discountPct / 100));
  const final = discounted + o.deliveryFee;
  const savings = o.basePrice + o.deliveryFee - final;
  return { discounted, final, savings };
}

export function searchFoods(q: string): FoodItem[] {
  const query = q.trim().toLowerCase();
  if (!query) return FOOD_ITEMS;
  const tokens = query.split(/\s+/);
  return FOOD_ITEMS.filter((f) => {
    const hay = `${f.name} ${f.category}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function findFood(slug: string) {
  return FOOD_ITEMS.find((f) => f.slug === slug);
}
