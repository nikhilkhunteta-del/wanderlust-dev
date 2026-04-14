import { Sparkles } from "lucide-react";

interface PersonalMatchSectionProps {
  city: string;
  reasons: string[];
}

const TAG_LABELS: Record<string, string> = {
  'culture-history': 'Culture & History',
  'nature-outdoors': 'Nature & Outdoors',
  'beach-coastal': 'Beach & Coastal',
  'food-culinary': 'Food & Culinary',
  'arts-music-nightlife': 'Arts, Music & Nightlife',
  'active-sport': 'Active & Sport',
  'shopping-markets': 'Shopping & Markets',
  'wellness-slow-travel': 'Wellness & Slow Travel',
};

function humanizeLabel(label: string): string {
  if (TAG_LABELS[label.toLowerCase()]) return TAG_LABELS[label.toLowerCase()];
  // Also handle labels that may already be partially readable
  const dashFixed = label.replace(/-/g, ' ');
  if (TAG_LABELS[dashFixed.toLowerCase()]) return TAG_LABELS[dashFixed.toLowerCase()];
  // Title case fallback
  return dashFixed.replace(/\b\w/g, c => c.toUpperCase());
}

function extractLabel(reason: string): { label: string; description: string } {
  const boldMatch = reason.match(/\*\*(.*?)\*\*/);
  if (boldMatch) {
    const rawLabel = boldMatch[1];
    const label = humanizeLabel(rawLabel);
    const description = reason.replace(/\*\*.*?\*\*\s*[-–:.]?\s*/, "").trim();
    return { label, description: description || reason.replace(/\*\*.*?\*\*/g, "").trim() };
  }
  const words = reason.split(" ");
  return {
    label: humanizeLabel(words.slice(0, 3).join(" ")),
    description: reason,
  };
}

function limitToTwoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return text;
  return sentences.slice(0, 2).join("").trim();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((reason, i) => {
          const { label, description } = extractLabel(reason);
          return (
            <div
              key={i}
              className="p-5 rounded-xl bg-card shadow-sm"
            >
              <p
                className="font-semibold text-foreground leading-tight mb-2"
                style={{ fontSize: 18 }}
              >
                {label}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {limitToTwoSentences(description)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
