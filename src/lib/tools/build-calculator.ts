export type BuildStyle = 'freestyle' | 'racing' | 'cinematic' | 'longRange' | 'whoop';

export type BuildCalculatorInput = {
  style: BuildStyle;
  frameWeight: number;
  motorWeight: number;
  stackWeight: number;
  videoWeight: number;
  propWeight: number;
  batteryWeight: number;
  payloadWeight: number;
  cellCount: number;
  batteryCapacityMah: number;
  batteryCRating: number;
  motorKv: number;
  propDiameter: number;
  propPitch: number;
  escAmpRating: number;
};

export type BuildCalculatorResult = {
  auw: number;
  dryWeight: number;
  targetThrustRatio: number;
  requiredTotalThrust: number;
  requiredThrustPerMotor: number;
  estimatedTotalThrust: number;
  estimatedThrustPerMotor: number;
  estimatedThrustRatio: number;
  nominalVoltage: number;
  fullVoltage: number;
  estimatedHoverThrottle: number;
  estimatedPeakCurrent: number;
  currentMargin: number;
  estimatedFlightTimeMin: number;
  discLoading: number;
  safeKvRange: { min: number; max: number };
  warnings: string[];
  verdict: 'balanced' | 'caution' | 'risky';
};

const STYLE_TARGET_RATIO: Record<BuildStyle, number> = {
  freestyle: 5,
  racing: 8,
  cinematic: 3.5,
  longRange: 3,
  whoop: 3.2,
};

const STYLE_CURRENT_FACTOR: Record<BuildStyle, number> = {
  freestyle: 0.13,
  racing: 0.2,
  cinematic: 0.09,
  longRange: 0.06,
  whoop: 0.11,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finiteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function getSafeKvRange(cellCount: number, propDiameter: number): { min: number; max: number } {
  const cells = clamp(Math.round(finiteNumber(cellCount, 6)), 2, 8);
  const diameter = clamp(finiteNumber(propDiameter, 5), 1.6, 8);
  const diameterFactor = 5 / diameter;
  const voltageFactor = 6 / cells;
  const center = 1875 * diameterFactor * voltageFactor;
  const width = diameter <= 3.5 ? 0.22 : 0.16;

  return {
    min: Math.round(center * (1 - width) / 25) * 25,
    max: Math.round(center * (1 + width) / 25) * 25,
  };
}

export function calculateBuild(input: BuildCalculatorInput): BuildCalculatorResult {
  const style = input.style;
  const cellCount = clamp(Math.round(finiteNumber(input.cellCount, 6)), 2, 8);
  const propDiameter = clamp(finiteNumber(input.propDiameter, 5), 1.6, 8);
  const propPitch = clamp(finiteNumber(input.propPitch, 3.6), 1, 6);
  const motorKv = clamp(finiteNumber(input.motorKv, 1900), 800, 6000);
  const batteryCapacityMah = clamp(finiteNumber(input.batteryCapacityMah, 1100), 300, 8000);
  const batteryCRating = clamp(finiteNumber(input.batteryCRating, 100), 30, 180);
  const escAmpRating = clamp(finiteNumber(input.escAmpRating, 45), 12, 80);
  const motorWeight = clamp(finiteNumber(input.motorWeight, 32), 3, 80);

  const frameWeight = clamp(finiteNumber(input.frameWeight, 130), 15, 400);
  const stackWeight = clamp(finiteNumber(input.stackWeight, 28), 5, 120);
  const videoWeight = clamp(finiteNumber(input.videoWeight, 35), 3, 120);
  const propWeight = clamp(finiteNumber(input.propWeight, 18), 2, 80);
  const batteryWeight = clamp(finiteNumber(input.batteryWeight, 180), 18, 900);
  const payloadWeight = clamp(finiteNumber(input.payloadWeight, 0), 0, 800);

  const dryWeight = frameWeight + motorWeight * 4 + stackWeight + videoWeight + propWeight + payloadWeight;
  const auw = dryWeight + batteryWeight;
  const targetThrustRatio = STYLE_TARGET_RATIO[style];
  const requiredTotalThrust = auw * targetThrustRatio;
  const requiredThrustPerMotor = requiredTotalThrust / 4;

  const motorMassFactor = clamp((motorWeight / 32) ** 0.6, 0.45, 1.45);
  const propLoad = propDiameter ** 3 * propPitch;
  const estimatedThrustPerMotor = propLoad * cellCount * motorKv * motorMassFactor / 3400;
  const estimatedTotalThrust = estimatedThrustPerMotor * 4;
  const estimatedThrustRatio = estimatedTotalThrust / auw;

  const nominalVoltage = cellCount * 3.7;
  const fullVoltage = cellCount * 4.2;
  const estimatedPeakCurrent = clamp(
    estimatedThrustPerMotor / Math.max(18, nominalVoltage * 1.85),
    2,
    90,
  );
  const currentMargin = escAmpRating - estimatedPeakCurrent;
  const usableCapacityAh = batteryCapacityMah * 0.78 / 1000;
  const averageCurrent = clamp(estimatedPeakCurrent * STYLE_CURRENT_FACTOR[style] * 4, 4, 160);
  const estimatedFlightTimeMin = usableCapacityAh / averageCurrent * 60;
  const estimatedHoverThrottle = clamp(Math.sqrt(auw / estimatedTotalThrust) * 100, 8, 96);
  const discArea = Math.PI * (propDiameter * 0.0254 / 2) ** 2 * 4;
  const discLoading = (auw / 1000) / discArea;
  const safeKvRange = getSafeKvRange(cellCount, propDiameter);
  const maxBatteryCurrent = batteryCapacityMah / 1000 * batteryCRating;

  const warnings: string[] = [];
  if (estimatedThrustRatio < targetThrustRatio) {
    warnings.push(`Thrust ratio is below the ${targetThrustRatio}:1 ${style} target.`);
  }
  if (motorKv < safeKvRange.min || motorKv > safeKvRange.max) {
    warnings.push(`Motor KV is outside the suggested ${safeKvRange.min}-${safeKvRange.max}KV range for ${cellCount}S ${propDiameter}" props.`);
  }
  if (currentMargin < 8) {
    warnings.push(`ESC margin is tight. Estimated peak is ${round(estimatedPeakCurrent, 1)}A per motor against ${escAmpRating}A rating.`);
  }
  if (estimatedPeakCurrent * 4 > maxBatteryCurrent) {
    warnings.push(`Battery C rating may sag under full throttle. Estimated peak draw exceeds ${round(maxBatteryCurrent)}A pack capability.`);
  }
  if (estimatedHoverThrottle > 45) {
    warnings.push('Hover throttle is high; expect sluggish recovery and shorter packs.');
  }
  if (discLoading > 18 && style !== 'racing') {
    warnings.push('Disc loading is high for a non-racing build; consider larger props or lower AUW.');
  }

  const verdict: BuildCalculatorResult['verdict'] =
    warnings.length >= 3 || estimatedThrustRatio < targetThrustRatio * 0.8
      ? 'risky'
      : warnings.length > 0
        ? 'caution'
        : 'balanced';

  return {
    auw: round(auw),
    dryWeight: round(dryWeight),
    targetThrustRatio,
    requiredTotalThrust: round(requiredTotalThrust),
    requiredThrustPerMotor: round(requiredThrustPerMotor),
    estimatedTotalThrust: round(estimatedTotalThrust),
    estimatedThrustPerMotor: round(estimatedThrustPerMotor),
    estimatedThrustRatio: round(estimatedThrustRatio, 1),
    nominalVoltage: round(nominalVoltage, 1),
    fullVoltage: round(fullVoltage, 1),
    estimatedHoverThrottle: round(estimatedHoverThrottle),
    estimatedPeakCurrent: round(estimatedPeakCurrent, 1),
    currentMargin: round(currentMargin, 1),
    estimatedFlightTimeMin: round(estimatedFlightTimeMin, 1),
    discLoading: round(discLoading, 1),
    safeKvRange,
    warnings,
    verdict,
  };
}
