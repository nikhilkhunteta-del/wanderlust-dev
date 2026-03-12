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
import { TextInputQuestion } from './TextInputQuestion';
import { TransitionCard } from './TransitionCard';
import { TravelPreferences, buildDynamicQuestions } from '@/types/questionnaire';
import { buildTravelProfile } from '@/lib/profileBuilder';
import { cn } from '@/lib/utils';

const initialPreferences: TravelPreferences = {
  interests: [],
  primaryInterest: '',
  adventureExperiences: [],
  foodDepth: '',
  departureCity: '',
  travelMonth: '',
  tripDuration: '',
  travelCompanions: '',
  noveltyPreference: '',
};

export const TravelQuestionnaire = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);
  const [showTransition, setShowTransition] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();

  const questions = useMemo(
    () => buildDynamicQuestions(preferences.interests),
    [preferences.interests]
  );

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
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
    const value = preferences[currentQuestion.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value !== '';
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      const profile = buildTravelProfile(preferences);
      console.log('Travel Profile:', profile);
      navigate('/results', { state: { profile } });
      return;
    }

    // Show transition after Q1 (interests)
    if (currentStep === 0) {
      setShowTransition(true);
      transitionTimer.current = setTimeout(() => {
        setShowTransition(false);
        setDirection(1);
        setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
      }, 1500);
      return;
    }

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkipQ2 = () => {
    // Skip Q2, clear adventure experiences, advance
    setPreferences((prev) => ({ ...prev, adventureExperiences: [] }));
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const renderQuestion = () => {
    const value = preferences[currentQuestion.id];

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
        return (
          <MultiSelectQuestion
            options={currentQuestion.options!}
            selected={value as string[]}
            onChange={updatePreference}
            grouped={currentQuestion.grouped}
            onSkip={currentQuestion.id === 'adventureExperiences' ? handleSkipQ2 : undefined}
          />
        );
      case 'single-select':
        if (currentQuestion.id === 'travelMonth') {
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

  if (showTransition) {
    return (
      <div className="min-h-screen flex flex-col gradient-warm">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 pb-8">
          <TransitionCard interests={preferences.interests} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-warm">
      <Header />

      <div className="px-4 pb-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={questions.length} />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentStep}-${currentQuestion.id}`}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -12 : 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <QuestionCard
              questionNumber={currentStep + 1}
              totalQuestions={questions.length}
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
            disabled={isFirstStep}
            className={cn(
              'gap-2 text-muted-foreground hover:text-foreground',
              isFirstStep && 'invisible'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() && !canProceedQ2}
            className={cn(
              'gap-2 px-8 py-6 text-lg transition-all',
              (canProceed() || canProceedQ2)
                ? 'gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isLastStep ? (
              <>
                Design my journey
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
