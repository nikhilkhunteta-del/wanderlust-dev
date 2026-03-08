import { Sunrise } from "lucide-react";

interface PerfectDayStripProps {
  city: string;
  narrative: string;
}

export const PerfectDayStrip = ({ city, narrative }: PerfectDayStripProps) => {
  if (!narrative) return null;

  return (
    <section className="mb-14">
      <h2 className="text-[20px] font-display font-medium text-foreground mb-4 flex items-center gap-2.5">
        <Sunrise className="w-5 h-5 text-[#EA580C]" />
        A perfect day in {city} for you
      </h2>
      <div
        className="relative rounded-xl border-l-[3px] border-l-[#EA580C] p-6 md:p-8"
        style={{ background: '#FAFAF8' }}
      >
        {/* Decorative opening quote */}
        <span
          className="absolute top-3 left-4 font-serif leading-none select-none pointer-events-none"
          style={{ fontSize: '64px', color: 'rgba(234, 88, 12, 0.2)' }}
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p
          className="relative italic text-muted-foreground mx-auto"
          style={{ fontSize: '16px', lineHeight: 1.8, maxWidth: '680px' }}
        >
          {narrative}
        </p>
      </div>
    </section>
  );
};
