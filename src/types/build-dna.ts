/**
 * Type contract defining the precise specifications of an FPV drone Build DNA.
 * Fully normalized to allow seamless integration into the physics calculator and local critic.
 */

export type BatteryCellConfig = "1S" | "2S" | "3S" | "4S" | "6S" | "8S";
export type DigitalEcosystem = "DJI" | "Walksnail" | "HDZero" | "Analog";

export interface ComponentReference {
  componentId: string;
  name: string;
  brand: string;
  weightGrams: number;
}

export interface FrameSpecs {
  style: "Deadcat" | "TrueX" | "StretchedX" | "Whoop";
  sizeInches: 1.6 | 2 | 2.5 | 3 | 3.5 | 5 | 7 | 10;
  weightGrams: number;
}

export interface PropulsionSpecs {
  motorStatorSize: string; // e.g., "2207"
  motorKv: number;
  propellerDetails: string; // e.g., "5140 Tri-Blade"
  propellerWeightGrams: number;
  motorWeightGrams: number;
}

export interface ElectronicsSpecs {
  fcProcessor: "F405" | "F722" | "H743";
  gyroModel: "ICM42688P" | "BMI270" | "MPU6000";
  escCurrentLimit: number; // in Amperes
  receiverProtocol: "ELRS_2.4G" | "ELRS_915M" | "TBS_CROSSFIRE" | "FRSKY";
}

export interface VisionSpecs {
  ecosystem: DigitalEcosystem;
  vtxPowerMw: number;
  cameraWeightGrams: number;
  vtxWeightGrams: number;
}

export interface PowerSpecs {
  targetBatteryCells: BatteryCellConfig;
  customBecWeightGrams: number;
  hasCapacitorAttached: boolean;
}

export interface BuildDNA {
  id: string; // UUID or string identifier
  droneClass: string; // e.g., "Cinematic CineWhoop", "Freestyle Tactician"
  frame: FrameSpecs;
  propulsion: PropulsionSpecs;
  electronics: ElectronicsSpecs;
  vision: VisionSpecs;
  power: PowerSpecs;
  addedComponents: ComponentReference[];
  dryWeightGrams: number;
}
