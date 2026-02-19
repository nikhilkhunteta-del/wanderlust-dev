interface PackingSuggestionsSectionProps {
  suggestions: string[];
}

export const PackingSuggestionsSection = ({ suggestions }: PackingSuggestionsSectionProps) => {
  // If no destination-specific items, show fallback line
  if (!suggestions || suggestions.length === 0) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">
          No specialist health kit required for this destination — standard travel preparation applies.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Packing Suggestions</h3>
      <div className="space-y-2">
        {suggestions.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
};
