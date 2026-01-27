import { Loader2 } from "lucide-react";

export const ResultsLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-warm">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full gradient-sunset flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
        </div>
        <h2 className="text-2xl font-display font-semibold mb-2">
          Finding Your Perfect Destinations
        </h2>
        <p className="text-muted-foreground">
          Analyzing thousands of cities to match your travel style...
        </p>
      </div>
    </div>
  );
};
