import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { ProgressIndicator } from './ProgressIndicator';
import { QuestionCard } from './QuestionCard';
import { InterestGridQuestion } from './InterestGridQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { SingleSelectQuestion } from './SingleSelectQuestion';
import { MonthGridQuestion } from './MonthGridQuestion';
import { WhenAndHowLongQuestion } from './WhenAndHowLongQuestion';
import { TextInputQuestion } from './TextInputQuestion';
import { TransitionCard } from './TransitionCard';
import { CulturalMomentsQuestion } from './CulturalMomentsQuestion';
import { BucketListQuestion } from './BucketListQuestion';
import { TravelPreferences, buildDynamicQuestions } from '@/types/questionnaire';
import { culturalMoments as allCulturalMoments } from '@/data/culturalMoments';
import { bucketListActivities } from '@/data/bucketListActivities';
import { buildTravelProfile } from '@/lib/profileBuilder';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'travelquest_session';

const initialPreferences: TravelPreferences = {
  interests: [],
  primaryInterest: '',
  culturalMoments: [],
  adventureExperiences: [],
  foodDepth: '',
  departureCity: '',
  travelMonth: '',
  tripDuration: '',
  travelCompanions: '',
  noveltyPreference: '',
};

interface SavedSession {
  step: number;
  preferences: TravelPreferences;
  savedAt: number;
}

const loadSession = (): SavedSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SavedSession;
    // Expire after 24 hours
    if (Date.now() - session.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Only resume if they answered at least one question
    if (session.step === 0) return null;
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const saveSession = (step: number, preferences: TravelPreferences) => {
  const session: SavedSession = { step, preferences, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => localStorage.removeItem(STORAGE_KEY);

interface TravelQuestionnaireProps {
  savedPreferences?: Partial<TravelPreferences>;
  previousCities?: string[];
}

export const TravelQuestionnaire = ({ savedPreferences, previousCities }: TravelQuestionnaireProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | undefined>(undefined);
  const [showResumePrompt, setShowResumePrompt] = useState<SavedSession | null>(null);
  const [initialized, setInitialized] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();

  // Check for saved session on mount
  useEffect(() => {
    // If we received saved preferences from a returning user, pre-fill and skip to Q2
    if (savedPreferences) {
      const merged: TravelPreferences = {
        ...initialPreferences,
        interests: savedPreferences.interests || [],
        primaryInterest: savedPreferences.primaryInterest || '',
        travelCompanions: savedPreferences.travelCompanions || '',
        noveltyPreference: savedPreferences.noveltyPreference || '',
      };
      setPreferences(merged);
      // We need questions built from interests to find Q2 index
      const qs = buildDynamicQuestions(merged.interests);
      const q2Index = qs.findIndex(q => q.id === 'whenAndHowLong');
      setCurrentStep(q2Index >= 0 ? q2Index : 1);
      setInitialized(true);
      return;
    }

    const saved = loadSession();
    if (saved) {
      setShowResumePrompt(saved);
    } else {
      setInitialized(true);
    }
  }, []);

  const handleResume = () => {
    if (showResumePrompt) {
      setPreferences(showResumePrompt.preferences);
      setCurrentStep(showResumePrompt.step);
      setShowResumePrompt(null);
      setInitialized(true);
    }
  };

  const handleStartFresh = () => {
    clearSession();
    setShowResumePrompt(null);
    setInitialized(true);
  };

  // Save progress after each step change
  useEffect(() => {
    if (initialized) {
      saveSession(currentStep, preferences);
    }
  }, [currentStep, preferences, initialized]);

  const questions = useMemo(
    () => buildDynamicQuestions(preferences.interests),
    [preferences.interests]
  );

  // Used only to decide whether to show Q3 at all — step is skipped if no interests match
  const filteredMoments = useMemo(
    () => allCulturalMoments.filter((m) =>
      m.triggeredBy.some((t) => preferences.interests.includes(t))
    ),
    [preferences.interests]
  );

  // All moments, sorted so interest-matched ones appear first within each section
  const sortedMoments = useMemo(
    () => [...allCulturalMoments].sort((a, b) => {
      const aMatch = a.triggeredBy.some((t) => preferences.interests.includes(t)) ? 0 : 1;
      const bMatch = b.triggeredBy.some((t) => preferences.interests.includes(t)) ? 0 : 1;
      return aMatch - bMatch;
    }),
    [preferences.interests]
  );

  // If no cultural moments match, remove that question from the list
  const activeQuestions = useMemo(() => {
    if (filteredMoments.length === 0) {
      return questions.filter((q) => q.id !== 'culturalMoments');
    }
    return questions;
  }, [questions, filteredMoments]);

  const currentQuestion = activeQuestions[currentStep];
  const isLastStep = currentStep === activeQuestions.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const updatePreference = (value: string | string[] | number) => {
    setPreferences((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const canProceed = () => {
    // Cultural moments allows empty (user uses skip link instead)
    if (currentQuestion.id === 'culturalMoments') return true;
    // Combined month + duration step: both must be selected
    if (currentQuestion.id === 'whenAndHowLong') {
      return preferences.travelMonth !== '' && preferences.tripDuration !== '';
    }
    const value = preferences[currentQuestion.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value !== '';
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      const profile = buildTravelProfile(preferences);
      console.log('Travel Profile:', profile);
      clearSession();
      navigate('/results', { state: { profile, previousCities: previousCities || [] } });
      return;
    }

    // Show transition after Q1 (interests)
    if (currentStep === 0) {
      setTransitionMessage(undefined);
      setShowTransition(true);
      transitionTimer.current = setTimeout(() => {
        setShowTransition(false);
        setDirection(1);
        setCurrentStep((prev) => Math.min(prev + 1, activeQuestions.length - 1));
      }, 1500);
      return;
    }

    // Show transition after cultural moments if user selected one
    if (currentQuestion.id === 'culturalMoments' && preferences.culturalMoments.length > 0) {
      const selectedMoment = allCulturalMoments.find(
        (m) => m.value === preferences.culturalMoments[0]
      );
      if (selectedMoment) {
        const MONTH_LABELS: Record<string, string> = {
          jan: 'January', feb: 'February', mar: 'March', apr: 'April',
          may: 'May', jun: 'June', jul: 'July', aug: 'August',
          sep: 'September', oct: 'October', nov: 'November', dec: 'December',
          flexible: 'your chosen month',
        };
        const monthLabel = MONTH_LABELS[preferences.travelMonth] || preferences.travelMonth;
        setTransitionMessage(
          `You want to witness ${selectedMoment.label} in ${monthLabel}. We'll make sure one of your cities delivers that.`
        );
        setShowTransition(true);
        transitionTimer.current = setTimeout(() => {
          setShowTransition(false);
          setDirection(1);
          setCurrentStep((prev) => Math.min(prev + 1, activeQuestions.length - 1));
        }, 1500);
        return;
      }
    }

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, activeQuestions.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkipCulturalMoments = () => {
    setPreferences((prev) => ({ ...prev, culturalMoments: [] }));
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, activeQuestions.length - 1));
  };

  const handleSkipQ2 = () => {
    setPreferences((prev) => ({ ...prev, adventureExperiences: [] }));
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, activeQuestions.length - 1));
  };

  const renderQuestion = () => {
    const value = preferences[currentQuestion.id];

    // Combined month + duration step
    if (currentQuestion.id === 'whenAndHowLong') {
      const monthOptions = [
        { value: 'jan', label: 'January', icon: '❄️' },
        { value: 'feb', label: 'February', icon: '💕' },
        { value: 'mar', label: 'March', icon: '🌱' },
        { value: 'apr', label: 'April', icon: '🌸' },
        { value: 'may', label: 'May', icon: '☀️' },
        { value: 'jun', label: 'June', icon: '🌻' },
        { value: 'jul', label: 'July', icon: '🏖️' },
        { value: 'aug', label: 'August', icon: '🌅' },
        { value: 'sep', label: 'September', icon: '🍂' },
        { value: 'oct', label: 'October', icon: '🍁' },
        { value: 'nov', label: 'November', icon: '🌧️' },
        { value: 'dec', label: 'December', icon: '🎄' },
        { value: 'flexible', label: "I'm Flexible", icon: '✨' },
      ];
      const durationOptions = [
        { value: '3', label: 'Weekend', icon: '🌙', description: '2–3 days' },
        { value: '5', label: 'Short break', icon: '☀️', description: '4–5 days' },
        { value: '7', label: 'One week', icon: '✈️', description: '7 days' },
        { value: '14', label: 'Two weeks', icon: '🗺️', description: '14 days' },
        { value: '21', label: 'Extended trip', icon: '🌍', description: '21+ days' },
      ];
      return (
        <WhenAndHowLongQuestion
          monthOptions={monthOptions}
          durationOptions={durationOptions}
          selectedMonth={preferences.travelMonth}
          selectedDuration={preferences.tripDuration}
          onMonthChange={(m) => setPreferences(prev => ({ ...prev, travelMonth: m }))}
          onDurationChange={(d) => setPreferences(prev => ({ ...prev, tripDuration: d }))}
        />
      );
    }

    switch (currentQuestion.inputType) {
      case 'multi-select':
        if (currentQuestion.id === 'interests') {
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
        if (currentQuestion.id === 'culturalMoments') {
          return (
            <CulturalMomentsQuestion
              moments={sortedMoments}
              selected={value as string[]}
              travelMonth={preferences.travelMonth}
              onChange={updatePreference}
              onSkip={handleSkipCulturalMoments}
              onMonthChange={(m) => setPreferences(prev => ({ ...prev, travelMonth: m }))}
            />
          );
        }
        if (currentQuestion.id === 'adventureExperiences') {
          return (
            <BucketListQuestion
              activities={bucketListActivities}
              selected={value as string[]}
              onChange={updatePreference}
              onSkip={handleSkipQ2}
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
      case 'single-select': {
        const variant = (currentQuestion.id === 'travelCompanions' || currentQuestion.id === 'noveltyPreference')
          ? 'card-grid'
          : 'default';
        return (
          <SingleSelectQuestion
            options={currentQuestion.options!}
            selected={value as string}
            onChange={updatePreference}
            variant={variant}
          />
        );
      }
      case 'text-input':
        return (
          <TextInputQuestion
            value={value as string}
            onChange={updatePreference}
            placeholder={currentQuestion.placeholder}
            enableGeolocation={currentQuestion.id === 'departureCity'}
          />
        );
      default:
        return null;
    }
  };

  // For Q2 (adventureExperiences), allow proceeding even with empty selection
  const canProceedQ2 = currentQuestion?.id === 'adventureExperiences';

  // Resume prompt
  if (showResumePrompt) {
    return (
      <div className="min-h-screen flex flex-col gradient-warm">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 md:px-20 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6 max-w-md"
          >
            <Sparkles className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              You were partway through your travel questionnaire. Pick up where you left off?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleResume}
                className="gap-2 px-6 py-5 text-base gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25"
              >
                Continue where I left off
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleStartFresh}
                className="text-muted-foreground hover:text-foreground"
              >
                Start fresh
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!initialized) return null;

  if (showTransition) {
    return (
      <div className="min-h-screen flex flex-col gradient-warm">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 md:px-20 pb-8">
          <TransitionCard interests={preferences.interests} message={transitionMessage} />
        </main>
      </div>
    );
  }

  const isCulturalMomentsStep = currentQuestion?.id === 'culturalMoments';

  return (
    <div className="min-h-screen flex flex-col gradient-warm">
      <Header />

      <div className="px-6 md:px-12 pb-4">
        <ProgressIndicator currentStep={currentStep} totalSteps={activeQuestions.length} />
      </div>

      <main className={cn(
        'flex-1 flex flex-col justify-center px-6 md:px-12',
        isCulturalMomentsStep ? 'pb-24' : 'pb-8'
      )}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentStep}-${currentQuestion.id}`}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -12 : 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-none"
          >
            <QuestionCard
              questionNumber={currentStep + 1}
              totalQuestions={activeQuestions.length}
              questionText={currentQuestion.questionText}
              subtitle={currentQuestion.subtitle}
              footer={
                !isCulturalMomentsStep ? (
                  <div className="flex items-center gap-3 pt-2 w-full">
                    {!isFirstStep && (
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() && !canProceedQ2}
                      className={cn(
                        'flex-1 h-[52px] gap-3 text-lg transition-all',
                        (canProceed() || canProceedQ2)
                          ? 'gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isLastStep ? (
                        <>
                          Design my journey
                          <Sparkles className="w-5 h-5 animate-[shimmer_2s_ease-in-out_infinite]" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : undefined
              }
            >
              {renderQuestion()}
            </QuestionCard>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer for Q3 cultural moments */}
      {isCulturalMomentsStep && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-sm px-6 md:px-12 py-3">
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleSkipCulturalMoments}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/40 shrink-0"
            >
              None of these — just match my interests →
            </button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                'h-[52px] gap-3 text-lg px-8 transition-all',
                canProceed()
                  ? 'gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
