export const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const contentTypes = ['guide', 'review', 'news', 'tutorial', 'reference', 'case-study'] as const;
export const audiences = ['new-pilot', 'buyer', 'pilot', 'builder', 'racer', 'cinematographer'] as const;
export const disciplines = ['freestyle', 'racing', 'cinematic', 'long-range', 'whoop', 'general'] as const;

export type Difficulty = (typeof difficulties)[number];
export type ContentType = (typeof contentTypes)[number];
export type Audience = (typeof audiences)[number];
export type Discipline = (typeof disciplines)[number];

export interface ContentMetadata {
  difficulty?: Difficulty;
  contentType?: ContentType;
  topics?: string[];
  audience?: Audience[];
  discipline?: Discipline[];
  components?: string[];
}

export function validateContentMetadata(data: unknown): { isValid: boolean; errors: string[]; metadata: ContentMetadata | null } {
  if (!data || typeof data !== 'object') {
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

  return {
    isValid: errors.length === 0,
    errors,
    metadata: validMetadata
  };
}
