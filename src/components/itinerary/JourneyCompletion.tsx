import { Plane, BedDouble, Share2, RotateCcw, ArrowRight, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JourneyCompletionProps {
  cityName: string;
  tripDuration: number;
  originCity?: string;
  onSwitchTab?: (tab: string) => void;
  onShare?: () => void;
  isMultiCity?: boolean;
  cities?: string[];
  onScrollToTop?: () => void;
}

export const JourneyCompletion = ({
  cityName,
  tripDuration,
  originCity,
  onSwitchTab,
  onShare,
  isMultiCity = false,
  cities = [],
  onScrollToTop,
}: JourneyCompletionProps) => {
  const navigate = useNavigate();

  const heading = isMultiCity && cities.length >= 2
    ? `Your ${tripDuration}-day journey across ${cities.slice(0, -1).join(", ")} and ${cities[cities.length - 1]} is ready`
    : `Your ${tripDuration}-day ${cityName} itinerary is ready`;

  const firstCity = cities[0] || cityName;

  const flightSubtitle = isMultiCity
    ? `You're flying into ${firstCity} — start here`
    : originCity
      ? `See the best options from ${originCity}`
      : `See the best flight options to ${cityName}`;

  return (
    <section className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm" style={{ background: '#1C1917' }}>
      <div className="px-6 md:px-10 py-10 md:py-12">
        <h3 className="font-display text-xl md:text-2xl font-semibold text-white mb-6">
          {heading}
        </h3>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => onSwitchTab?.("flights")}
            className="group text-left bg-white rounded-xl p-5 border-2 border-transparent hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-[15px]">Sort your flights</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {flightSubtitle}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 group-hover:gap-2 transition-all">
              View options <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          {/* Fix 8: Multi-city shows per-city hotel links */}
          {isMultiCity && cities.length >= 2 ? (
            <div className="bg-white rounded-xl p-5 border-2 border-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BedDouble className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-[15px]">Find your base</h4>
              </div>
              <div className="space-y-2">
                {cities.filter((c, i, arr) => arr.indexOf(c) === i).map((c) => (
                  <button
                    key={c}
                    onClick={() => onSwitchTab?.("stays")}
                    className="group flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <span>Hotels in {c}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSwitchTab?.("stays")}
              className="group text-left bg-white rounded-xl p-5 border-2 border-transparent hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BedDouble className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-[15px]">Find your base</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Live prices for your dates in {cityName}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 group-hover:gap-2 transition-all">
                View options <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-4 flex-wrap">
          {onShare && (
            <button
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              style={{ background: '#EA580C', color: '#FFFFFF' }}
            >
              <Share2 className="w-4 h-4" />
              Share trip
            </button>
          )}
          {isMultiCity && onScrollToTop && (
            <button
              onClick={onScrollToTop}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#D6D3D1' }}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Adjust the journey
            </button>
          )}
          <button
            onClick={() => navigate("/questionnaire")}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
            style={{ color: '#D6D3D1' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start over
          </button>
        </div>
      </div>
    </section>
  );
};
