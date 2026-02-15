import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Search } from "lucide-react";
import { TextInputQuestion } from "@/components/questionnaire/TextInputQuestion";
import { MultiSelectQuestion } from "@/components/questionnaire/MultiSelectQuestion";
import { SingleSelectQuestion } from "@/components/questionnaire/SingleSelectQuestion";
import { SliderQuestion } from "@/components/questionnaire/SliderQuestion";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import { ProgressIndicator } from "@/components/questionnaire/ProgressIndicator";
import { QUESTIONS, TravelPreferences, QuestionConfig } from "@/types/questionnaire";
import { buildTravelProfile } from "@/lib/profileBuilder";
import { CityRecommendation } from "@/types/recommendations";
import { cn } from "@/lib/utils";

const PLAN_QUESTIONS: QuestionConfig[] = QUESTIONS.filter(
  (q) => q.id !== "continentPreference"
);

const initialPreferences: TravelPreferences = {
  interests: [],
  adventureExperiences: [],
  departureCity: "",
  travelMonth: "",
  continentPreference: ["anywhere"],
  weatherPreference: 50,
  tripDuration: 7,
  travelCompanions: "",
  travelPace: 50,
};

const PlanCity = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phase, setPhase] = useState<"city-select" | "questionnaire">("city-select");
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);

  const currentQuestion = PLAN_QUESTIONS[currentStep];
  const isLastStep = currentStep === PLAN_QUESTIONS.length - 1;
  const isFirstStep = currentStep === 0;

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
      const fullPrefs: TravelPreferences = {
        ...preferences,
        continentPreference: ["anywhere"],
      };
      const profile = buildTravelProfile(fullPrefs);

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
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      setPhase("city-select");
    } else {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderQuestion = () => {
    const value = preferences[currentQuestion.id];
    switch (currentQuestion.inputType) {
      case "multi-select":
        return (
          <MultiSelectQuestion
            options={currentQuestion.options!}
            selected={value as string[]}
            onChange={updatePreference}
            grouped={currentQuestion.grouped}
          />
        );
      case "single-select":
        return (
          <SingleSelectQuestion
            options={currentQuestion.options!}
            selected={value as string}
            onChange={updatePreference}
          />
        );
      case "slider":
        return (
          <SliderQuestion
            config={currentQuestion.sliderConfig!}
            value={value as number}
            onChange={updatePreference}
          />
        );
      case "text-input":
        return (
          <TextInputQuestion
            value={value as string}
            onChange={updatePreference}
            placeholder={currentQuestion.placeholder}
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
        <ProgressIndicator currentStep={currentStep} totalSteps={PLAN_QUESTIONS.length} />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -12 : 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <QuestionCard
              questionNumber={currentStep + 1}
              totalQuestions={PLAN_QUESTIONS.length}
              questionText={currentQuestion.questionText}
              subtitle={currentQuestion.subtitle}
            >
              {renderQuestion()}
            </QuestionCard>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-6 px-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
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
