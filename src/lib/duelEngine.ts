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

import { getFpvProductCatalog } from '@/lib/tools/fpv-product-catalog';
import type { FpvCatalogProduct } from '@/lib/tools/fpv-product-types';

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function catalogToDuelProduct(product: FpvCatalogProduct): DuelProduct {
  const kv = toNum(product.specs?.['kv'] ?? product.evidenceSpecs?.['kv']?.value);
  const weight = toNum(product.specs?.['weight'] ?? product.evidenceSpecs?.['weight']?.value);
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl ?? '/images/placeholder-product.jpg',
    referenceLabel: product.trustStatus === 'VERIFIED' ? 'Catalog verified' : 'Catalog — unverified',
    specs: { kv, weight, thrust: 0, efficiency: 0 },
    vendors: [
      { name: product.sourceNetwork, status: 'Verification pending', url: product.url ?? '#', verified: product.trustStatus === 'VERIFIED' },
    ],
  };
}

function notFoundDuelProduct(id: string): DuelProduct {
  return {
    id,
    name: id,
    brand: 'Unknown',
    imageUrl: '/images/placeholder-product.jpg',
    referenceLabel: 'Not in catalog',
    specs: { kv: 0, weight: 0, thrust: 0, efficiency: 0 },
    vendors: [],
  };
}

export async function getDuelComparison(productAId: string, productBId: string) {
  await new Promise(r => setTimeout(r, 200));

  const catalog = getFpvProductCatalog();
  const rawA = catalog.find((p) => p.id === productAId);
  const rawB = catalog.find((p) => p.id === productBId);

  const productA = rawA ? catalogToDuelProduct(rawA) : notFoundDuelProduct(productAId);
  const productB = rawB ? catalogToDuelProduct(rawB) : notFoundDuelProduct(productBId);

  const bothFound = Boolean(rawA && rawB);
  const winnerId = bothFound
    ? ((rawA?.trustScore ?? 0) >= (rawB?.trustScore ?? 0) ? productA.id : productB.id)
    : productA.id;

  const result: DuelResult = {
    winnerId,
    verdictReason: bothFound
      ? `Catalog trust score comparison only — no live thrust-table or verified test data available. Source-backed evidence is required before treating this as a purchase recommendation.`
      : `One or both products were not found in the verified catalog. No comparison can be made without sourced catalog evidence.`,
    warnings: {
      [productA.id]: rawA
        ? (rawA.trustStatus !== 'VERIFIED' ? 'Unverified catalog entry — specs not confirmed by crawler.' : 'Catalog-verified, but no live thrust or thermal data available.')
        : 'Product ID not found in catalog. Cannot compare.',
      [productB.id]: rawB
        ? (rawB.trustStatus !== 'VERIFIED' ? 'Unverified catalog entry — specs not confirmed by crawler.' : 'Catalog-verified, but no live thrust or thermal data available.')
        : 'Product ID not found in catalog. Cannot compare.',
    },
    upsell: {
      name: 'Use the Part Matcher tool',
      reason: 'For spec-backed component selection, the Part Matcher provides catalog-sourced compatibility scoring.',
      url: '/tools/part-matcher',
    },
  };

  return { productA, productB, result };
}

export function getSpecWinner(valA: number, valB: number, specKey: string): "A" | "B" | "TIE" {
  if (valA === valB) return "TIE";
  if (specKey === 'weight') return valA < valB ? "A" : "B";
  return valA > valB ? "A" : "B";
}
