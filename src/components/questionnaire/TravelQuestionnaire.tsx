import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { ProgressIndicator } from './ProgressIndicator';
import { QuestionCard } from './QuestionCard';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { SingleSelectQuestion } from './SingleSelectQuestion';
import { SliderQuestion } from './SliderQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { TextInputQuestion } from './TextInputQuestion';
import { QUESTIONS, TravelPreferences } from '@/types/questionnaire';
import { buildTravelProfile } from '@/lib/profileBuilder';
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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);

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
      const profile = buildTravelProfile(preferences);
      console.log('Travel Profile:', profile);
      // Navigate to results page with the profile
      navigate('/results', { state: { profile } });
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
  return (
    <div className="min-h-screen flex flex-col gradient-warm">
      {/* Header */}
      <Header
        rightContent={
          <span>~{Math.ceil((QUESTIONS.length - currentStep) * 9)} sec remaining</span>
        }
      />

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
