import { CloudSun } from "lucide-react";

interface WeatherVerdictProps {
  verdict: string;
  month: string;
  city: string;
}

export const WeatherVerdict = ({ verdict, month, city }: WeatherVerdictProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/20 p-6 md:p-8">
      <div className="absolute top-4 right-4 opacity-20">
        <CloudSun className="w-24 h-24 text-sky-500" />
      </div>
      <div className="relative">
        <h2 className="text-lg font-medium text-muted-foreground mb-2">
          Weather in {month}
        </h2>
        <p className="text-xl md:text-2xl font-display font-semibold text-foreground leading-relaxed max-w-3xl">
          {verdict}
        </p>
      </div>
    </div>
  );
};
