import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatusBannerProps {
  hasDisruptions: boolean;
  statusSummary: string;
}

export const StatusBanner = ({ hasDisruptions, statusSummary }: StatusBannerProps) => {
  return (
    <div
      className={`rounded-xl p-6 ${
        hasDisruptions
          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
          : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            hasDisruptions
              ? "bg-amber-100 dark:bg-amber-900/50"
              : "bg-emerald-100 dark:bg-emerald-900/50"
          }`}
        >
          {hasDisruptions ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div>
          <h3
            className={`font-semibold text-lg ${
              hasDisruptions
                ? "text-amber-800 dark:text-amber-200"
                : "text-emerald-800 dark:text-emerald-200"
            }`}
          >
            {hasDisruptions ? "Potential disruptions to be aware of" : "No significant disruptions expected"}
          </h3>
          <p
            className={`mt-1 ${
              hasDisruptions
                ? "text-amber-700 dark:text-amber-300"
                : "text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {statusSummary}
          </p>
        </div>
      </div>
    </div>
  );
};
