import { HealthVaccine } from "@/types/healthData";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VaccineSectionProps {
  vaccines: HealthVaccine[];
}

const levelStyles: Record<string, string> = {
  Routine: "bg-muted text-muted-foreground",
  Recommended: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Required: "bg-destructive/10 text-destructive",
};

export const VaccineSection = ({ vaccines }: VaccineSectionProps) => {
  if (!vaccines || vaccines.length === 0) return null;

  // Group routine vaccines together
  const routineVaccines = vaccines.filter((v) => v.recommendation_level === "Routine");
  const nonRoutineVaccines = vaccines.filter((v) => v.recommendation_level !== "Routine");

  const showGroupedRoutine = routineVaccines.length > 0 && nonRoutineVaccines.length === 0
    ? true // All routine — group them
    : routineVaccines.length > 1; // Mix — group routine if multiple

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Vaccinations</h3>
      <Accordion type="multiple" className="space-y-1">
        {/* Non-routine vaccines listed individually */}
        {nonRoutineVaccines.map((vaccine, index) => (
          <AccordionItem
            key={`nr-${index}`}
            value={`vaccine-${index}`}
            className="border-border/50 rounded-lg bg-card/50 px-3"
          >
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline gap-2">
              <span className="flex items-center gap-2 flex-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform" />
                <span className="flex-1 text-left">{vaccine.name}</span>
                <Badge className={`text-xs ${levelStyles[vaccine.recommendation_level] || levelStyles.Routine}`}>
                  {vaccine.recommendation_level}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pl-6 text-sm text-muted-foreground">
              {vaccine.reason}
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Grouped routine vaccines */}
        {showGroupedRoutine && routineVaccines.length > 0 && (
          <AccordionItem
            value="routine-group"
            className="border-border/50 rounded-lg bg-card/50 px-3"
          >
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline gap-2">
              <span className="flex items-center gap-2 flex-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform" />
                <span className="flex-1 text-left">Routine vaccinations — ensure these are current</span>
                <Badge className={`text-xs ${levelStyles.Routine}`}>Routine</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pl-6 text-sm text-muted-foreground space-y-1">
              {routineVaccines.map((v, i) => (
                <div key={i}>
                  <span className="font-medium">{v.name}</span>
                  {v.reason && <span> — {v.reason}</span>}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* If only one routine vaccine and there are also non-routine, show it individually */}
        {!showGroupedRoutine && routineVaccines.length === 1 && (
          <AccordionItem
            value="routine-single"
            className="border-border/50 rounded-lg bg-card/50 px-3"
          >
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline gap-2">
              <span className="flex items-center gap-2 flex-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform" />
                <span className="flex-1 text-left">{routineVaccines[0].name}</span>
                <Badge className={`text-xs ${levelStyles.Routine}`}>Routine</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pl-6 text-sm text-muted-foreground">
              {routineVaccines[0].reason}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      <p className="text-xs text-muted-foreground/70">
        Consult a travel health professional for personalised advice before your trip.
      </p>
    </section>
  );
};
