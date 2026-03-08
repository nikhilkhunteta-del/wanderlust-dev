import { PriceCategory } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";

interface PriceCategoryCardProps {
  category: PriceCategory;
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

export const PriceCategoryCard = ({ category }: PriceCategoryCardProps) => {
  const getCategoryStyles = () => {
    switch (category.category) {
      case "budget":
        return "border-l-4 border-l-muted-foreground/50";
      case "midRange":
        return "border-l-4 border-l-primary/50";
      case "premium":
        return "border-l-4 border-l-primary";
      case "luxury":
        return "border-l-4 border-l-amber-500";
      default:
        return "";
    }
  };

  const symbol = getCurrencySymbol(category.currency);
  const hasData = category.lowPrice !== null && category.highPrice !== null;
  const isLive = hasData; // SerpAPI data is live

  return (
    <Card className={`${getCategoryStyles()} bg-card/50`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{category.label}</h4>
            <span className="text-sm text-muted-foreground">{category.starRating}</span>
          </div>
          {category.resultCount !== undefined && category.resultCount > 0 && (
            <span className="text-[11px] text-muted-foreground/60">
              {category.resultCount} found
            </span>
          )}
        </div>

        {/* Price display */}
        <div className="mb-3">
          {hasData ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display font-bold text-foreground">
                  {symbol}{category.lowPrice}
                </span>
                <span className="text-muted-foreground">–</span>
                <span className="text-2xl font-display font-bold text-foreground">
                  {symbol}{category.highPrice}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/night</span>
              </div>
              {category.medianPrice && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Typical: {symbol}{category.medianPrice}/night
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No availability found</p>
          )}
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            {isLive ? "Live rates from Google Hotels" : "AI estimate · not live rates"}
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

        {/* Top property preview */}
        {category.topProperties && category.topProperties.length > 0 && (
          <div className="space-y-2 mb-3">
            {category.topProperties.slice(0, 2).map((prop, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {prop.thumbnail && (
                  <img
                    src={prop.thumbnail}
                    alt={prop.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {prop.link ? (
                    <a href={prop.link} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline truncate block">
                      {prop.name}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground truncate block">{prop.name}</span>
                  )}
                  <span className="text-muted-foreground">
                    {prop.rating && `${prop.rating}★`}
                    {prop.pricePerNight && ` · ${symbol}${prop.pricePerNight}/n`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking advance guidance */}
        {category.bookingAdvance && (
          <p className="text-xs text-muted-foreground">
            {category.bookingAdvance}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
