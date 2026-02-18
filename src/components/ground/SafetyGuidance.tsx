import { SafetyCluster } from "@/types/onTheGround";

interface SafetyGuidanceProps {
  clusters: SafetyCluster[];
}

export const SafetyGuidance = ({ clusters }: SafetyGuidanceProps) => {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {clusters.map((cluster, i) => (
        <div key={i}>
          <h4 className="text-sm font-semibold text-foreground mb-3">{cluster.header}</h4>
          <ul className="space-y-2">
            {cluster.points.map((point, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-2 w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
