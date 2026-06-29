import type {
  EvidenceBoundSpec,
  ProductReviewMetadata,
  ProductTrustStatus,
} from '@/lib/types/spec-trust';

export type FpvProductType =
  | 'frame'
  | 'motor'
  | 'prop'
  | 'battery'
  | 'stack'
  | 'camera'
  | 'vtx'
  | 'video'
  | 'receiver'
  | 'radio'
  | 'goggles'
  | 'kit';

export type ProductSpecValue = number | string | boolean | number[] | string[] | boolean[];

export type FpvCatalogProduct = {
  id: string;
  name: string;
  brand: string;
  type: FpvProductType;
  category: string;
  sourceNetwork: string;
  url: string;
  price: number;
  currency: string;
  trustScore: number;
  keywords: string[];
  compatibleWith: string[];
  tags: string[];
  specs: Record<string, ProductSpecValue>;
  evidenceSpecs?: Record<string, EvidenceBoundSpec>;
  trustStatus?: ProductTrustStatus;
  reviewMetadata?: ProductReviewMetadata;
  fit: {
    styles: string[];
    cellCounts?: number[];
    propSizes?: number[];
    protocols?: string[];
    stackMount?: string;
    motorMount?: string;
  };
  imageUrl?: string;
  provenance?: {
    source: 'affiliate-seed' | 'crawler' | 'manual';
    sourceUrl: string;
    imageSourceUrl?: string;
    crawledAt?: string;
    extractionConfidence?: number;
  };
};

export type BuildSlot = 'frame' | 'motor' | 'prop' | 'stack' | 'battery' | 'video' | 'receiver';

export type BuildSelection = Partial<Record<BuildSlot, string>> & {
  style: 'freestyle' | 'racing' | 'cinematic' | 'longRange' | 'whoop';
};
