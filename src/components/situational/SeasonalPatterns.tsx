import { SeasonalPattern } from "@/types/situationalAwareness";
import { Calendar } from "lucide-react";

interface SeasonalPatternsProps {
  patterns: SeasonalPattern[];
  travelMonth: string;
}

const MONTH_DISPLAY: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
  flexible: "your visit",
};

export const SeasonalPatterns = ({ patterns, travelMonth }: SeasonalPatternsProps) => {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  const monthDisplay = MONTH_DISPLAY[travelMonth] || travelMonth;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Seasonal Patterns in {monthDisplay}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns.map((pattern, index) => (
          <div
            key={index}
            className="bg-muted/50 rounded-lg p-4 border border-border/30"
          >
            <h4 className="font-medium text-foreground mb-1">{pattern.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pattern.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
