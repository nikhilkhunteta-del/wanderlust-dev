import { HotelVsApartment, VacationRentals, TopProperty } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Coins, Info, ExternalLink } from "lucide-react";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { useMemo } from "react";

interface HotelVsApartmentSectionProps {
  data: HotelVsApartment;
  vacationRentals?: VacationRentals | null;
  currency?: string;
  hotelMedianPrice?: number | null;
}

function getCurrencySymbol(currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CNY: "¥",
    AUD: "A$", CAD: "C$", CHF: "CHF ", SEK: "kr", NOK: "kr",
    SGD: "S$", HKD: "HK$", NZD: "NZ$", ZAR: "R", BRL: "R$",
    MXN: "MX$", THB: "฿", KRW: "₩", TRY: "₺", AED: "AED ",
  };
  return symbols[currency?.toUpperCase() || "USD"] || `${currency} `;
}

function RentalPropertyRow({ prop, symbol }: { prop: TopProperty; symbol: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-t border-border/30 first:border-t-0">
      {prop.thumbnail && (
        <img src={prop.thumbnail} alt={prop.name} className="w-12 h-12 rounded object-cover flex-shrink-0" loading="lazy" />
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
              {prop.type && ` · ${prop.type}`}
            </span>
          </div>
          {prop.pricePerNight && (
            <span className="text-sm font-semibold text-foreground flex-shrink-0">
              {symbol}{prop.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/n</span>
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
            View listing <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export const HotelVsApartmentSection = ({ data, vacationRentals, currency, hotelMedianPrice }: HotelVsApartmentSectionProps) => {
  const symbol = getCurrencySymbol(currency);
  const hasLiveRentalData = vacationRentals && vacationRentals.resultCount > 0;

  // Build real price comparison if we have both data points
  let priceComparisonText = data.priceComparison;
  if (hasLiveRentalData && vacationRentals.medianPrice && hotelMedianPrice) {
    const diff = Math.round(((vacationRentals.medianPrice - hotelMedianPrice) / hotelMedianPrice) * 100);
    if (diff > 0) {
      priceComparisonText = `Vacation rentals in this city are typically ${diff}% more expensive than mid-range hotels — median ${symbol}${vacationRentals.medianPrice}/night vs ${symbol}${hotelMedianPrice}/night for hotels.`;
    } else if (diff < 0) {
      priceComparisonText = `Vacation rentals can be ${Math.abs(diff)}% cheaper than mid-range hotels — median ${symbol}${vacationRentals.medianPrice}/night vs ${symbol}${hotelMedianPrice}/night for hotels.`;
    } else {
      priceComparisonText = `Vacation rentals and mid-range hotels are similarly priced — both around ${symbol}${vacationRentals.medianPrice}/night.`;
    }
  } else if (hasLiveRentalData && vacationRentals.medianPrice) {
    priceComparisonText = `Vacation rentals start from ${symbol}${vacationRentals.lowestPrice}/night, with a typical price around ${symbol}${vacationRentals.medianPrice}/night.`;
  }

  const contextCards = [
    { icon: Users, title: "Best for apartments", description: stripMarkdown(data.bestForApartments) },
    { icon: Coins, title: "Price comparison", description: stripMarkdown(priceComparisonText) },
    { icon: Info, title: "What to know", description: stripMarkdown(data.whatToKnow) },
  ];

  // Sort listings by price ascending, filter to only those with valid links
  const processedListings = useMemo(() => {
    if (!hasLiveRentalData || !vacationRentals.topProperties.length) return null;

    const withLinks = vacationRentals.topProperties
      .filter(p => p.link && p.link.trim() !== "")
      .sort((a, b) => (a.pricePerNight ?? Infinity) - (b.pricePerNight ?? Infinity));

    if (withLinks.length === 0) return null;

    const prices = withLinks.map(p => p.pricePerNight).filter((p): p is number => p !== null && p > 0);
    const lowest = prices.length ? Math.min(...prices) : null;
    const highest = prices.length ? Math.max(...prices) : null;
    const shouldSplit = lowest && highest && highest / lowest > 5;
    const midpoint = lowest && highest ? Math.round((lowest + highest) / 2) : null;

    return { withLinks, lowest, highest, shouldSplit, midpoint };
  }, [hasLiveRentalData, vacationRentals?.topProperties]);

  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Hotel vs Apartment Stay
      </h3>

      {/* Context cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {contextCards.map((card, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-medium text-sm text-foreground">{card.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live vacation rental listings */}
      {processedListings && processedListings.withLinks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">
            Top vacation rentals
          </h4>
          {processedListings.lowest && processedListings.highest && (
            <p className="text-xs text-muted-foreground mb-2">
              From {symbol}{processedListings.lowest} to {symbol}{processedListings.highest}/night · {processedListings.withLinks.length} listings found
            </p>
          )}

          {processedListings.shouldSplit && processedListings.midpoint ? (
            <>
              {/* Budget sub-group */}
              {(() => {
                const budgetItems = processedListings.withLinks.filter(p => (p.pricePerNight ?? 0) < processedListings.midpoint!);
                if (budgetItems.length === 0) return null;
                return (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Budget options (under {symbol}{processedListings.midpoint})
                    </p>
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        {budgetItems.slice(0, 3).map((prop, i) => (
                          <RentalPropertyRow key={i} prop={prop} symbol={symbol} />
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              <div className="border-t border-border/30 my-3" />

              {/* Premium sub-group */}
              {(() => {
                const premiumItems = processedListings.withLinks.filter(p => (p.pricePerNight ?? 0) >= processedListings.midpoint!);
                if (premiumItems.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Premium options ({symbol}{processedListings.midpoint}+)
                    </p>
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        {premiumItems.slice(0, 3).map((prop, i) => (
                          <RentalPropertyRow key={i} prop={prop} symbol={symbol} />
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                {processedListings.withLinks.slice(0, 6).map((prop, i) => (
                  <RentalPropertyRow key={i} prop={prop} symbol={symbol} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
};
