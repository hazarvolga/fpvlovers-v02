export interface DuelProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: string;
  fomoAlert?: string;
  specs: {
    kv: number;
    weight: number; // grams
    thrust: number; // grams
    efficiency: number; // g/W
    [key: string]: number | string;
  };
  vendors: {
    name: string;
    price: string;
    url: string;
    inStock: boolean;
  }[];
}

export interface DuelResult {
  winnerId: string;
  verdictReason: string;
  warnings: Record<string, string>; // productId -> warning text
  upsell: {
    name: string;
    reason: string;
    imageUrl?: string;
    url?: string;
  };
}

export const DUEL_SYSTEM_PROMPT = `
You are a Senior FPV Mechanic and highly persuasive, trusted advisor.
Your goal is to guide the user towards a confident purchase while appearing brutally honest.

Analyze the two provided FPV components:
1. Winner Selection: Choose an absolute winner based on durability, performance-to-price ratio, and community feedback. Do NOT sit on the fence.
2. "Honest Mechanic" Tactic: Provide a highly specific, slightly negative caveat for EACH item (e.g., "Bearings wear out after 50 packs", "Requires a 45A+ ESC to prevent voltage sag"). This builds immense trust.
3. Smart Upsell: Recommend an alternative higher-ticket item that solves BOTH items' weaknesses.

Return JSON strictly in this format:
{
  "winnerId": "string",
  "verdictReason": "string (Punchy, confident explanation)",
  "warnings": {
    "productA_id": "string",
    "productB_id": "string"
  },
  "upsell": {
    "name": "string",
    "reason": "string (Why it's the true endgame choice)"
  }
}
`;

// Simulated Data Mapper & Fetcher
export async function getDuelComparison(productAId: string, productBId: string) {
  // Simulate network fetch
  await new Promise(r => setTimeout(r, 800));

   const productA: DuelProduct = {
      id: "motor-tmotor-f60",
      name: "F60 Pro IV KV1750",
      brand: "T-Motor",
      imageUrl: "https://picsum.photos/seed/tmotor/400/400",
      price: "$29.99",
      fomoAlert: "Only 4 left at Banggood!",
      specs: {
        kv: 1750,
        weight: 34.5,
        thrust: 1850,
        efficiency: 3.8
      },
      vendors: [
        { name: "Amazon", price: "$32.99", url: "#", inStock: true },
        { name: "Banggood", price: "$29.99", url: "#", inStock: true },
        { name: "GetFPV", price: "$30.99", url: "#", inStock: false },
      ]
   };

   const productB: DuelProduct = {
      id: "motor-xnova-2207",
      name: "Freestyle 2207 KV1800",
      brand: "XNOVA",
      imageUrl: "https://picsum.photos/seed/xnova/400/400",
      price: "$28.50",
      fomoAlert: "Flash Sale ending in 2h!",
      specs: {
        kv: 1800,
        weight: 32.0,
        thrust: 1780,
        efficiency: 4.1
      },
      vendors: [
        { name: "Amazon", price: "$30.00", url: "#", inStock: true },
        { name: "RaceDayQuads", price: "$28.50", url: "#", inStock: true },
      ]
   };

   const result: DuelResult = {
      winnerId: "motor-xnova-2207",
      verdictReason: "The XNOVA simply offers better watt-to-thrust efficiency for freestyle, saving your packs while delivering smoother low-end torque. Unbeatable value.",
      warnings: {
        "motor-tmotor-f60": "Runs slightly hot on 6S aggressive punchouts. Not ideal for heavy 5.5 inch props in summer heat.",
        "motor-xnova-2207": "The bell design is slightly more susceptible to denting on direct concrete bando crashes."
      },
      upsell: {
        name: "RCINPOWER Wasp Major 22.6-6.5",
        reason: "If you want true bando-bashing durability with the smoothness of XNOVA, the Wasp Major is 15% more expensive but practically indestructible.",
        imageUrl: "https://picsum.photos/seed/rcinpower/300/300",
        url: "#"
      }
   };

   return { productA, productB, result };
}

export function getSpecWinner(valA: number, valB: number, specKey: string): "A" | "B" | "TIE" {
  if (valA === valB) return "TIE";
  if (specKey === 'weight') return valA < valB ? "A" : "B";
  return valA > valB ? "A" : "B";
}
