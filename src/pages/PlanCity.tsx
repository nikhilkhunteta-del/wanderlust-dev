import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Search } from "lucide-react";
import { TextInputQuestion } from "@/components/questionnaire/TextInputQuestion";
import { InterestGridQuestion } from "@/components/questionnaire/InterestGridQuestion";
import { MultiSelectQuestion } from "@/components/questionnaire/MultiSelectQuestion";
import { SingleSelectQuestion } from "@/components/questionnaire/SingleSelectQuestion";
import { MonthGridQuestion } from "@/components/questionnaire/MonthGridQuestion";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import { ProgressIndicator } from "@/components/questionnaire/ProgressIndicator";
import { TransitionCard } from "@/components/questionnaire/TransitionCard";
import { TravelPreferences, buildDynamicQuestions } from "@/types/questionnaire";
import { buildTravelProfile } from "@/lib/profileBuilder";
import { CityRecommendation } from "@/types/recommendations";
import { cn } from "@/lib/utils";

const initialPreferences: TravelPreferences = {
  interests: [],
  primaryInterest: '',
  culturalMoments: [],
  adventureExperiences: [],
  foodDepth: '',
  departureCity: "",
  travelMonth: "",
  tripDuration: '',
  travelCompanions: "",
  noveltyPreference: '',
};

const PlanCity = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phase, setPhase] = useState<"city-select" | "questionnaire">("city-select");
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);
  const [showTransition, setShowTransition] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();

  const allQuestions = useMemo(
    () => buildDynamicQuestions(preferences.interests),
    [preferences.interests]
  );

  const currentQuestion = allQuestions[currentStep];
  const isLastStep = currentStep === allQuestions.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const handleCitySelected = useCallback(() => {
    if (!city.trim()) return;
    const parts = city.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      setCity(parts[0]);
      setCountry(parts.slice(1).join(", "));
    }
    setPhase("questionnaire");
  }, [city]);

  const updatePreference = (value: string | string[] | number) => {
    setPreferences((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const canProceed = () => {
    const value = preferences[currentQuestion.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value !== "";
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      const profile = buildTravelProfile(preferences);

      const cityRec: CityRecommendation = {
        city: city,
        country: country || "Unknown",
        rationale: `You chose to explore ${city}. Here's everything you need to know.`,
        tags: profile.styleTags.slice(0, 5),
        imageQuery: `${city} ${country || ""} cityscape travel`,
      };

      navigate(`/city/${encodeURIComponent(city)}`, {
        state: { city: cityRec, profile },
      });
      return;
    }

    // Show transition after Q1 (interests)
    if (currentStep === 0) {
      setShowTransition(true);
      transitionTimer.current = setTimeout(() => {
        setShowTransition(false);
        setDirection(1);
        setCurrentStep((prev) => Math.min(prev + 1, allQuestions.length - 1));
      }, 1500);
      return;
    }

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, allQuestions.length - 1));
  };

  const handleBack = () => {
    if (isFirstStep) {
      setPhase("city-select");
    } else {
      setDirection(-1);
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const renderQuestion = () => {
    const value = preferences[currentQuestion.id];
    switch (currentQuestion.inputType) {
      case "multi-select":
        if (currentQuestion.id === "interests") {
          return (
            <InterestGridQuestion
              options={currentQuestion.options!}
              selected={value as string[]}
              onChange={updatePreference}
              primaryInterest={preferences.primaryInterest}
              onPrimaryChange={(val) => setPreferences(prev => ({ ...prev, primaryInterest: val }))}
            />
          );
        }
        return (
          <MultiSelectQuestion
            options={currentQuestion.options!}
            selected={value as string[]}
            onChange={updatePreference}
            grouped={currentQuestion.grouped}
          />
        );
      case "single-select":
        if (currentQuestion.id === "travelMonth") {
          return (
            <MonthGridQuestion
              options={currentQuestion.options!}
              selected={value as string}
              onChange={updatePreference}
            />
          );
        }
        return (
          <SingleSelectQuestion
            options={currentQuestion.options!}
            selected={value as string}
            onChange={updatePreference}
          />
        );
      case "text-input":
        return (
          <TextInputQuestion
            value={value as string}
            onChange={updatePreference}
            placeholder={currentQuestion.placeholder}
            enableGeolocation={currentQuestion.id === "departureCity"}
          />
        );
      default:
        return null;
    }
  };

  if (phase === "city-select") {
    return (
      <div className="min-h-screen flex flex-col gradient-warm">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg text-center"
          >
            <div className="mb-2">
              <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">
              Where are you headed?
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Enter a city and we'll build your complete travel guide.
            </p>

            <div className="mb-4">
              <TextInputQuestion
                value={city}
                onChange={setCity}
                placeholder="e.g., Tokyo, Paris, Marrakech..."
              />
            </div>

            <div className="mt-2 mb-6">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country (optional, helps accuracy)"
                className="w-full max-w-md mx-auto block rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 text-center text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>

            <Button
              onClick={handleCitySelected}
              disabled={!city.trim()}
              size="lg"
              className={cn(
                "gap-2 px-8 py-6 text-lg rounded-full transition-all",
                city.trim()
                  ? "gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Search className="w-5 h-5" />
              Continue
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="min-h-screen flex flex-col gradient-warm">
        <Header
          rightContent={
            <span className="text-sm text-muted-foreground">
              Planning: <span className="text-foreground font-medium">{city}</span>
            </span>
          }
        />
        <main className="flex-1 flex items-center justify-center px-4 pb-8">
          <TransitionCard interests={preferences.interests} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-warm">
      <Header
        rightContent={
          <span className="text-sm text-muted-foreground">
            Planning: <span className="text-foreground font-medium">{city}</span>
          </span>
        }
      />

      <div className="px-4 pb-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={allQuestions.length} />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentStep}-${currentQuestion.id}`}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -12 : 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <QuestionCard
              questionNumber={currentStep + 1}
              totalQuestions={allQuestions.length}
              questionText={currentQuestion.questionText}
              subtitle={currentQuestion.subtitle}
            >
              {renderQuestion()}
            </QuestionCard>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-6 px-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="page-container flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "gap-2 px-8 py-6 text-lg transition-all",
              canProceed()
                ? "gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLastStep ? (
              <>
                Build My Guide
                <Sparkles className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PlanCity;
