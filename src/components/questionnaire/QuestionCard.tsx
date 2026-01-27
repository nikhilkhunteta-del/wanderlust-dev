import { ReactNode } from 'react';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  children: ReactNode;
}

export const QuestionCard = ({
  questionNumber,
  totalQuestions,
  questionText,
  children,
}: QuestionCardProps) => {
  return (
    <div className="question-card animate-fade-in w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-sm font-medium text-primary">
            Question {questionNumber} of {totalQuestions}
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            {questionText}
          </h2>
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
