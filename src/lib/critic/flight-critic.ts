/**
 * Flight Critic Engine.
 * Local, deterministic rules-based physical and electrical compatibility auditor.
 * Analyzes Build DNA specs and compares them against target Mission Profile envelopes.
 */

import { BuildDNA } from "@/types/build-dna";
import { MissionProfile } from "@/types/mission-profile";

export interface CriticWarning {
  level: "critical" | "caution" | "info";
  title: string;
  details: string;
}

export interface CriticResult {
  score: number; // Compatibility rating from 0 to 100
  verdict: "CLEAR" | "CAUTION" | "CRITICAL";
  warnings: CriticWarning[];
}

/**
 * Audits a physical Build DNA against electrical guidelines and optionally 
 * checks suitability for a target Mission Profile.
 */
export function auditBuildDNA(build: BuildDNA, mission?: MissionProfile | null): CriticResult {
  const warnings: CriticWarning[] = [];
  let score = 100;

  // 1. Digital VTX BEC Electrical Audit
  const isDigital = build.vision.ecosystem === "DJI" || build.vision.ecosystem === "Walksnail";
  const hasNoBec = build.power.customBecWeightGrams === 0;
  const isWeakFc = build.electronics.fcProcessor === "F405";

  if (isDigital && hasNoBec && isWeakFc) {
    warnings.push({
      level: "critical",
      title: "Digital VTX BEC Overload Risk",
      details: "F405 Flight Controllers have weak built-in 5V regulators. Digital video transmitters (like DJI O3) draw high currents (2.0A - 2.5A) and must be powered from a dedicated external BEC (9V/12V) or directly from battery pads if VTX voltage allows. Wiring directly to a weak 5V rail will trigger thermal regulator shutdown and immediate mid-flight video blackout."
    });
    score -= 30;
  }

  // 2. Powertrain Voltage & KV Commutation Matcher
  const is6S = build.power.targetBatteryCells === "6S";
  const is4S = build.power.targetBatteryCells === "4S";
  const isHighKv = build.propulsion.motorKv >= 2400;
  const isLowKv = build.propulsion.motorKv <= 1500;
  const isFiveInchOrGreater = build.frame.sizeInches >= 5;

  if (is6S && isHighKv && isFiveInchOrGreater) {
    warnings.push({
      level: "critical",
      title: "High Voltage Stator Commutation Mismatch",
      details: "Running high 2400+ KV motors on 6S voltage bands with 5-inch or larger props will draw massive currents (exceeding 60A per motor). This layout will trigger severe ESC MOSFET thermal breakdown, battery swelling, or direct motor winding burnout at full throttle throttle punches."
    });
    score -= 35;
  }

  if (is4S && isLowKv && isFiveInchOrGreater) {
    warnings.push({
      level: "caution",
      title: "Under-powered Low KV Powertrain Layout",
      details: "Low 1500 KV motors running on 4S cells will generate insufficient static thrust to navigate freestyle payloads safely. Recovery throttle snaps during fast-descending maneuvers will suffer from severe propwash vibrations."
    });
    score -= 15;
  }

  // 3. Gyro Model Resonance Mismatch
  const isSensitiveGyro = build.electronics.gyroModel === "ICM42688P";
  const lacksCapacitor = !build.power.hasCapacitorAttached;

  if (isSensitiveGyro && lacksCapacitor) {
    warnings.push({
      level: "critical",
      title: "ICM Gyro Electrical Noise Susceptibility",
      details: "The ICM42688P Gyro chip is highly sensitive to electrical noise spikes from high-power ESC switching. Operating this build without a low-ESR capacitor (minimum 35V 1000uF for 6S) soldered directly to the battery pads will inject excessive dynamic filter lag, leading to severe D-term motor heating."
    });
    score -= 25;
  }

  // 4. Mission Profile Specific Requirements Audit
  if (mission) {
    // A. Weight class checks
    const targetAuwGrams = build.dryWeightGrams + (is6S ? 220 : 190); // Estimating standard battery weights
    if (mission.envelope.allowableWeightClass === "Sub250g" && targetAuwGrams >= 250) {
      warnings.push({
        level: "critical",
        title: "Airspace Weight Limitation Violation",
        details: `This target mission demands a strict Sub-250g weight envelope. Your estimated All-Up-Weight (AUW) is ${targetAuwGrams}g. Flying this configuration violates local civil aviation regulations without active remote ID registration.`
      });
      score -= 30;
    }

    // B. Long Range exploration safety
    const isExplorerMission = mission.assignedRequiredClass === "Long Range Explorer";
    const hasLongRangeLink = build.electronics.receiverProtocol === "ELRS_915M" || build.electronics.receiverProtocol === "TBS_CROSSFIRE";
    
    if (isExplorerMission && !hasLongRangeLink) {
      warnings.push({
        level: "critical",
        title: "Long-Range RF Link Insufficiency",
        details: "Alpine exploration missions demand high-penetration signal bands. Utilizing standard 2.4GHz receiver protocols increases risks of mountain signal shadowing and multipath blockages. A 915MHz or Crossfire link is mandatory."
      });
      score -= 20;
    }

    // C. GPS Rescue failsafe audit
    const hasGps = build.addedComponents.some(comp => comp.componentId.toLowerCase().includes("gps") || comp.name.toLowerCase().includes("gps"));
    if (isExplorerMission && !hasGps) {
      warnings.push({
        level: "critical",
        title: "Missing GPS Rescue Telemetry Failsafe",
        details: "Long range operations require active automated return failsafes. Operating without an active GPS coordinate module prevents Betaflight from executing recovery rescue return maneuvers in the event of a lost radio link."
      });
      score -= 25;
    }
  }

  // Bind absolute score bounds
  const finalScore = Math.max(0, Math.min(100, score));
  let verdict: "CLEAR" | "CAUTION" | "CRITICAL" = "CLEAR";
  
  if (warnings.some(w => w.level === "critical")) {
    verdict = "CRITICAL";
  } else if (warnings.some(w => w.level === "caution") || finalScore < 80) {
    verdict = "CAUTION";
  }

  return {
    score: finalScore,
    verdict,
    warnings
  };
}
