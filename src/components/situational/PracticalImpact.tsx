import { Lightbulb } from "lucide-react";

interface PracticalImpactProps {
  impact: string;
}

export const PracticalImpact = ({ impact }: PracticalImpactProps) => {
  if (!impact) {
    return null;
  }

  return (
    <section className="bg-muted/30 rounded-xl p-5 border border-border/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">Practical Implications</h3>
          <p className="text-muted-foreground leading-relaxed">{impact}</p>
        </div>
      </div>
    </section>
  );
};
