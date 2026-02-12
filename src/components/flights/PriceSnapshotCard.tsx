import { PriceSnapshot } from "@/types/flightInsights";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PriceSnapshotCardProps {
  snapshot: PriceSnapshot;
  travelMonth: string;
}

function getCurrencySymbol(currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CNY: "¥",
    AUD: "A$", CAD: "C$", CHF: "CHF ", SEK: "kr", NOK: "kr",
    SGD: "S$", HKD: "HK$", NZD: "NZ$", ZAR: "R", BRL: "R$",
    MXN: "MX$", THB: "฿", KRW: "₩", TRY: "₺", AED: "AED ",
    SAR: "SAR ", MYR: "RM", PHP: "₱", IDR: "Rp", VND: "₫",
  };
  return symbols[currency?.toUpperCase() || "USD"] || `${currency} `;
}

export const PriceSnapshotCard = ({ snapshot, travelMonth }: PriceSnapshotCardProps) => {
  const trendConfig = {
    lower: {
      icon: <TrendingDown className="w-5 h-5" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      label: "Lower than usual",
    },
    typical: {
      icon: <Minus className="w-5 h-5" />,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      label: "Typical pricing",
    },
    higher: {
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      label: "Higher than usual",
    },
  };

  const trend = trendConfig[snapshot.trend];

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Typical round-trip economy</p>
          <p className="text-4xl font-bold text-foreground">
            {getCurrencySymbol(snapshot.currency)}{snapshot.typicalPrice.toLocaleString()}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${trend.bgColor} ${trend.color}`}>
          {trend.icon}
          <span className="text-sm font-medium">{trend.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Low</p>
          <p className="text-lg font-semibold text-foreground">{getCurrencySymbol(snapshot.currency)}{snapshot.lowPrice.toLocaleString()}</p>
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full relative">
          <div
            className="absolute h-full bg-gradient-to-r from-emerald-400 via-primary to-amber-400 rounded-full"
            style={{ 
              left: '0%', 
              width: '100%' 
            }}
          />
          <div
            className="absolute w-3 h-3 bg-foreground rounded-full -top-0.5 shadow-sm"
            style={{
              left: `${((snapshot.typicalPrice - snapshot.lowPrice) / (snapshot.highPrice - snapshot.lowPrice)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">High</p>
          <p className="text-lg font-semibold text-foreground">{getCurrencySymbol(snapshot.currency)}{snapshot.highPrice.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {snapshot.trendExplanation}
      </p>

      <p className="text-xs text-muted-foreground/60 mt-4 pt-3 border-t border-border/30">
        Indicative pricing based on historical patterns. Actual fares vary.
      </p>
    </div>
  );
};
