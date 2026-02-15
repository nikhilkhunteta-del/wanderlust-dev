import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "saved-experiences";

export interface SavedExperience {
  title: string;
  city: string;
  country: string;
  savedAt: string;
}

function readStore(): SavedExperience[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(items: SavedExperience[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeKey(city: string, title: string) {
  return `${city}::${title}`.toLowerCase();
}

export function useSavedExperiences(city: string, country: string) {
  const [saved, setSaved] = useState<SavedExperience[]>(readStore);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSaved(readStore());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isSaved = useCallback(
    (title: string) => saved.some((s) => makeKey(s.city, s.title) === makeKey(city, title)),
    [saved, city]
  );

  const toggle = useCallback(
    (title: string) => {
      setSaved((prev) => {
        const key = makeKey(city, title);
        const exists = prev.some((s) => makeKey(s.city, s.title) === key);
        const next = exists
          ? prev.filter((s) => makeKey(s.city, s.title) !== key)
          : [...prev, { title, city, country, savedAt: new Date().toISOString() }];
        writeStore(next);
        toast({
          description: exists ? "Removed from saved ideas." : "Saved to your trip ideas.",
        });
        return next;
      });
    },
    [city, country]
  );

  const savedForCity = saved.filter((s) => s.city.toLowerCase() === city.toLowerCase());

  return { isSaved, toggle, savedForCity, allSaved: saved };
}
