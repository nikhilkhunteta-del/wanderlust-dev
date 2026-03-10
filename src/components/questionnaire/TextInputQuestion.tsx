import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { searchCities } from '@/data/cities';
import { cn } from '@/lib/utils';

interface TextInputQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enableGeolocation?: boolean;
}

export const TextInputQuestion = ({
  value,
  onChange,
  placeholder = 'Enter your city...',
  enableGeolocation = false,
}: TextInputQuestionProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [geoAttempted, setGeoAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Geolocation pre-population
  useEffect(() => {
    if (!enableGeolocation || geoAttempted || value) return;
    setGeoAttempted(true);

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality;
          if (city) {
            setDetectedCity(city);
            onChange(city);
          }
        } catch {
          // silently fail
        }
      },
      () => {
        // permission denied or error — do nothing
      },
      { timeout: 5000 }
    );
  }, [enableGeolocation, geoAttempted, value, onChange]);

  useEffect(() => {
    const results = searchCities(value);
    setSuggestions(results);
    setHighlightedIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    if (detectedCity) setDetectedCity(null);
  };

  const handleSelectCity = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setDetectedCity(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectCity(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-12 py-6 text-lg rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm focus:border-primary/50 transition-colors"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20"
          >
            {suggestions.map((city, index) => (
              <button
                key={city}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCity(city);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                  highlightedIndex === index
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted/50'
                )}
              >
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {detectedCity && value === detectedCity ? (
        <p className="text-[11px] text-muted-foreground/70 mt-3 text-center">
          Detected: {detectedCity} · Travelling from somewhere else? Update above
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Start typing to see suggestions, or enter any city
        </p>
      )}
    </div>
  );
};
