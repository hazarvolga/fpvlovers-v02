import type { BuildSlot, FpvCatalogProduct } from '@/lib/tools/fpv-product-types';

export type EngineeringSafetyReport = {
  isEngineeringSafe: boolean;
  warnings: string[];
  verifiedFields: string[];
  unverifiedFields: string[];
};

type SafetyRequirement = {
  slot: BuildSlot;
  fields: string[];
  label: string;
};

const BUILD_COMPATIBILITY_REQUIREMENTS: SafetyRequirement[] = [
  { slot: 'motor', fields: ['kv'], label: 'motor KV' },
  { slot: 'battery', fields: ['cellCount'], label: 'battery cell count' },
  { slot: 'prop', fields: ['propSize', 'diameter'], label: 'propeller diameter' },
  { slot: 'frame', fields: ['propSize'], label: 'frame prop clearance' },
  { slot: 'stack', fields: ['escAmp'], label: 'ESC continuous current' },
];

function hasVerifiedSpec(product: FpvCatalogProduct, field: string): boolean {
  return product.evidenceSpecs?.[field]?.status === 'verified';
}

export function evaluateBuildEngineeringSafety(
  selected: Partial<Record<BuildSlot, FpvCatalogProduct>>,
): EngineeringSafetyReport {
  const warnings: string[] = [];
  const verifiedFields: string[] = [];
  const unverifiedFields: string[] = [];

  for (const requirement of BUILD_COMPATIBILITY_REQUIREMENTS) {
    const product = selected[requirement.slot];
    const fieldLabel = `${requirement.slot}.${requirement.fields[0]}`;
    if (!product) {
      unverifiedFields.push(fieldLabel);
      warnings.push(`Missing ${requirement.label}; this output is educational until the exact part is selected.`);
      continue;
    }

    if (product.trustStatus !== 'VERIFIED') {
      warnings.push(`${product.name} is ${product.trustStatus ?? 'UNVERIFIED'}; verify ${requirement.label} against the manufacturer spec before buying or wiring.`);
    }

    const verifiedField = requirement.fields.find((field) => hasVerifiedSpec(product, field));
    if (verifiedField) {
      verifiedFields.push(`${requirement.slot}.${verifiedField}`);
    } else {
      unverifiedFields.push(fieldLabel);
      warnings.push(`${product.name} lacks verified evidence for ${requirement.label}.`);
    }
  }

  return {
    isEngineeringSafe: unverifiedFields.length === 0 && warnings.length === 0,
    warnings: [...new Set(warnings)],
    verifiedFields,
    unverifiedFields,
  };
}

export function customInputEngineeringSafetyWarning(): EngineeringSafetyReport {
  return {
    isEngineeringSafe: false,
    warnings: [
      'This result uses user-entered or default calculator values, not verified product evidence. Treat it as educational sizing guidance until every critical spec is checked against manufacturer documentation.',
    ],
    verifiedFields: [],
    unverifiedFields: ['custom-input'],
  };
}
