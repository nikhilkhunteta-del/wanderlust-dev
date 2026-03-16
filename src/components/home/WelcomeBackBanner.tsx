import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TravelPreferences } from "@/types/questionnaire";

interface SavedProfileData {
  interestScores?: Record<string, number>;
  primaryInterest?: string;
  travelCompanions?: string;
  noveltyPreference?: string;
  previousCities?: string[];
}

export const WelcomeBackBanner = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<SavedProfileData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("travelquest_email");
    if (!email) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("saved_travel_profiles" as any)
          .select("profile_json, previous_cities")
          .eq("email", email)
          .maybeSingle();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setProfileData((data as any).profile_json as SavedProfileData);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUseProfile = () => {
    if (!profileData) return;

    // Map interestScores back to interests array
    const interests = profileData.interestScores
      ? Object.entries(profileData.interestScores)
          .filter(([, score]) => score > 0)
          .map(([key]) => key)
      : [];

    const savedPreferences: Partial<TravelPreferences> = {
      interests,
      primaryInterest: profileData.primaryInterest || "",
      travelCompanions: profileData.travelCompanions || "",
      noveltyPreference: profileData.noveltyPreference || "",
    };

    navigate("/questionnaire", { state: { savedPreferences } });
  };

  const handleStartFresh = () => {
    setDismissed(true);
    navigate("/questionnaire");
  };

  if (loading || !profileData || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg"
      >
        <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl p-5 text-center shadow-2xl">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Welcome back</h3>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Your travel profile is loaded. Start fresh or use your saved preferences?
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={handleUseProfile}
              size="sm"
              className="gradient-sunset text-white border-0 rounded-full gap-1.5 shadow-lg shadow-primary/25"
            >
              Use my profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleStartFresh}
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              Start fresh
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
