import { useState } from "react";
import { Download, Share2, Smartphone, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CityItinerary, ItineraryDay } from "@/types/itinerary";

interface ShareMenuProps {
  itinerary: CityItinerary;
  cityName: string;
  tripDuration: number;
}

function formatItineraryText(itinerary: CityItinerary, cityName: string, tripDuration: number): string {
  let text = `${tripDuration}-Day Itinerary for ${cityName}\n${"=".repeat(40)}\n\n`;

  for (const day of itinerary.days) {
    text += `Day ${day.dayNumber}: ${day.theme}\n`;
    if (day.neighbourhood) text += `📍 ${day.neighbourhood}`;
    if (day.neighbourhoodVibe) text += ` — ${day.neighbourhoodVibe}`;
    if (day.neighbourhood) text += `\n`;
    if (day.estimatedWalkingKm || day.estimatedTransitMinutes) {
      text += `🚶 ~${day.estimatedWalkingKm?.toFixed(1) || "?"} km walking · 🚌 ~${day.estimatedTransitMinutes || "?"} min transit\n`;
    }
    text += `${"-".repeat(30)}\n`;

    for (const slot of day.slots) {
      text += `\n  ${slot.period.toUpperCase()}\n`;
      for (const activity of slot.activities) {
        text += `    ${activity.time} — ${activity.title}\n`;
        text += `    ${activity.description}\n`;
        if (activity.location) text += `    📍 ${activity.location}\n`;
        if (activity.seasonalNote) text += `    🌸 ${activity.seasonalNote}\n`;
      }
    }
    text += `\n`;
  }

  if (itinerary.tips?.length) {
    text += `\nTips\n${"-".repeat(30)}\n`;
    itinerary.tips.forEach((tip) => (text += `• ${tip}\n`));
  }

  return text;
}

export const ShareMenu = ({ itinerary, cityName, tripDuration }: ShareMenuProps) => {
  const [copied, setCopied] = useState(false);

  const textContent = formatItineraryText(itinerary, cityName, tripDuration);

  const handleDownload = () => {
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cityName.toLowerCase().replace(/\s+/g, "-")}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripDuration}-Day ${cityName} Itinerary`,
          text: textContent,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shadow-sm">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="space-y-1">
          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Download itinerary
          </button>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          {typeof navigator.share === "function" && (
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              Send to device
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
