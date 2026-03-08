import { PriceCategory } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";

interface PriceCategoryCardProps {
  category: PriceCategory;
  fetchedAt?: string;
  isSelected?: boolean;
  onClick?: () => void;
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

export { getCurrencySymbol };

export const PriceCategoryCard = ({ category, fetchedAt, isSelected, onClick }: PriceCategoryCardProps) => {
  const symbol = getCurrencySymbol(category.currency);
  const hasLiveData = category.lowPrice !== null && category.resultCount !== undefined && category.resultCount >= 3;
  const hasAnyData = category.lowPrice !== null;
  const topPick = category.topProperties?.[0];

  const selectedStyles = isSelected
    ? "border-2 border-[#EA580C] bg-[#FFF7ED]"
    : "border border-border/50 hover:border-border";

  return (
    <Card
      className={`${selectedStyles} bg-card/50 cursor-pointer transition-all duration-150 h-full`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header: tier name + star rating */}
        <div className="mb-2">
          <h4 className="font-semibold text-foreground text-sm">{category.label}</h4>
          <span className="text-xs text-muted-foreground">{category.starRating}</span>
        </div>

        {/* Primary price */}
        <div className="mb-2">
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
            <p className="text-sm text-muted-foreground italic">No availability found</p>
          )}
        </div>

        {/* Data source */}
        <p className="text-[11px] text-muted-foreground/70 mb-2">
          {hasLiveData
            ? `Based on ${category.resultCount} live listings${fetchedAt ? ` · ${formatFetchedDate(fetchedAt)}` : ""}`
            : hasAnyData
              ? "Estimated range · verify when booking"
              : "No data available"}
        </p>

        {/* Amenity chips — max 3 */}
        {category.typicalInclusions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {category.typicalInclusions.slice(0, 3).map((inclusion, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
              >
                {inclusion}
              </span>
            ))}
          </div>
        )}

        {/* Top property name + rating */}
        {topPick && (
          <p className="text-[13px] text-muted-foreground mt-auto">
            <span className="font-medium text-foreground">{topPick.name}</span>
            {topPick.rating && <span> · {topPick.rating}★</span>}
          </p>
        )}

        {/* Booking advance */}
        {category.bookingAdvance && (
          <p className="text-xs text-orange-600 mt-1">
            {category.bookingAdvance}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
