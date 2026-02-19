import { Calendar } from "lucide-react";

interface SeasonalHealthSectionProps {
  considerations: string[];
}

export const SeasonalHealthSection = ({ considerations }: SeasonalHealthSectionProps) => {
  if (!considerations || considerations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Seasonal Health Considerations</h3>
      <div className="space-y-3">
        {considerations.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
