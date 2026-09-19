export type ShotWindow = 'morning' | 'postbreakfast' | 'evening';

export interface PeptideType {
  name: string;
  vialSize?: string | null;
  defaultWindow?: ShotWindow | null;
}

export interface CycleConfig {
  onWeeks: number;
  offWeeks: number;
  anchorDate?: string | null; // YYYY-MM-DD
}

export interface TitrationStep {
  week: number;
  mg: number;
}

export interface SchedulingProfile {
  programStart?: string | null;
  currentDoses?: Record<string, number>;
  titrationSchedules?: Record<string, TitrationStep[]>;
  titrationAnchors?: Record<string, string>;
  peptideCycles?: Record<string, CycleConfig>;
  peptideWindowOverrides?: Record<string, ShotWindow>;
}
