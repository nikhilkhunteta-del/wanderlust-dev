export type AdvisoryLevel = "normal" | "increased_caution" | "reconsider_travel" | "avoid_travel";

export interface OfficialAdvisory {
  source: "us" | "uk" | "ca";
  sourceName: string;
  level: string;
  levelNumeric: number; // 0=unavailable, 1-4
  summary: string;
  sourceUrl: string;
  lastUpdated: string;
}

export type IssueCategory = "transport" | "political" | "security" | "health" | "natural" | "other";
export type IssueStatus = "current" | "watch" | "resolved";
export type ImpactLevel = "high" | "medium" | "low";

export interface CurrentIssue {
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  summary: string;
  touristImpact: ImpactLevel;
  sourceName: string;
  sourceUrl: string;
  date: string;
}

export interface SafetyCluster {
  header: string;
  points: string[];
}

export interface VisaInfo {
  passportValidity: string;
  visaFreeNationalities: string[];
  eVisaAvailable: boolean;
  visaRequired?: boolean;
  eVisaUrl?: string | null;
  isSchengen?: boolean;
  entryFrameworkNote?: string | null;
  activeRestrictions: string | null;
  sourceUrl: string;
}

export interface EmergencyContact {
  service: string;
  number: string;
}

export interface OnTheGroundData {
  verdict: string;
  verdictLevel: "green" | "amber" | "red";
  forwardAssessment: string;
  officialAdvisories: OfficialAdvisory[];
  currentIssues: CurrentIssue[];
  safetyGuidance: SafetyCluster[];
  visaInfo: VisaInfo;
  emergencyContacts: EmergencyContact[];
  emergencyNote: string | null;
  sources: string[];
  lastUpdated: string;
  disclaimer: string;
}
