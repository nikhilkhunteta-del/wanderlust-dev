import { ReactNode } from 'react';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  subtitle?: string;
  children: ReactNode;
}

export const QuestionCard = ({
  questionNumber,
  totalQuestions,
  questionText,
  subtitle,
  children,
}: QuestionCardProps) => {
  return (
    <div className="question-card animate-fade-in w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <span className="text-sm font-medium text-primary">
            Question {questionNumber} of {totalQuestions}
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            {questionText}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground font-body max-w-md mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
