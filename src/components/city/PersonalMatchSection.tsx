import { Sparkles } from "lucide-react";

interface MatchReason {
  placeName: string;
  reason: string;
}

interface PersonalMatchSectionProps {
  city: string;
  reasons: (string | MatchReason)[];
}

function normalizeReason(r: string | MatchReason): MatchReason {
  if (typeof r === "object" && r.placeName && r.reason) return r;
  // Legacy string format: extract a short label from the sentence
  const text = (typeof r === "string" ? r : "").replace(/\*\*/g, "");
  // Try to find a proper noun / place name pattern
  const clauseMatch = text.match(/^(.*?)(?:\s[—–\-]\s|,\s|\.)/);
  const label = clauseMatch ? clauseMatch[1].trim() : text.split(" ").slice(0, 5).join(" ");
  return { placeName: label, reason: text };
}

function limitToTwoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return text;
  return sentences.slice(0, 2).join("").trim();
}

export const PersonalMatchSection = ({ city, reasons }: PersonalMatchSectionProps) => {
  if (!reasons || reasons.length === 0) return null;

  const cards = reasons.slice(0, 3).map(normalizeReason);

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-5 flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-primary" />
        Why {city} matches your travel style
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-card shadow-sm"
          >
            <p
              className="font-semibold text-foreground leading-tight mb-2"
              style={{ fontSize: 18 }}
            >
              {card.placeName}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {limitToTwoSentences(card.reason)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
