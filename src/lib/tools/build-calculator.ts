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

// Average current draw as fraction of peak current (per motor).
// Calibrated from real Blackbox logs and battery discharge data.
// Motors spend most time at low-mid throttle; avg current << peak.
const STYLE_AVG_CURRENT_FRAC: Record<BuildStyle, number> = {
  freestyle: 0.11,   // ~3.5-4A avg per motor on a 35A peak → ~3-4 min with 1100mAh 6S
  racing: 0.18,      // higher sustained throttle
  cinematic: 0.07,   // gentle cruising
  longRange: 0.05,   // minimal throttle, mostly gliding
  whoop: 0.10,       // indoor, moderate throttle
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

// ---------------------------------------------------------------------------
// Thrust Lookup Table — calibrated from real motor bench tests
// ---------------------------------------------------------------------------
// Each entry: { propDiameter (inches), cells, refKv, thrust (grams/motor) }
// Source: miniquadtestbench.com, manufacturer datasheets, Oscar Liang reviews
// All values at 100% throttle with typical prop pitch for the diameter.

type ThrustDataPoint = {
  propDiameter: number;
  cells: number;
  refKv: number;           // reference KV for this data point
  refPitch: number;        // reference prop pitch for this data point
  thrust: number;          // grams per motor at 100% throttle
  peakAmps: number;        // peak current draw per motor (A)
};

const THRUST_TABLE: ThrustDataPoint[] = [
  // 2" whoop/micro (1S-2S)
  { propDiameter: 2,   cells: 1, refKv: 19000, refPitch: 1.5,  thrust: 35,   peakAmps: 3.5 },
  { propDiameter: 2,   cells: 2, refKv: 9000,  refPitch: 1.5,  thrust: 55,   peakAmps: 5 },

  // 3" toothpick/cinewhoop (2S-4S)
  { propDiameter: 3,   cells: 2, refKv: 4500,  refPitch: 1.8,  thrust: 140,  peakAmps: 8 },
  { propDiameter: 3,   cells: 3, refKv: 3200,  refPitch: 2.0,  thrust: 230,  peakAmps: 12 },
  { propDiameter: 3,   cells: 4, refKv: 2400,  refPitch: 2.0,  thrust: 350,  peakAmps: 18 },

  // 3.5" baby quads
  { propDiameter: 3.5, cells: 4, refKv: 2550,  refPitch: 2.5,  thrust: 420,  peakAmps: 20 },
  { propDiameter: 3.5, cells: 6, refKv: 1700,  refPitch: 2.5,  thrust: 520,  peakAmps: 22 },

  // 4" light freestyle
  { propDiameter: 4,   cells: 4, refKv: 2400,  refPitch: 2.5,  thrust: 520,  peakAmps: 22 },
  { propDiameter: 4,   cells: 6, refKv: 1600,  refPitch: 3.0,  thrust: 700,  peakAmps: 28 },

  // 5" freestyle/racing (most common)
  { propDiameter: 5,   cells: 4, refKv: 2550,  refPitch: 3.0,  thrust: 750,  peakAmps: 28 },
  { propDiameter: 5,   cells: 6, refKv: 1900,  refPitch: 3.6,  thrust: 1050, peakAmps: 35 },
  { propDiameter: 5,   cells: 8, refKv: 1350,  refPitch: 3.6,  thrust: 1350, peakAmps: 42 },

  // 5.1" (popular racing prop size, e.g. HQProp 5.1x3.6x3)
  { propDiameter: 5.1, cells: 6, refKv: 1900,  refPitch: 3.6,  thrust: 1100, peakAmps: 38 },

  // 6" mid-range
  { propDiameter: 6,   cells: 4, refKv: 2100,  refPitch: 3.0,  thrust: 900,  peakAmps: 30 },
  { propDiameter: 6,   cells: 6, refKv: 1500,  refPitch: 3.5,  thrust: 1350, peakAmps: 40 },

  // 7" long range
  { propDiameter: 7,   cells: 4, refKv: 1750,  refPitch: 2.5,  thrust: 1100, peakAmps: 28 },
  { propDiameter: 7,   cells: 6, refKv: 1300,  refPitch: 3.0,  thrust: 1800, peakAmps: 42 },

  // 8" cinematography / long range (X-Class lite)
  { propDiameter: 8,   cells: 6, refKv: 1100,  refPitch: 3.0,  thrust: 2200, peakAmps: 48 },
];

/**
 * Interpolate thrust from the lookup table.
 * Uses bilinear interpolation on (propDiameter, cells) grid,
 * then applies KV and pitch correction factors.
 */
function estimateThrust(
  propDiameter: number,
  propPitch: number,
  cells: number,
  motorKv: number,
  motorWeight: number,
): { thrustPerMotor: number; peakAmpsPerMotor: number } {
  // Find the two closest diameter brackets
  const diameters = [...new Set(THRUST_TABLE.map(d => d.propDiameter))].sort((a, b) => a - b);
  const dLow = diameters.reduce((prev, d) => d <= propDiameter ? d : prev, diameters[0]);
  const dHigh = diameters.reduce((prev, d) => d >= propDiameter ? (prev > propDiameter ? Math.min(prev, d) : d) : prev, diameters[diameters.length - 1]);

  function interpolateForDiameter(d: number): { thrust: number; amps: number; refKv: number; refPitch: number } | null {
    // Find entries for this diameter, sorted by cells
    const entries = THRUST_TABLE.filter(e => e.propDiameter === d).sort((a, b) => a.cells - b.cells);
    if (entries.length === 0) return null;

    // Clamp cells to available range
    if (cells <= entries[0].cells) {
      return { thrust: entries[0].thrust, amps: entries[0].peakAmps, refKv: entries[0].refKv, refPitch: entries[0].refPitch };
    }
    if (cells >= entries[entries.length - 1].cells) {
      const last = entries[entries.length - 1];
      return { thrust: last.thrust, amps: last.peakAmps, refKv: last.refKv, refPitch: last.refPitch };
    }

    // Linear interpolation between cell brackets
    for (let i = 0; i < entries.length - 1; i++) {
      if (cells >= entries[i].cells && cells <= entries[i + 1].cells) {
        const t = (cells - entries[i].cells) / (entries[i + 1].cells - entries[i].cells);
        return {
          thrust: entries[i].thrust + t * (entries[i + 1].thrust - entries[i].thrust),
          amps: entries[i].peakAmps + t * (entries[i + 1].peakAmps - entries[i].peakAmps),
          refKv: entries[i].refKv + t * (entries[i + 1].refKv - entries[i].refKv),
          refPitch: entries[i].refPitch + t * (entries[i + 1].refPitch - entries[i].refPitch),
        };
      }
    }
    // Fallback to nearest
    const nearest = entries.reduce((prev, e) => Math.abs(e.cells - cells) < Math.abs(prev.cells - cells) ? e : prev);
    return { thrust: nearest.thrust, amps: nearest.peakAmps, refKv: nearest.refKv, refPitch: nearest.refPitch };
  }

  const low = interpolateForDiameter(dLow);
  const high = interpolateForDiameter(dHigh);

  let baseThrust: number;
  let baseAmps: number;
  let refKv: number;
  let refPitch: number;

  if (!low && !high) {
    // Absolute fallback — should never happen with our table coverage
    baseThrust = 800;
    baseAmps = 30;
    refKv = 1900;
    refPitch = 3.6;
  } else if (!low || dLow === dHigh) {
    baseThrust = (high ?? low)!.thrust;
    baseAmps = (high ?? low)!.amps;
    refKv = (high ?? low)!.refKv;
    refPitch = (high ?? low)!.refPitch;
  } else if (!high) {
    baseThrust = low.thrust;
    baseAmps = low.amps;
    refKv = low.refKv;
    refPitch = low.refPitch;
  } else {
    // Interpolate between diameter brackets
    const t = dHigh === dLow ? 0 : (propDiameter - dLow) / (dHigh - dLow);
    baseThrust = low.thrust + t * (high.thrust - low.thrust);
    baseAmps = low.amps + t * (high.amps - low.amps);
    refKv = low.refKv + t * (high.refKv - low.refKv);
    refPitch = low.refPitch + t * (high.refPitch - low.refPitch);
  }

  // KV correction: thrust scales roughly linearly with KV (within sane range)
  // A motor with 10% higher KV produces ~8% more thrust (diminishing returns from efficiency loss)
  const kvRatio = motorKv / refKv;
  const kvCorrection = clamp(1 + (kvRatio - 1) * 0.8, 0.5, 1.6);

  // Pitch correction: thrust scales ~linearly with pitch (for small deviations)
  const pitchRatio = propPitch / refPitch;
  const pitchCorrection = clamp(1 + (pitchRatio - 1) * 0.6, 0.6, 1.5);

  // Motor weight factor: heavier motors generally produce more thrust (bigger stator)
  // Reference: 32g is a typical 2306 motor. Correction is gentle.
  const motorFactor = clamp(1 + ((motorWeight / 32) - 1) * 0.3, 0.7, 1.4);

  const thrustPerMotor = baseThrust * kvCorrection * pitchCorrection * motorFactor;

  // Current scales with thrust roughly by thrust^1.5/voltage (momentum theory: P ∝ T^1.5)
  const thrustCorrectionTotal = kvCorrection * pitchCorrection * motorFactor;
  const ampCorrection = clamp(thrustCorrectionTotal ** 1.3, 0.5, 2.5);
  const peakAmpsPerMotor = baseAmps * ampCorrection;

  return {
    thrustPerMotor: Math.round(thrustPerMotor),
    peakAmpsPerMotor: round(peakAmpsPerMotor, 1),
  };
}

export function getSafeKvRange(cellCount: number, propDiameter: number): { min: number; max: number } {
  const cells = clamp(Math.round(finiteNumber(cellCount, 6)), 1, 8);
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
  const cellCount = clamp(Math.round(finiteNumber(input.cellCount, 6)), 1, 8);
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

  // --- Calibrated thrust estimation ---
  const { thrustPerMotor: estimatedThrustPerMotor, peakAmpsPerMotor } = estimateThrust(
    propDiameter,
    propPitch,
    cellCount,
    motorKv,
    motorWeight,
  );
  const estimatedTotalThrust = estimatedThrustPerMotor * 4;
  const estimatedThrustRatio = estimatedTotalThrust / auw;

  const nominalVoltage = cellCount * 3.7;
  const fullVoltage = cellCount * 4.2;

  // Peak current per motor from lookup table (calibrated)
  const estimatedPeakCurrent = clamp(peakAmpsPerMotor, 2, 90);
  const currentMargin = escAmpRating - estimatedPeakCurrent;

  // Flight time: average current = peak × avgThrottleFraction × 4 motors
  const usableCapacityAh = batteryCapacityMah * 0.78 / 1000;
  const avgFrac = STYLE_AVG_CURRENT_FRAC[style];
  // Average total current = peak per motor × avg fraction × 4 motors
  const averageCurrent = clamp(estimatedPeakCurrent * avgFrac * 4, 2, 200);
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
