import { useState } from "react";
import { PriceCategory, TopProperty } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface PriceCategoryCardProps {
  category: PriceCategory;
  fetchedAt?: string;
}

function getCurrencySymbol(currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CNY: "¥",
    AUD: "A$", CAD: "C$", CHF: "CHF ", SEK: "kr", NOK: "kr",
    SGD: "S$", HKD: "HK$", NZD: "NZ$", ZAR: "R", BRL: "R$",
    MXN: "MX$", THB: "฿", KRW: "₩", TRY: "₺", AED: "AED ",
    SAR: "SAR ", MYR: "RM", PHP: "₱", IDR: "Rp", VND: "₫",
    MAD: "MAD ", EGP: "E£", COP: "COL$", PEN: "S/", ARS: "AR$",
    CLP: "CLP$", CZK: "Kč", PLN: "zł", HUF: "Ft", RON: "lei",
    NPR: "NRs", LKR: "Rs", KES: "KSh", TZS: "TSh", ISK: "kr",
    JOD: "JD", ILS: "₪", DKK: "kr",
  };
  return symbols[currency?.toUpperCase() || "USD"] || `${currency} `;
}

function formatFetchedDate(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function PropertyRow({ prop, symbol }: { prop: TopProperty; symbol: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-t border-border/30 first:border-t-0">
      {prop.thumbnail && (
        <img
          src={prop.thumbnail}
          alt={prop.name}
          className="w-12 h-12 rounded object-cover flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {prop.link ? (
              <a href={prop.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:underline truncate block">
                {prop.name}
              </a>
            ) : (
              <span className="text-sm font-semibold text-foreground truncate block">{prop.name}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {prop.rating && `${prop.rating}★`}
              {prop.reviewCount && ` (${prop.reviewCount.toLocaleString()} reviews)`}
              {prop.type && prop.type !== "hotel" && ` · ${prop.type}`}
            </span>
          </div>
          {prop.pricePerNight && (
            <span className="text-sm font-semibold text-foreground flex-shrink-0">
              {symbol}{prop.pricePerNight}
              <span className="text-xs font-normal text-muted-foreground">/n</span>
            </span>
          )}
        </div>
        {prop.amenities && prop.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {prop.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="inline-flex items-center px-1.5 py-0 rounded text-[10px]" style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                {a}
              </span>
            ))}
          </div>
        )}
        {prop.link && (
          <a href={prop.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1">
            View on Google Hotels <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export const PriceCategoryCard = ({ category, fetchedAt }: PriceCategoryCardProps) => {
  const [showPicks, setShowPicks] = useState(false);

  const getCategoryStyles = () => {
    switch (category.category) {
      case "budget": return "border-l-4 border-l-muted-foreground/50";
      case "midRange": return "border-l-4 border-l-primary/50";
      case "premium": return "border-l-4 border-l-primary";
      case "luxury": return "border-l-4 border-l-amber-500";
      default: return "";
    }
  };

  const symbol = getCurrencySymbol(category.currency);
  const hasLiveData = category.lowPrice !== null && category.resultCount !== undefined && category.resultCount >= 3;
  const hasAnyData = category.lowPrice !== null;
  const topPick = category.topProperties?.[0];
  const allPicks = category.topProperties || [];

  return (
    <Card className={`${getCategoryStyles()} bg-card/50`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{category.label}</h4>
            <span className="text-sm text-muted-foreground">{category.starRating}</span>
          </div>
        </div>

        {/* Price display */}
        <div className="mb-3">
          {hasAnyData ? (
            <>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-lg font-display font-bold text-foreground">
                  From {symbol}{category.lowPrice}
                </span>
                <span className="text-sm text-muted-foreground">/night</span>
              </div>
              {category.medianPrice && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Typical range: {symbol}{category.medianPrice}/night
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No availability found for this tier</p>
          )}

          {/* Data source label */}
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            {hasLiveData
              ? `Based on ${category.resultCount} live listings${fetchedAt ? ` · ${formatFetchedDate(fetchedAt)}` : ""}`
              : hasAnyData
                ? "Estimated range · verify when booking"
                : "No data available for this tier"}
          </p>
        </div>

        {/* Amenity tags */}
        {category.typicalInclusions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {category.typicalInclusions.map((inclusion, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
              >
                {inclusion}
              </span>
            ))}
          </div>
        )}

        {/* Top pick highlight */}
        {topPick && (
          <div className="text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground">{topPick.name}</span>
            {topPick.rating && <span> · {topPick.rating}★</span>}
            {topPick.reviewCount && <span> ({topPick.reviewCount.toLocaleString()} reviews)</span>}
          </div>
        )}

        {/* Booking advance guidance */}
        {category.bookingAdvance && (
          <p className="text-xs text-muted-foreground mb-2">
            {category.bookingAdvance}
          </p>
        )}

        {/* Expandable top picks */}
        {allPicks.length > 0 && (
          <Collapsible open={showPicks} onOpenChange={setShowPicks}>
            <CollapsibleTrigger className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1">
              {showPicks ? "Hide top picks" : `See top picks (${allPicks.length})`}
              {showPicks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2">
                {allPicks.slice(0, 3).map((prop, i) => (
                  <PropertyRow key={i} prop={prop} symbol={symbol} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
