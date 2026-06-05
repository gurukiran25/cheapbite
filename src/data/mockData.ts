// Seeded mock data simulating multiple food delivery platforms.
// Prices in INR. Replace with real partner APIs later.

export type Platform = {
  id: string;
  name: string;
  color: string;
  rating: number;
  /** Search URL template; {q} is replaced with the URL-encoded item name. */
  searchUrl: string;
};

export const PLATFORMS: Platform[] = [
  { id: "swiggy", name: "Swiggy", color: "#FC8019", rating: 4.3, searchUrl: "https://www.swiggy.com/search?query={q}" },
  { id: "zomato", name: "Zomato", color: "#E23744", rating: 4.2, searchUrl: "https://www.zomato.com/india/delivery?q={q}" },
  { id: "eatsure", name: "EatSure", color: "#1FA463", rating: 4.1, searchUrl: "https://www.eatsure.com/search?q={q}" },
  { id: "dominos", name: "Domino's", color: "#0078AE", rating: 4.4, searchUrl: "https://pizzaonline.dominos.co.in/menu" },
  { id: "mcd", name: "McDonald's", color: "#FFC72C", rating: 4.0, searchUrl: "https://www.mcdelivery.co.in/in/menu" },
  { id: "kfc", name: "KFC", color: "#E4002B", rating: 4.2, searchUrl: "https://online.kfc.co.in/menu" },
  { id: "pizzahut", name: "Pizza Hut", color: "#EE3124", rating: 4.1, searchUrl: "https://www.pizzahut.co.in/menu" },
  { id: "subway", name: "Subway", color: "#008C15", rating: 4.0, searchUrl: "https://order.subway.com/en-IN" },
  { id: "burgerking", name: "Burger King", color: "#D62300", rating: 4.1, searchUrl: "https://www.burgerking.in/menu" },
  { id: "magicpin", name: "MagicPin", color: "#E91E63", rating: 4.2, searchUrl: "https://magicpin.in/search/?q={q}" },
  { id: "thrive", name: "Thrive", color: "#7C3AED", rating: 4.0, searchUrl: "https://thrivenow.in/" },
  { id: "ondc", name: "ONDC", color: "#1F6FEB", rating: 4.0, searchUrl: "https://www.mystore.in/en/search?query={q}" },
  { id: "dunzo", name: "Dunzo", color: "#00D26A", rating: 4.1, searchUrl: "https://www.dunzo.com/" },
  { id: "boxes", name: "Box8", color: "#F26522", rating: 4.0, searchUrl: "https://www.box8.in/menu" },
  { id: "faasos", name: "Faasos", color: "#C8102E", rating: 4.1, searchUrl: "https://www.faasos.io/" },
];

export function platformOrderUrl(platformId: string, itemName: string): string {
  const p = PLATFORMS.find((x) => x.id === platformId);
  if (!p) return "#";
  return p.searchUrl.replace("{q}", encodeURIComponent(itemName));
}

export type Offer = {
  id: string;
  restaurant: string;
  platformId: string;
  itemName: string;
  basePrice: number;
  deliveryFee: number;
  platformFee: number;
  discountPct: number;
  couponCode?: string;
  etaMins: number;
  rating: number;
  reviewCount: number;
  isVeg: boolean;
  distanceKm: number;
  weightG: number;
  updatedAgoMins: number;
};

export type FoodItem = {
  slug: string;
  name: string;
  category: "Veg" | "Non-Veg" | "Dessert" | "Beverage";
  emoji: string;
  trending?: boolean;
  offers: Offer[];
};

const v = (base: number, seed: number, spread: number) =>
  Math.round(base + ((seed * 9301 + 49297) % 233280) / 233280 * spread - spread / 2);

const makeOffers = (
  itemName: string,
  isVeg: boolean,
  basePrice: number,
  seed: number,
  restaurants: Partial<Record<string, string>>,
): Offer[] =>
  PLATFORMS.filter((p) => restaurants[p.id]).map((p, i) => {
    const s = seed + i;
    const weightBase = Math.round(basePrice * 1.6);
    return {
      id: `${itemName}-${p.id}`,
      restaurant: restaurants[p.id]!,
      platformId: p.id,
      itemName,
      basePrice: v(basePrice, s, 60),
      deliveryFee: [0, 19, 25, 29, 35, 39][((s) % 6 + 6) % 6],
      platformFee: [3, 5, 6, 7, 9, 12][((s * 2) % 6 + 6) % 6],
      discountPct: [0, 10, 15, 20, 25, 30, 40, 50][((seed + i * 3) % 8 + 8) % 8],
      couponCode: i % 2 === 0 ? ["WELCOME50", "STUDENT20", "HOSTEL15", "FLAT30", "CAMPUS25"][((s) % 5 + 5) % 5] : undefined,
      etaMins: 20 + ((seed + i * 7) % 30),
      rating: 3.8 + ((seed + i * 5) % 12) / 10,
      reviewCount: 120 + ((s * 37) % 4800),
      isVeg,
      distanceKm: 0.8 + ((seed + i * 4) % 35) / 10,
      weightG: weightBase + ((s * 13) % 220) - 80,
      updatedAgoMins: 1 + ((s * 7) % 14),
    };
  });

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
      magicpin: "Mainland China",
      thrive: "Beijing Bites",
      ondc: "Wok On Fire",
      dunzo: "Chung Wah",
      boxes: "Box8 Asia",
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
      magicpin: "Punjab Grill",
      thrive: "Pind Balluchi",
      ondc: "Moti Mahal",
      dunzo: "Bukhara Express",
      faasos: "Faasos Curries",
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
      magicpin: "Bawarchi",
      kfc: "KFC Biryani Bucket",
      thrive: "Hyderabad House",
      ondc: "Mehfil Biryani",
      dunzo: "Shadab",
      faasos: "Faasos Biryani",
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
      pizzahut: "Pizza Hut",
      magicpin: "MOD Pizza",
      thrive: "Slice of Italy",
      ondc: "Local Pizzeria",
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
      mcd: "McDonald's",
      burgerking: "Burger King",
      magicpin: "McDonald's",
      dunzo: "McDonald's",
    }),
  },
  {
    slug: "veg-whopper",
    name: "Veg Whopper",
    category: "Veg",
    emoji: "🍔",
    trending: true,
    offers: makeOffers("Veg Whopper", true, 199, 71, {
      swiggy: "Burger King",
      zomato: "Burger King",
      burgerking: "Burger King",
      magicpin: "Burger King",
      dunzo: "Burger King",
    }),
  },
  {
    slug: "zinger-burger",
    name: "Zinger Burger",
    category: "Non-Veg",
    emoji: "🍔",
    trending: true,
    offers: makeOffers("Zinger Burger", false, 169, 73, {
      swiggy: "KFC",
      zomato: "KFC",
      kfc: "KFC",
      magicpin: "KFC",
      dunzo: "KFC",
    }),
  },
  {
    slug: "veg-sub",
    name: "Veggie Delite Sub",
    category: "Veg",
    emoji: "🥪",
    offers: makeOffers("Veggie Delite Sub", true, 180, 77, {
      swiggy: "Subway",
      zomato: "Subway",
      subway: "Subway",
      magicpin: "Subway",
      ondc: "Subway",
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
      magicpin: "Saravana Bhavan",
      thrive: "Anjappar",
      ondc: "MTR",
      dunzo: "Komala Vilas",
      faasos: "Faasos South",
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
      mcd: "McDonald's",
      burgerking: "Burger King",
      magicpin: "Starbucks",
      thrive: "Cafe Coffee Day",
      dunzo: "Keventers",
    }),
  },
  {
    slug: "cold-coffee",
    name: "Cold Coffee",
    category: "Beverage",
    emoji: "☕",
    trending: true,
    offers: makeOffers("Cold Coffee", true, 160, 101, {
      swiggy: "Starbucks",
      zomato: "Blue Tokai",
      magicpin: "Third Wave Coffee",
      thrive: "Cafe Coffee Day",
      ondc: "Chaayos",
      dunzo: "Barista",
    }),
  },
  {
    slug: "choco-lava-cake",
    name: "Choco Lava Cake",
    category: "Dessert",
    emoji: "🍫",
    trending: true,
    offers: makeOffers("Choco Lava Cake", true, 99, 103, {
      swiggy: "Domino's",
      zomato: "Domino's",
      dominos: "Domino's Pizza",
      magicpin: "Theobroma",
      thrive: "Cake Shop",
      dunzo: "Mio Amore",
    }),
  },
  {
    slug: "gulab-jamun",
    name: "Gulab Jamun",
    category: "Dessert",
    emoji: "🍯",
    offers: makeOffers("Gulab Jamun", true, 80, 107, {
      swiggy: "Haldiram's",
      zomato: "Bikanervala",
      magicpin: "Ghasitaram",
      ondc: "Local Sweets",
      dunzo: "Anand Sweets",
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
      magicpin: "Sagar Ratna",
      thrive: "Hostel Tiffin Co.",
      ondc: "Maa Ki Rasoi",
      dunzo: "Ghar Ka Khana",
      faasos: "Faasos Meals",
    }),
  },
  {
    slug: "chicken-wings",
    name: "Chicken Wings",
    category: "Non-Veg",
    emoji: "🍗",
    offers: makeOffers("Chicken Wings", false, 240, 127, {
      swiggy: "KFC",
      zomato: "Wat-a-Burger",
      kfc: "KFC",
      magicpin: "Wingreens",
      dunzo: "Buffalo Wild Wings",
    }),
  },
  {
    slug: "veg-momos",
    name: "Veg Momos",
    category: "Veg",
    emoji: "🥟",
    trending: true,
    offers: makeOffers("Veg Momos", true, 90, 131, {
      swiggy: "Wow! Momo",
      zomato: "Dimsum Bros",
      magicpin: "Momo Cafe",
      thrive: "Dilli Momos",
      ondc: "Street Momos",
      dunzo: "Momo Junction",
      boxes: "Box8 Momos",
    }),
  },
];

export function computeFinal(o: Offer) {
  const discounted = Math.round(o.basePrice * (1 - o.discountPct / 100));
  const discountAmt = o.basePrice - discounted;
  const final = discounted + o.deliveryFee + o.platformFee;
  const sticker = o.basePrice + o.deliveryFee + o.platformFee;
  const savings = sticker - final;
  return { discounted, discountAmt, final, sticker, savings };
}

/** ₹ per 100 g — lower is better value. */
export function valueScore(o: Offer) {
  const { final } = computeFinal(o);
  return +(final / (o.weightG / 100)).toFixed(1);
}

export function findFood(slug: string) {
  return FOOD_ITEMS.find((f) => f.slug === slug);
}
