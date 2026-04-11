import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";

interface TimeSlot {
  time: string;
  activity: string;
}

interface PerfectDayStripProps {
  city: string;
  narrative: string;
  perfectDayTimeline?: TimeSlot[];
  travelMonth?: string;
  onSwitchTab?: (tab: string) => void;
}

const SLOT_CONFIG = [
  { label: "Morning", icon: Sunrise, color: "text-amber-500" },
  { label: "Midday", icon: Sun, color: "text-yellow-500" },
  { label: "Evening", icon: Sunset, color: "text-orange-500" },
  { label: "Night", icon: Moon, color: "text-indigo-400" },
];

function parseNarrativeToSlots(narrative: string): TimeSlot[] {
  // Split narrative into ~4 sentences and map to time slots
  const sentences = narrative
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const labels = ["Morning", "Midday", "Evening", "Night"];
  return labels.map((label, i) => ({
    time: label,
    activity: sentences[i] || sentences[sentences.length - 1] || narrative,
  }));
}

export const PerfectDayStrip = ({
  city,
  narrative,
  perfectDayTimeline,
  travelMonth,
  onSwitchTab,
}: PerfectDayStripProps) => {
  if (!narrative && (!perfectDayTimeline || perfectDayTimeline.length === 0)) return null;

  const month = travelMonth ? formatMonthName(travelMonth) : null;

  // Use structured timeline if available, otherwise parse from narrative
  const slots =
    perfectDayTimeline && perfectDayTimeline.length === 4
      ? perfectDayTimeline
      : parseNarrativeToSlots(narrative);

  return (
    <section className="mb-14">
      <h2 className="text-[20px] font-display font-medium text-foreground mb-5 flex items-center gap-2.5">
        <Sunrise className="w-5 h-5 text-[#EA580C]" />
        A perfect day in {city} for you
      </h2>

      {/* Timeline grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {slots.map((slot, i) => {
          const config = SLOT_CONFIG[i] || SLOT_CONFIG[0];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className="relative flex md:flex-col items-start gap-3 md:gap-2 p-4 rounded-xl border border-border/60 bg-card"
            >
              {/* Connector line (desktop only, not on last) */}
              {i < slots.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-[17px] w-[17px] h-px bg-border/60" />
              )}
              <div className={`flex items-center gap-2 ${config.color}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {slot.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {slot.activity}
              </p>
            </div>
          );
        })}
      </div>

      {month && onSwitchTab && (
        <button
          onClick={() => onSwitchTab("weather")}
          className="mt-4 text-[13px] text-muted-foreground hover:text-foreground transition-colors block ml-auto"
        >
          How's the weather in {month}? →
        </button>
      )}
    </section>
  );
};
