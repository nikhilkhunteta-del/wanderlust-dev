import { Sparkles } from "lucide-react";

interface PersonalMatchSectionProps {
  city: string;
  reasons: string[];
}

const EMOJI_MAP: Record<string, string> = {
  culture: "🏰", history: "🏰", heritage: "🏰",
  nature: "🌿", outdoors: "🌿", hiking: "🌿", park: "🌿",
  beach: "🏖️", coastal: "🏖️", sea: "🏖️", ocean: "🏖️",
  food: "🍜", culinary: "🍜", dining: "🍜", gastro: "🍜", cuisine: "🍜", eat: "🍜",
  art: "🎭", music: "🎭", nightlife: "🎭", theater: "🎭", gallery: "🎭",
  active: "🚴", sport: "🚴", adventure: "🚴", cycling: "🚴",
  shopping: "🛍️", market: "🛍️", bazaar: "🛍️",
  wellness: "🧘", slow: "🧘", spa: "🧘", relaxation: "🧘", retreat: "🧘",
  architecture: "🏛️", design: "🏛️", building: "🏛️",
  festival: "🎉", event: "🎉", celebration: "🎉",
  romance: "💕", couple: "💕", romantic: "💕",
  family: "👨‍👩‍👧", kid: "👨‍👩‍👧", child: "👨‍👩‍👧",
  photo: "📸", scenic: "📸", view: "📸", panoram: "📸",
};

function pickEmoji(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return "✨";
}

function extractLabel(reason: string): { label: string; description: string } {
  // Try to extract bold text as the label
  const boldMatch = reason.match(/\*\*(.*?)\*\*/);
  if (boldMatch) {
    const label = boldMatch[1];
    const description = reason.replace(/\*\*.*?\*\*\s*[-–:.]?\s*/, "").trim();
    return { label, description: description || reason.replace(/\*\*.*?\*\*/g, "").trim() };
  }
  // Fallback: use first few words as label
  const words = reason.split(" ");
  return {
    label: words.slice(0, 3).join(" "),
    description: reason,
  };
}

export const PersonalMatchSection = ({ city, reasons }: PersonalMatchSectionProps) => {
  if (!reasons || reasons.length === 0) return null;

  const cards = reasons.slice(0, 3);

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-5 flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-primary" />
        Why {city} matches your travel style
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((reason, i) => {
          const { label, description } = extractLabel(reason);
          const emoji = pickEmoji(reason);
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card"
            >
              <span className="text-2xl leading-none mt-0.5">{emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight mb-1">
                  {label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
