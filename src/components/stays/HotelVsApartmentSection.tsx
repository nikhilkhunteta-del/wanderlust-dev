import { HotelVsApartment } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Coins, Info } from "lucide-react";

interface HotelVsApartmentSectionProps {
  data: HotelVsApartment;
}

export const HotelVsApartmentSection = ({ data }: HotelVsApartmentSectionProps) => {
  const cards = [
    {
      icon: Users,
      title: "Best for apartments",
      description: data.bestForApartments,
    },
    {
      icon: Coins,
      title: "Price comparison",
      description: data.priceComparison,
    },
    {
      icon: Info,
      title: "What to know",
      description: data.whatToKnow,
    },
  ];

  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Hotel vs Apartment Stay
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-medium text-sm text-foreground">{card.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
