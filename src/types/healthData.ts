export interface HealthVaccine {
  name: string;
  recommendation_level: "Routine" | "Recommended" | "Required";
  reason: string;
}

export interface HealthNotice {
  source: string;
  title: string;
  summary: string;
  url: string;
  date: string;
}

export interface HealthData {
  healthRiskLevel: "low" | "moderate" | "high";
  healthSummary: string;
  hasActiveAlerts: boolean;
  activeNotices: HealthNotice[];
  vaccines: HealthVaccine[];
  waterSafety: {
    status: "safe" | "caution" | "unsafe";
    reason: string;
  };
  foodSafety: string;
  medicalFacilities: {
    quality: string;
    qualityDetail: string;
    pharmacy: string;
    emergencyNumber: string;
    emergencyDescriptor?: string;
  };
  seasonalConsiderations: string[];
  packingSuggestions: string[];
  reassuranceLine?: string | null;
  lastUpdated: string;
  dataSources: string[];
}
