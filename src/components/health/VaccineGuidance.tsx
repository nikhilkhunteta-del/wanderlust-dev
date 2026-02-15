import { VaccineRecommendation } from "@/types/healthNotices";
import { Syringe } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VaccineGuidanceProps {
  vaccines: VaccineRecommendation[];
}

export const VaccineGuidance = ({ vaccines }: VaccineGuidanceProps) => {
  if (vaccines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Vaccine Recommendations</h3>
      <Accordion type="multiple" className="space-y-1">
        {vaccines.map((vaccine, index) => (
          <AccordionItem key={index} value={`vaccine-${index}`} className="border-border/50 rounded-lg bg-card/50 px-3">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline gap-2">
              <span className="flex items-center gap-2">
                <Syringe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {vaccine.vaccine}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pl-5.5 text-sm text-muted-foreground">
              {vaccine.recommendation}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-xs text-muted-foreground/70">
        Consult a travel health professional for personalized advice before your trip.
      </p>
    </div>
  );
};
