import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsErrorProps {
  message: string;
  onRetry: () => void;
}

export const ResultsError = ({ message, onRetry }: ResultsErrorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-warm p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-display font-semibold mb-2">
          Something Went Wrong
        </h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={onRetry} className="gradient-sunset text-primary-foreground border-0">
          Try Again
        </Button>
      </div>
    </div>
  );
};
