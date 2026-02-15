import { Sparkles } from "lucide-react";

interface PersonalMatchSectionProps {
  city: string;
  reasons: string[];
}

export const PersonalMatchSection = ({ city, reasons }: PersonalMatchSectionProps) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-5 flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-primary" />
        Why {city} matches your travel style
      </h2>
      <ul className="space-y-3">
        {reasons.map((reason, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-muted-foreground leading-relaxed"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span
              className="text-sm md:text-base"
              dangerouslySetInnerHTML={{
                __html: reason
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>'),
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
