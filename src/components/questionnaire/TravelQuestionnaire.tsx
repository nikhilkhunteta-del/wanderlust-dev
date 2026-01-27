import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plane, Check } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { QuestionCard } from './QuestionCard';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { SingleSelectQuestion } from './SingleSelectQuestion';
import { SliderQuestion } from './SliderQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { TextInputQuestion } from './TextInputQuestion';
import { QUESTIONS, TravelPreferences } from '@/types/questionnaire';
import { cn } from '@/lib/utils';

const initialPreferences: TravelPreferences = {
  interests: [],
  adventureExperiences: [],
  departureCity: '',
  travelMonth: '',
  continentPreference: [],
  weatherPreference: 50,
  tripDuration: 7,
  travelCompanions: '',
  travelPace: 50,
};

export const TravelQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const isFirstStep = currentStep === 0;

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
      setIsComplete(true);
      console.log('Final Preferences:', preferences);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderQuestion = () => {
    const value = preferences[currentQuestion.id];

    switch (currentQuestion.inputType) {
      case 'multi-select':
        return (
          <MultiSelectQuestion
            options={currentQuestion.options!}
            selected={value as string[]}
            onChange={updatePreference}
          />
        );
      case 'single-select':
        return (
          <SingleSelectQuestion
            options={currentQuestion.options!}
            selected={value as string}
            onChange={updatePreference}
          />
        );
      case 'slider':
        return (
          <SliderQuestion
            config={currentQuestion.sliderConfig!}
            value={value as number}
            onChange={updatePreference}
          />
        );
      case 'dropdown':
        return (
          <DropdownQuestion
            options={currentQuestion.options!}
            value={value as string}
            onChange={updatePreference}
          />
        );
      case 'text-input':
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

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-warm">
        <div className="question-card text-center animate-scale-in max-w-lg">
          <div className="w-20 h-20 rounded-full gradient-sunset flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display font-semibold mb-4">
            You're All Set!
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            We're crafting personalized destination recommendations just for you.
          </p>
          <Button
            onClick={() => {
              setIsComplete(false);
              setCurrentStep(0);
              setPreferences(initialPreferences);
            }}
            className="gradient-sunset text-primary-foreground border-0 px-8 py-6 text-lg"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-warm">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Wanderlust</span>
          </div>
          <div className="text-sm text-muted-foreground">
            ~{Math.ceil((QUESTIONS.length - currentStep) * 9)} sec remaining
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pb-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={QUESTIONS.length} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <QuestionCard
          questionNumber={currentStep + 1}
          totalQuestions={QUESTIONS.length}
          questionText={currentQuestion.questionText}
        >
          {renderQuestion()}
        </QuestionCard>
      </main>

      {/* Navigation */}
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
            disabled={!canProceed()}
            className={cn(
              'gap-2 px-8 py-6 text-lg transition-all',
              canProceed()
                ? 'gradient-sunset text-primary-foreground border-0 shadow-lg shadow-primary/25'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isLastStep ? (
              <>
                Find My Destinations
                <Check className="w-5 h-5" />
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
