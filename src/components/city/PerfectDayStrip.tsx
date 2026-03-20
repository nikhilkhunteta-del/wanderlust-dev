import { Sunrise } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";

interface PerfectDayStripProps {
  city: string;
  narrative: string;
  travelMonth?: string;
  onSwitchTab?: (tab: string) => void;
}

export const PerfectDayStrip = ({ city, narrative, travelMonth, onSwitchTab }: PerfectDayStripProps) => {
  if (!narrative) return null;

  const month = travelMonth ? formatMonthName(travelMonth) : null;

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
        {month && onSwitchTab && (
          <button
            onClick={() => onSwitchTab("weather")}
            className="relative mt-4 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto', display: 'block', textAlign: 'right' }}
          >
            How's the weather in {month}? →
          </button>
        )}
      </div>
    </section>
  );
};
