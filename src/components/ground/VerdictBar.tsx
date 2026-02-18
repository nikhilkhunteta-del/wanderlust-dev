import { OnTheGroundData } from "@/types/onTheGround";

interface VerdictBarProps {
  verdict: string;
  level: "green" | "amber" | "red";
}

const borderColors: Record<string, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
};

export const VerdictBar = ({ verdict, level }: VerdictBarProps) => {
  return (
    <div className={`border-l-4 ${borderColors[level]} pl-5 py-4`}>
      <p className="text-lg font-medium text-foreground leading-relaxed">{verdict}</p>
    </div>
  );
};
