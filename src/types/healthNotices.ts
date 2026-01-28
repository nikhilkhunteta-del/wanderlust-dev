export type WaterSafetyLevel = "safe" | "caution" | "not_recommended";
export type HealthcareStandard = "high" | "moderate" | "limited";

export interface HealthNotice {
  title: string;
  source: string;
  summary: string;
  url: string;
}

export interface VaccineRecommendation {
  vaccine: string;
  recommendation: string;
}

export interface ContextualInsight {
  type: "air_quality" | "altitude" | "heat" | "mosquito" | "other";
  title: string;
  description: string;
}

export interface HealthNoticesData {
  hasActiveAlerts: boolean;
  alertSummary: string;
  currentNotices: HealthNotice[];
  vaccines: VaccineRecommendation[];
  preventionGuidance: string[];
  waterSafety: {
    level: WaterSafetyLevel;
    description: string;
  };
  foodSafetyTips: string[];
  medicalFacilities: {
    standard: HealthcareStandard;
    pharmacyAvailability: string;
    emergencyNumber: string;
  };
  packingList: string[];
  travelInsuranceNote: string;
  contextualInsights: ContextualInsight[];
  lastUpdated: string;
}
