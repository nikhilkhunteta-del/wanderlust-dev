import { Sunrise } from "lucide-react";

interface PerfectDayStripProps {
  city: string;
  narrative: string;
}

export const PerfectDayStrip = ({ city, narrative }: PerfectDayStripProps) => {
  if (!narrative) return null;

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-4 flex items-center gap-2.5">
        <Sunrise className="w-5 h-5 text-primary" />
        A perfect day in {city} for you
      </h2>
      <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 p-6 md:p-8">
        <p className="text-muted-foreground leading-relaxed text-sm md:text-base italic">
          "{narrative}"
        </p>
      </div>
    </section>
  );
};
