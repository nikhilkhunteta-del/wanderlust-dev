import { useQuery } from "@tanstack/react-query";
import { getStreetSentiment, SentimentCategory } from "@/lib/streetSentiment";
import { Utensils, Hotel, Users, Shield, Sparkles, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_CONFIG: Record<string, { icon: typeof Utensils; gradient: string }> = {
  "Food scene": { icon: Utensils, gradient: "from-orange-500/10 to-orange-600/5" },
  "Accommodation value": { icon: Hotel, gradient: "from-indigo-500/10 to-indigo-600/5" },
  "Crowds & timing": { icon: Users, gradient: "from-cyan-500/10 to-cyan-600/5" },
  "Safety": { icon: Shield, gradient: "from-emerald-500/10 to-emerald-600/5" },
  "Overall vibe right now": { icon: Sparkles, gradient: "from-violet-500/10 to-violet-600/5" },
};

const SENTIMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  positive: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Positive" },
  mixed: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", label: "Mixed" },
  negative: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Negative" },
};

function SentimentCard({ category }: { category: SentimentCategory }) {
  const config = CATEGORY_CONFIG[category.name] || { icon: MessageCircle, gradient: "from-muted/50 to-muted/30" };
  const sentiment = SENTIMENT_STYLES[category.sentiment] || SENTIMENT_STYLES.mixed;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border border-border/50 bg-gradient-to-br ${config.gradient} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-foreground/70" />
          <h3 className="font-semibold text-sm text-foreground">{category.name}</h3>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sentiment.bg} ${sentiment.text}`}>
          {sentiment.label}
        </span>
      </div>
      <p className="text-sm text-foreground/75 leading-relaxed">{category.verdict}</p>
    </div>
  );
}

interface WordOnStreetTabProps {
  city: string;
  country: string;
}

export function WordOnStreetTab({ city, country }: WordOnStreetTabProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["street-sentiment", city, country],
    queryFn: () => getStreetSentiment(city, country),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <div className="page-container py-8 md:py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Word on the Street</h1>
        <p className="text-foreground/60 text-sm">
          What real travellers are saying about {city} right now — sourced from Reddit, forums, and recent reviews.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Couldn't load traveller sentiment right now. Try again later.</p>
        </div>
      )}

      {data?.categories && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((cat) => (
            <SentimentCard key={cat.name} category={cat} />
          ))}
        </div>
      )}

      {data?.sourcesSummary && (
        <p className="text-xs text-muted-foreground italic">{data.sourcesSummary}</p>
      )}
    </div>
  );
}
