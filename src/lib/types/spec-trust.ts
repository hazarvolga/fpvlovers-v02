import { z } from 'zod';

export const productTrustStatusSchema = z.enum(['QUARANTINE', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED']);
export const evidenceSpecStatusSchema = z.enum(['unverified', 'conflicting', 'verified', 'rejected']);
export const specSourceTypeSchema = z.enum(['manufacturer', 'retailer', 'manual', 'community', 'unknown']);
export const specExtractionMethodSchema = z.enum(['json_ld', 'spec_table', 'regex', 'llm_structured', 'manual_override']);

const substantiveStringSchema = z.string().refine((value) => value.trim().length > 0, {
  message: 'Spec values must not be empty',
});
const specScalarValueSchema = z.union([
  substantiveStringSchema,
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
export const specValueSchema = z.union([
  specScalarValueSchema,
  z.array(substantiveStringSchema).nonempty(),
  z.array(z.number().finite()).nonempty(),
  z.array(z.boolean()).nonempty(),
]);

export const evidenceBoundSpecSchema = z.object({
  value: specValueSchema,
  unit: z.string().trim().min(1).nullable(),
  sourceUrls: z.array(z.string().url().regex(/^https?:\/\//i, {
    message: 'Source URLs must use HTTP or HTTPS',
  })).nonempty(),
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

export const productSpecConflictLogEntrySchema = z.object({
  field: z.string().trim().min(1),
  existingValue: specValueSchema,
  incomingValue: specValueSchema,
  existingSourceUrls: z.array(z.string().url().regex(/^https?:\/\//i)).nonempty(),
  incomingSourceUrls: z.array(z.string().url().regex(/^https?:\/\//i)).nonempty(),
  detectedAt: z.string().datetime(),
  resolution: z.literal('review_required'),
}).strict();

export type ProductTrustStatus = z.infer<typeof productTrustStatusSchema>;
export type EvidenceSpecStatus = z.infer<typeof evidenceSpecStatusSchema>;
export type SpecSourceType = z.infer<typeof specSourceTypeSchema>;
export type SpecExtractionMethod = z.infer<typeof specExtractionMethodSchema>;
export type SpecValue = z.infer<typeof specValueSchema>;
export type EvidenceBoundSpec = z.infer<typeof evidenceBoundSpecSchema>;
export type ProductReviewMetadata = z.infer<typeof productReviewMetadataSchema>;
export type ProductSpecConflictLogEntry = z.infer<typeof productSpecConflictLogEntrySchema>;

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
