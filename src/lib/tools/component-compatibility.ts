import { calculateBuild, getSafeKvRange, type BuildStyle } from '@/lib/tools/build-calculator';
import type { BuildSelection, BuildSlot, FpvCatalogProduct } from '@/lib/tools/fpv-product-types';

export type ComponentDuelMetric = {
  label: string;
  productA: string;
  productB: string;
  winner: 'A' | 'B' | 'tie';
};

export type ComponentDuelResult = {
  winnerId: string;
  verdict: string;
  metrics: ComponentDuelMetric[];
  warnings: Record<string, string>;
  scoreA: number;
  scoreB: number;
};

export type BuildCompatibilityResult = {
  score: number;
  verdict: 'ready' | 'caution' | 'blocked';
  selected: Partial<Record<BuildSlot, FpvCatalogProduct>>;
  checks: { label: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
  summary: string;
  calculator?: ReturnType<typeof calculateBuild>;
};

function numberSpec(product: FpvCatalogProduct | undefined, key: string, fallback = 0): number {
  const value = product?.specs[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function optionalNumberSpec(product: FpvCatalogProduct | undefined, key: string): number | undefined {
  const value = product?.specs[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringSpec(product: FpvCatalogProduct | undefined, key: string, fallback = ''): string {
  const value = product?.specs[key];
  return typeof value === 'string' ? value : fallback;
}

function arraySpec(product: FpvCatalogProduct | undefined, key: string): number[] {
  const value = product?.specs[key];
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}

function formatSpec(value: number | string): string {
  return typeof value === 'number' ? String(Math.round(value * 10) / 10) : value;
}

function performanceScore(product: FpvCatalogProduct): number {
  const trust = product.trustScore;
  const pricePenalty = Math.min(product.price, 300) / 6;
  const thrust = numberSpec(product, 'thrust');
  const weight = numberSpec(product, 'weight');
  const escAmp = numberSpec(product, 'escAmp');
  const power = thrust ? thrust / 35 : escAmp ? escAmp * 1.1 : 0;
  const weightBonus = weight ? Math.max(0, 35 - weight) : 0;
  return Math.round(trust + power + weightBonus - pricePenalty);
}

function metricWinner(a: number, b: number, lowerIsBetter = false): 'A' | 'B' | 'tie' {
  if (a === b) return 'tie';
  if (lowerIsBetter) return a < b ? 'A' : 'B';
  return a > b ? 'A' : 'B';
}

export function compareComponents(productA: FpvCatalogProduct, productB: FpvCatalogProduct): ComponentDuelResult {
  const scoreA = performanceScore(productA);
  const scoreB = performanceScore(productB);
  const winnerId = scoreA >= scoreB ? productA.id : productB.id;
  const winner = winnerId === productA.id ? productA : productB;

  const metrics: ComponentDuelMetric[] = [
    {
      label: 'Trust score',
      productA: `${productA.trustScore}/100`,
      productB: `${productB.trustScore}/100`,
      winner: metricWinner(productA.trustScore, productB.trustScore),
    },
    {
      label: 'Price',
      productA: `$${productA.price.toFixed(2)}`,
      productB: `$${productB.price.toFixed(2)}`,
      winner: metricWinner(productA.price, productB.price, true),
    },
  ];

  const sharedSpecKeys = Object.keys(productA.specs).filter((key) => typeof productA.specs[key] === 'number' && typeof productB.specs[key] === 'number');
  for (const key of sharedSpecKeys.slice(0, 4)) {
    const a = numberSpec(productA, key);
    const b = numberSpec(productB, key);
    metrics.push({
      label: key.replace(/([A-Z])/g, ' $1'),
      productA: formatSpec(a),
      productB: formatSpec(b),
      winner: metricWinner(a, b, key.toLowerCase().includes('weight') || key.toLowerCase().includes('latency')),
    });
  }

  const warnings: Record<string, string> = {
    [productA.id]: productA.trustScore < 90 ? 'Lower trust score; verify recent community feedback before buying.' : 'Strong catalog confidence; still confirm exact variant and mounting pattern.',
    [productB.id]: productB.trustScore < 90 ? 'Lower trust score; verify recent community feedback before buying.' : 'Strong catalog confidence; still confirm exact variant and mounting pattern.',
  };

  return {
    winnerId,
    verdict: `${winner.name} wins this matchup on the current catalog score: trust, price, and available performance specs.`,
    metrics,
    warnings,
    scoreA,
    scoreB,
  };
}

export function analyzeBuildCompatibility(selection: BuildSelection, catalog: FpvCatalogProduct[]): BuildCompatibilityResult {
  const selected: Partial<Record<BuildSlot, FpvCatalogProduct>> = {
    frame: catalog.find((product) => product.id === selection.frame),
    motor: catalog.find((product) => product.id === selection.motor),
    prop: catalog.find((product) => product.id === selection.prop),
    stack: catalog.find((product) => product.id === selection.stack),
    battery: catalog.find((product) => product.id === selection.battery),
    video: catalog.find((product) => product.id === selection.video),
    receiver: catalog.find((product) => product.id === selection.receiver),
  };

  const checks: BuildCompatibilityResult['checks'] = [];
  const selectedProducts = Object.values(selected).filter((product): product is FpvCatalogProduct => Boolean(product));
  const requiredSlots: BuildSlot[] = ['frame', 'motor', 'prop', 'stack', 'battery'];
  const missing = requiredSlots.filter((slot) => !selected[slot]);
  if (missing.length) {
    checks.push({ label: 'Required components', status: 'fail', detail: `Missing: ${missing.join(', ')}.` });
  } else {
    checks.push({ label: 'Required components', status: 'pass', detail: 'Core frame, motor, prop, stack, and battery are selected.' });
  }

  const style = selection.style;
  const styleMismatches = Object.values(selected).filter((product) => product && !product.fit.styles.includes(style));
  if (!selectedProducts.length) {
    checks.push({ label: 'Flight style fit', status: 'warn', detail: 'Select components to evaluate flight style fit.' });
  } else if (styleMismatches.length) {
    checks.push({ label: 'Flight style fit', status: 'warn', detail: `${styleMismatches.map((product) => product.name).join(', ')} may not be ideal for ${style}.` });
  } else {
    checks.push({ label: 'Flight style fit', status: 'pass', detail: `Selected parts are tagged for ${style}.` });
  }

  const propDiameter = numberSpec(selected.prop, 'diameter', numberSpec(selected.motor, 'propSize', numberSpec(selected.frame, 'propSize', 5)));
  const framePropSizes = selected.frame?.fit.propSizes || [];
  if (!selected.frame || !selected.prop) {
    checks.push({ label: 'Frame / prop clearance', status: 'warn', detail: 'Select a frame and propeller to verify physical clearance.' });
  } else if (propDiameter && framePropSizes.length && !framePropSizes.includes(propDiameter)) {
    checks.push({ label: 'Frame / prop clearance', status: 'fail', detail: `${selected.frame.name} is tagged for ${framePropSizes.join('/')}" props, not ${propDiameter}".` });
  } else {
    checks.push({ label: 'Frame / prop clearance', status: 'pass', detail: `${propDiameter}" prop clearance is consistent with the selected frame.` });
  }

  const batteryCellCount = optionalNumberSpec(selected.battery, 'cellCount');
  const motorKv = numberSpec(selected.motor, 'kv', 1900);
  if (!selected.motor || !selected.battery || !selected.prop) {
    checks.push({ label: 'KV / voltage window', status: 'warn', detail: 'Select motor, battery, and propeller to verify KV safety window.' });
  } else if (!batteryCellCount) {
    checks.push({ label: 'KV / voltage window', status: 'warn', detail: `${selected.battery.name} is missing explicit cell count data; verify pack voltage before buying.` });
  } else {
    const safeKvRange = getSafeKvRange(batteryCellCount, propDiameter || 5);
    if (motorKv < safeKvRange.min || motorKv > safeKvRange.max) {
      checks.push({ label: 'KV / voltage window', status: 'warn', detail: `${motorKv}KV is outside the suggested ${safeKvRange.min}-${safeKvRange.max}KV window for ${batteryCellCount}S ${propDiameter}".` });
    } else {
      checks.push({ label: 'KV / voltage window', status: 'pass', detail: `${motorKv}KV sits inside the ${batteryCellCount}S ${propDiameter}" safety window.` });
    }
  }

  const motorCells = selected.motor?.fit.cellCounts || [];
  if (!selected.motor || !selected.battery) {
    checks.push({ label: 'Motor / battery cells', status: 'warn', detail: 'Select motor and battery to verify voltage compatibility.' });
  } else if (!batteryCellCount) {
    checks.push({ label: 'Motor / battery cells', status: 'warn', detail: `${selected.battery.name} is missing explicit cell count data; confirm battery cell count manually.` });
  } else if (motorCells.length && !motorCells.includes(batteryCellCount)) {
    checks.push({ label: 'Motor / battery cells', status: 'fail', detail: `${selected.motor.name} is tagged for ${motorCells.join('/')}S, but battery is ${batteryCellCount}S.` });
  } else {
    checks.push({ label: 'Motor / battery cells', status: 'pass', detail: `${batteryCellCount}S battery matches motor voltage tags.` });
  }

  let calculator: ReturnType<typeof calculateBuild> | undefined;
  if (!missing.length && batteryCellCount) {
    calculator = calculateBuild({
      style: style as BuildStyle,
      frameWeight: numberSpec(selected.frame, 'weight', 130),
      motorWeight: numberSpec(selected.motor, 'weight', 32),
      stackWeight: 28,
      videoWeight: numberSpec(selected.video, 'weight', 25),
      propWeight: numberSpec(selected.prop, 'weight', 4.4) * 4,
      batteryWeight: numberSpec(selected.battery, 'weight', 190),
      payloadWeight: 0,
      cellCount: batteryCellCount,
      batteryCapacityMah: numberSpec(selected.battery, 'capacityMah', 1100),
      batteryCRating: numberSpec(selected.battery, 'cRating', 100),
      motorKv,
      propDiameter: propDiameter || 5,
      propPitch: numberSpec(selected.prop, 'pitch', 3.6),
      escAmpRating: numberSpec(selected.stack, 'escAmp', 45),
    });

    if (calculator.currentMargin < 8) {
      checks.push({ label: 'ESC current margin', status: 'warn', detail: `Estimated peak is ${calculator.estimatedPeakCurrent}A/motor against the stack rating.` });
    } else {
      checks.push({ label: 'ESC current margin', status: 'pass', detail: `${calculator.currentMargin}A current margin per motor.` });
    }
  }

  const failCount = checks.filter((check) => check.status === 'fail').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length + (calculator?.warnings.length || 0);
  const score = Math.max(0, 100 - failCount * 28 - warnCount * 10);
  const verdict: BuildCompatibilityResult['verdict'] = failCount ? 'blocked' : warnCount ? 'caution' : 'ready';
  const protocol = stringSpec(selected.video, 'protocol') || stringSpec(selected.receiver, 'protocol');

  return {
    score,
    verdict,
    selected,
    checks,
    calculator,
    summary: protocol
      ? `Build check completed with ${protocol} control/video context and ${score}/100 confidence.`
      : `Build check completed with ${score}/100 confidence.`,
  };
}
