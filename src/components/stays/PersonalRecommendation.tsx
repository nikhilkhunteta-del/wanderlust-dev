interface PersonalRecommendationProps {
  recommendation: string;
}

export const PersonalRecommendation = ({ recommendation }: PersonalRecommendationProps) => {
  return (
    <div
      className="rounded-lg p-4 border-l-[3px]"
      style={{ backgroundColor: "#FEF3C7", borderLeftColor: "#D97706" }}
    >
      <p className="text-sm text-foreground leading-relaxed">{recommendation}</p>
    </div>
  );
};
