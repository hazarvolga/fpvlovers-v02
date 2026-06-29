import { z } from 'zod';

export const productTrustStatusSchema = z.enum(['QUARANTINE', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED']);
export const evidenceSpecStatusSchema = z.enum(['unverified', 'conflicting', 'verified', 'rejected']);
export const specSourceTypeSchema = z.enum(['manufacturer', 'retailer', 'manual', 'community', 'unknown']);
export const specExtractionMethodSchema = z.enum(['json_ld', 'spec_table', 'regex', 'llm_structured', 'manual_override']);

const specScalarValueSchema = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
export const specValueSchema = z.union([
  specScalarValueSchema,
  z.array(z.union([z.string(), z.number().finite(), z.boolean()])),
]);

export const evidenceBoundSpecSchema = z.object({
  value: specValueSchema,
  unit: z.string().trim().min(1).nullable(),
  sourceUrls: z.array(z.string().url()).nonempty(),
  sourceType: specSourceTypeSchema,
  confidence: z.number().min(0).max(1),
  extractionMethod: specExtractionMethodSchema,
  status: evidenceSpecStatusSchema,
  observedAt: z.string().datetime().optional(),
  rawValue: z.string().optional(),
  notes: z.string().optional(),
}).strict().superRefine((spec, context) => {
  if (spec.status === 'verified' && spec.value === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Verified specs require a non-null value',
    });
  }
});

export const productReviewMetadataSchema = z.object({
  reviewedAt: z.string().datetime().optional(),
  reviewedBy: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
}).strict();

export type ProductTrustStatus = z.infer<typeof productTrustStatusSchema>;
export type EvidenceSpecStatus = z.infer<typeof evidenceSpecStatusSchema>;
export type SpecSourceType = z.infer<typeof specSourceTypeSchema>;
export type SpecExtractionMethod = z.infer<typeof specExtractionMethodSchema>;
export type SpecValue = z.infer<typeof specValueSchema>;
export type EvidenceBoundSpec = z.infer<typeof evidenceBoundSpecSchema>;
export type ProductReviewMetadata = z.infer<typeof productReviewMetadataSchema>;

type UnknownSpecInput = Omit<EvidenceBoundSpec, 'value' | 'status'>;
type VerifiedSpecInput = Omit<EvidenceBoundSpec, 'status' | 'value'> & { value: Exclude<SpecValue, null> };

export function createUnknownSpec(input: UnknownSpecInput): EvidenceBoundSpec {
  return evidenceBoundSpecSchema.parse({ ...input, value: null, status: 'unverified' });
}

export function createVerifiedSpec(input: VerifiedSpecInput): EvidenceBoundSpec {
  if (input.value === null) {
    throw new Error('Verified specs require a non-null value');
  }
  return evidenceBoundSpecSchema.parse({ ...input, status: 'verified' });
}

export function isEvidenceBoundSpec(value: unknown): value is EvidenceBoundSpec {
  return evidenceBoundSpecSchema.safeParse(value).success;
}
