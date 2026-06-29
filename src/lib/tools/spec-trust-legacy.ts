import type { FpvCatalogProduct, ProductSpecValue } from '@/lib/tools/fpv-product-types';
import {
  evidenceBoundSpecSchema,
  type EvidenceBoundSpec,
  type EvidenceSpecStatus,
  type SpecValue,
} from '@/lib/types/spec-trust';

function getValidatedEvidence(product: FpvCatalogProduct, key: string): EvidenceBoundSpec | undefined {
  const result = evidenceBoundSpecSchema.safeParse(product.evidenceSpecs?.[key]);
  return result.success ? result.data : undefined;
}

const TRUST_BADGES: Record<EvidenceSpecStatus, Uppercase<EvidenceSpecStatus>> = {
  unverified: 'UNVERIFIED',
  conflicting: 'CONFLICTING',
  verified: 'VERIFIED',
  rejected: 'REJECTED',
};

export function getSpecValue(product: FpvCatalogProduct, key: string): SpecValue | undefined {
  if (product.evidenceSpecs && Object.prototype.hasOwnProperty.call(product.evidenceSpecs, key)) {
    return getValidatedEvidence(product, key)?.value;
  }
  return product.specs[key];
}

export function getSpecNumber(product: FpvCatalogProduct, key: string): number | undefined {
  const value = getSpecValue(product, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function getSpecString(product: FpvCatalogProduct, key: string): string | undefined {
  const value = getSpecValue(product, key);
  return typeof value === 'string' ? value : undefined;
}

function isLegacySpecValue(value: unknown): value is ProductSpecValue {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (!Array.isArray(value) || value.length === 0) return false;

  const elementType = typeof value[0];
  if (elementType !== 'number' && elementType !== 'string' && elementType !== 'boolean') return false;
  return value.every((item) => (
    typeof item === elementType && (elementType !== 'number' || Number.isFinite(item))
  ));
}

export function getLegacySpecs(product: FpvCatalogProduct): Record<string, ProductSpecValue> {
  const legacySpecs: Record<string, ProductSpecValue> = { ...product.specs };
  for (const key of Object.keys(product.evidenceSpecs ?? {})) {
    const value = getSpecValue(product, key);
    if (value !== undefined && isLegacySpecValue(value)) legacySpecs[key] = value;
    else delete legacySpecs[key];
  }
  return legacySpecs;
}

export function getSpecTrustBadge(
  product: FpvCatalogProduct,
  key: string,
): Uppercase<EvidenceSpecStatus> | undefined {
  const status = getValidatedEvidence(product, key)?.status;
  return status ? TRUST_BADGES[status] : undefined;
}
