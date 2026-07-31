export interface DuelProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  referenceLabel: string;
  specs: {
    kv: number;
    weight: number; // grams
    thrust: number; // grams
    efficiency: number; // g/W
    [key: string]: number | string;
  };
  vendors: {
    name: string;
    status: string;
    url: string;
    verified: boolean;
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
You are a Senior FPV Mechanic and evidence-first reviewer.
Your goal is to explain tradeoffs without inventing live prices, stock status, test evidence, or affiliate availability.

Analyze the two provided FPV components:
1. Winner Selection: Choose a benchmark winner only when the provided specs support it.
2. Evidence Caveat: Provide a specific caveat for each item, but mark it as a hypothesis unless backed by a source.
3. Alternative: Recommend an alternative only as a research lead, not as a guaranteed upsell.

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
  await new Promise(r => setTimeout(r, 800));

   const productA: DuelProduct = {
      id: "motor-tmotor-f60",
      name: "F60 Pro IV KV1750",
      brand: "T-Motor",
      imageUrl: "/api/content/media/cover/t-motor-f60-pro-iv",
      referenceLabel: "Benchmark sample",
      specs: {
        kv: 1750,
        weight: 34.5,
        thrust: 1850,
        efficiency: 3.8
      },
      vendors: [
        { name: "Amazon", status: "Verification pending", url: "#", verified: false },
        { name: "Banggood", status: "Verification pending", url: "#", verified: false },
        { name: "GetFPV", status: "Verification pending", url: "#", verified: false },
      ]
   };

   const productB: DuelProduct = {
      id: "motor-xnova-2207",
      name: "Freestyle 2207 KV1800",
      brand: "XNOVA",
      imageUrl: "/api/content/media/cover/xnova-freestyle-2207",
      referenceLabel: "Benchmark sample",
      specs: {
        kv: 1800,
        weight: 32.0,
        thrust: 1780,
        efficiency: 4.1
      },
      vendors: [
        { name: "Amazon", status: "Verification pending", url: "#", verified: false },
        { name: "RaceDayQuads", status: "Verification pending", url: "#", verified: false },
      ]
   };

   const result: DuelResult = {
      winnerId: "motor-xnova-2207",
      verdictReason: "The XNOVA sample has the stronger benchmark efficiency figure in this static comparison. Treat the result as a lab signal until sourced catalog evidence is attached.",
      warnings: {
        "motor-tmotor-f60": "Thermal headroom should be verified against sourced thrust tables before recommending aggressive 6S props.",
        "motor-xnova-2207": "Crash durability should be verified with source-backed reviews before making a purchase recommendation."
      },
      upsell: {
        name: "RCINPOWER Wasp Major 22.6-6.5",
        reason: "Research lead only: compare source-backed thrust, weight, and durability evidence before treating it as an upgrade.",
        imageUrl: "/api/content/media/cover/rcinpower-wasp-major",
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
