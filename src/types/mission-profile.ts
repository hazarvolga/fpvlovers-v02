/**
 * Type contract specifying a Mission Profile operational envelope.
 */

export interface OperationalEnvelope {
  maxWindSpeedKph: number;
  targetFlightDurationSeconds: number;
  maxOperatingRangeMeters: number;
  allowableWeightClass: "Sub250g" | "OpenClass";
  minimumBecRatingAmps: number;
}

export interface MissionProfile {
  id: string; // e.g., "alpine-surfing"
  name: string; // e.g., "High-Altitude Alpine Surfing"
  description: string;
  assignedRequiredClass: "Long Range Explorer" | "Cinematic Operator" | "Freestyle Tactician";
  envelope: OperationalEnvelope;
  requiredHardwareKeywords: string[]; // e.g., ["GPS", "ELRS_915M", "6S"]
  requiredSkillModules: string[]; // e.g., ["gps-rescue", "high-altitude-air"]
}
