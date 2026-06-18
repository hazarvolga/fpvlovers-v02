export const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const contentTypes = [
  'guide',
  'review',
  'news',
  'tutorial',
  'reference',
  'case-study',
  'buyer-guide',
  'comparison',
  'product-roundup'
] as const;
export const audiences = ['new-pilot', 'buyer', 'pilot', 'builder', 'racer', 'cinematographer'] as const;
export const disciplines = ['freestyle', 'racing', 'cinematic', 'long-range', 'whoop', 'general'] as const;

export type Difficulty = (typeof difficulties)[number];
export type ContentType = (typeof contentTypes)[number];
export type Audience = (typeof audiences)[number];
export type Discipline = (typeof disciplines)[number];

export interface ProductReviewMetadata {
  productBrand: string;
  productModel: string;
  releaseYear: number;
  productCategory: string;
  reviewScore: number; // 0 to 100
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface ProductComparisonMetadata {
  productA: string;
  productB: string;
  comparisonCategory: string;
  winner: string; // Winning product model/name, or 'tie'
}

export interface ContentMetadata {
  difficulty?: Difficulty;
  contentType?: ContentType;
  topics?: string[];
  audience?: Audience[];
  discipline?: Discipline[];
  components?: string[];
  review?: ProductReviewMetadata;
  comparison?: ProductComparisonMetadata;
  buyerGuide?: { products: string[] };
}

export function validateContentMetadata(data: unknown): { isValid: boolean; errors: string[]; metadata: ContentMetadata | null } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Metadata must be an object'], metadata: null };
  }

  const obj = data as Record<string, unknown>;
  const errors: string[] = [];
  const validMetadata: ContentMetadata = {};

  if (obj.difficulty !== undefined) {
    if (typeof obj.difficulty === 'string' && (difficulties as readonly string[]).includes(obj.difficulty)) {
      validMetadata.difficulty = obj.difficulty as Difficulty;
    } else {
      errors.push(`Invalid difficulty: ${obj.difficulty}`);
    }
  }

  if (obj.contentType !== undefined) {
    if (typeof obj.contentType === 'string' && (contentTypes as readonly string[]).includes(obj.contentType)) {
      validMetadata.contentType = obj.contentType as ContentType;
    } else {
      errors.push(`Invalid contentType: ${obj.contentType}`);
    }
  }

  if (obj.topics !== undefined) {
    if (Array.isArray(obj.topics) && obj.topics.every(t => typeof t === 'string')) {
      validMetadata.topics = obj.topics as string[];
    } else {
      errors.push('Topics must be an array of strings');
    }
  }

  if (obj.audience !== undefined) {
    if (Array.isArray(obj.audience) && obj.audience.every(a => typeof a === 'string' && (audiences as readonly string[]).includes(a))) {
      validMetadata.audience = obj.audience as Audience[];
    } else {
      errors.push('Audience must be an array of valid audience types');
    }
  }

  if (obj.discipline !== undefined) {
    if (Array.isArray(obj.discipline) && obj.discipline.every(d => typeof d === 'string' && (disciplines as readonly string[]).includes(d))) {
      validMetadata.discipline = obj.discipline as Discipline[];
    } else {
      errors.push('Discipline must be an array of valid disciplines');
    }
  }

  if (obj.components !== undefined) {
    if (Array.isArray(obj.components) && obj.components.every(c => typeof c === 'string')) {
      validMetadata.components = obj.components as string[];
    } else {
      errors.push('Components must be an array of strings');
    }
  }

  if (obj.review !== undefined) {
    if (obj.review && typeof obj.review === 'object' && !Array.isArray(obj.review)) {
      const rev = obj.review as Record<string, unknown>;
      const revErrors: string[] = [];

      if (typeof rev.productBrand !== 'string') {
        revErrors.push('review.productBrand must be a string');
      }
      if (typeof rev.productModel !== 'string') {
        revErrors.push('review.productModel must be a string');
      }
      if (typeof rev.releaseYear !== 'number' || !Number.isInteger(rev.releaseYear)) {
        revErrors.push('review.releaseYear must be an integer');
      }
      if (typeof rev.productCategory !== 'string') {
        revErrors.push('review.productCategory must be a string');
      }
      if (typeof rev.reviewScore !== 'number' || !Number.isFinite(rev.reviewScore) || rev.reviewScore < 0 || rev.reviewScore > 100) {
        revErrors.push('review.reviewScore must be a finite number between 0 and 100');
      }
      if (!Array.isArray(rev.pros) || !rev.pros.every(p => typeof p === 'string')) {
        revErrors.push('review.pros must be an array of strings');
      }
      if (!Array.isArray(rev.cons) || !rev.cons.every(c => typeof c === 'string')) {
        revErrors.push('review.cons must be an array of strings');
      }
      if (typeof rev.bestFor !== 'string') {
        revErrors.push('review.bestFor must be a string');
      }

      if (revErrors.length === 0) {
        validMetadata.review = {
          productBrand: rev.productBrand as string,
          productModel: rev.productModel as string,
          releaseYear: rev.releaseYear as number,
          productCategory: rev.productCategory as string,
          reviewScore: rev.reviewScore as number,
          pros: rev.pros as string[],
          cons: rev.cons as string[],
          bestFor: rev.bestFor as string,
        };
      } else {
        errors.push(...revErrors);
      }
    } else {
      errors.push('review must be an object');
    }
  }

  if (obj.comparison !== undefined) {
    if (obj.comparison && typeof obj.comparison === 'object' && !Array.isArray(obj.comparison)) {
      const comp = obj.comparison as Record<string, unknown>;
      const compErrors: string[] = [];

      if (typeof comp.productA !== 'string') {
        compErrors.push('comparison.productA must be a string');
      }
      if (typeof comp.productB !== 'string') {
        compErrors.push('comparison.productB must be a string');
      }
      if (typeof comp.comparisonCategory !== 'string') {
        compErrors.push('comparison.comparisonCategory must be a string');
      }
      if (typeof comp.winner !== 'string') {
        compErrors.push('comparison.winner must be a string');
      }

      if (compErrors.length === 0) {
        validMetadata.comparison = {
          productA: comp.productA as string,
          productB: comp.productB as string,
          comparisonCategory: comp.comparisonCategory as string,
          winner: comp.winner as string,
        };
      } else {
        errors.push(...compErrors);
      }
    } else {
      errors.push('comparison must be an object');
    }
  }

  if (obj.buyerGuide !== undefined) {
    if (obj.buyerGuide && typeof obj.buyerGuide === 'object' && !Array.isArray(obj.buyerGuide)) {
      const bg = obj.buyerGuide as Record<string, unknown>;
      const bgErrors: string[] = [];

      if (!Array.isArray(bg.products) || !bg.products.every(p => typeof p === 'string')) {
        bgErrors.push('buyerGuide.products must be an array of strings');
      }

      if (bgErrors.length === 0) {
        validMetadata.buyerGuide = {
          products: bg.products as string[],
        };
      } else {
        errors.push(...bgErrors);
      }
    } else {
      errors.push('buyerGuide must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    metadata: validMetadata
  };
}
