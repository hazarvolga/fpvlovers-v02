import { BuildDNA } from "./build-dna";

/**
 * Contract specifying the Pilot Dossier state.
 * Captures ratings, class specializations, and active hardware blueprints.
 */

export type PilotClass = "Cinematic Operator" | "Freestyle Tactician" | "Competitive Racer" | "Long Range Explorer" | "System Builder / Engineer";

export interface PilotQualifications {
  qualifiedModuleIds: string[]; // e.g., ["simulator-hover", "soldering-fc"]
  classRatings: string[]; // e.g., ["Digital HD Endorsement", "Sub-250g Class Rating"]
  operationalReadinessLevel: "ORL-0" | "ORL-1" | "ORL-2" | "ORL-3" | "ORL-Elite";
}

export interface PilotDossier {
  callsign: string;
  assignedClass: PilotClass | null;
  qualifications: PilotQualifications;
  activeBuild: BuildDNA | null;
  calibrationProfile: {
    stickRates: "Defaults" | "Cinematic Smooth" | "Freestyle Snap" | "Custom";
    rcLinkFrequencyHz: 150 | 250 | 500 | 1000;
  };
  lastSavedAt: string; // ISO Date String
}
