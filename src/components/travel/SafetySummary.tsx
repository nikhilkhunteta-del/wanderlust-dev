import { CheckCircle2 } from "lucide-react";

interface SafetySummaryProps {
  points: string[];
}

export const SafetySummary = ({ points }: SafetySummaryProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Key Safety Information</h3>
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
