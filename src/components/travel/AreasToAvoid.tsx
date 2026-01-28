import { MapPinOff, CheckCircle } from "lucide-react";

interface AreasToAvoidProps {
  areas: string[];
}

export const AreasToAvoid = ({ areas }: AreasToAvoidProps) => {
  const hasAreas = areas.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Areas to Avoid</h3>
      {hasAreas ? (
        <ul className="space-y-2">
          {areas.map((area, index) => (
            <li
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
            >
              <MapPinOff className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-sm">{area}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-muted-foreground">
            No specific areas are currently flagged for travelers to avoid.
          </span>
        </div>
      )}
    </div>
  );
};
