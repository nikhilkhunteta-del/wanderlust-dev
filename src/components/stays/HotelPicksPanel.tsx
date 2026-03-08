import { PriceCategory, TopProperty } from "@/types/stayInsights";
import { ExternalLink, X } from "lucide-react";
import { getCurrencySymbol } from "./PriceCategoryCard";
import { motion, AnimatePresence } from "framer-motion";

interface HotelPicksPanelProps {
  category: PriceCategory | null;
  city: string;
  onClose: () => void;
}

function PropertyRow({ prop, symbol }: { prop: TopProperty; symbol: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-b-0 transition-colors hover:bg-[#FFF7ED]">
      {/* Thumbnail */}
      {prop.thumbnail && (
        <img
          src={prop.thumbnail}
          alt={prop.name}
          className="w-[60px] h-[60px] rounded-md object-cover flex-shrink-0"
          loading="lazy"
        />
      )}

      {/* Middle: name, rating, amenities */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{prop.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {prop.rating && <span>{prop.rating}★</span>}
          {prop.reviewCount && <span> ({prop.reviewCount.toLocaleString()} reviews)</span>}
        </p>
        {prop.amenities && prop.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {prop.amenities.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0 rounded text-[10px] bg-muted text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: price + link */}
      <div className="flex-shrink-0 text-right">
        {prop.pricePerNight && (
          <p className="text-sm font-bold text-foreground">
            {symbol}{prop.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/night</span>
          </p>
        )}
        {prop.link && (
          <a
            href={prop.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#EA580C] hover:underline mt-1"
          >
            View on Google Hotels <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

/* Mobile variant: thumbnail above text */
function PropertyRowMobile({ prop, symbol }: { prop: TopProperty; symbol: string }) {
  return (
    <div className="py-3 border-b border-border/30 last:border-b-0 transition-colors hover:bg-[#FFF7ED]">
      {prop.thumbnail && (
        <img
          src={prop.thumbnail}
          alt={prop.name}
          className="w-full h-32 rounded-md object-cover mb-2"
          loading="lazy"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{prop.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prop.rating && <span>{prop.rating}★</span>}
            {prop.reviewCount && <span> ({prop.reviewCount.toLocaleString()} reviews)</span>}
          </p>
          {prop.amenities && prop.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {prop.amenities.slice(0, 3).map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-1.5 py-0 rounded text-[10px] bg-muted text-muted-foreground"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {prop.pricePerNight && (
            <p className="text-sm font-bold text-foreground">
              {symbol}{prop.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/night</span>
            </p>
          )}
        </div>
      </div>
      {prop.link && (
        <a
          href={prop.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#EA580C] hover:underline mt-2"
        >
          View on Google Hotels <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}

export const HotelPicksPanel = ({ category, city, onClose }: HotelPicksPanelProps) => {
  if (!category) return null;

  const picks = (category.topProperties || []).slice(0, 3);
  const symbol = getCurrencySymbol(category.currency);

  return (
    <AnimatePresence mode="wait">
      {picks.length > 0 && (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-card border border-border/50 rounded-lg p-4 md:p-5">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                {category.label} picks in {city}{" "}
                <span className="font-normal text-muted-foreground">· {picks.length} properties found</span>
              </h4>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" /> Close
              </button>
            </div>

            {/* Desktop rows */}
            <div className="hidden sm:block">
              {picks.map((prop, i) => (
                <PropertyRow key={i} prop={prop} symbol={symbol} />
              ))}
            </div>

            {/* Mobile rows */}
            <div className="sm:hidden">
              {picks.map((prop, i) => (
                <PropertyRowMobile key={i} prop={prop} symbol={symbol} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
