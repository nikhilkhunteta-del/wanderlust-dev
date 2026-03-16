import { useNavigate } from "react-router-dom";
import { formatMonthName } from "@/lib/formatMonth";
import { ArrowRight } from "lucide-react";

interface HighlightsClosingCTAProps {
  city: string;
  travelMonth?: string;
  onSwitchTab?: (tab: string) => void;
  allCities?: any[] | null;
  profile?: any | null;
}

export const HighlightsClosingCTA = ({ city, travelMonth, onSwitchTab, allCities, profile }: HighlightsClosingCTAProps) => {
  const navigate = useNavigate();
  const month = travelMonth ? formatMonthName(travelMonth) : null;
  const canCompare = allCities && allCities.length >= 3 && profile;

  return (
    <section style={{ background: '#1C1917', padding: '48px 0' }}>
      <div className="page-container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left */}
        <div>
          <h2 className="font-display font-semibold" style={{ fontSize: '20px', color: '#FFFFFF' }}>
            Ready to explore {city} further?
          </h2>
          <p className="mt-1.5" style={{ fontSize: '14px', color: '#D6D3D1' }}>
            You've seen what {city} offers year-round.
            {month ? ` Now check if ${month} is the right time to go.` : " Now plan your days."}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
          {month && (
            <button
              onClick={() => onSwitchTab?.("weather")}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-sm transition-colors"
              style={{ background: '#EA580C', color: '#FFFFFF' }}
            >
              Is {month} the right time?
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {canCompare && (
            <button
              onClick={() => navigate("/compare", { state: { cities: allCities, profile } })}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#D6D3D1' }}
            >
              Compare cities
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {!canCompare && (
            <button
              onClick={() => onSwitchTab?.("itinerary")}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#D6D3D1' }}
            >
              Plan your days
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
