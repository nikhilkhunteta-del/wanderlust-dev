export type AdvisoryLevel = 
  | "normal"
  | "increased_caution"
  | "reconsider_travel"
  | "avoid_travel";

export interface TravelAdvisory {
  level: AdvisoryLevel;
  levelLabel: string;
  summary: string;
  safetyPoints: string[];
  areasToAvoid: string[];
  emergencyNumbers: {
    police: string;
    ambulance: string;
    fire: string;
    tourist?: string;
  };
  sources: {
    name: string;
    url: string;
  }[];
  lastUpdated: string;
  advisoriesVary: boolean;
}
