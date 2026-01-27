import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane } from "lucide-react";

interface CityHeaderProps {
  city: string;
  country: string;
}

export const CityHeader = ({ city, country }: CityHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="py-4 px-4 border-b border-border/30 bg-card/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full gradient-sunset flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Wanderlust</span>
          </button>
        </div>
        <div className="text-sm text-muted-foreground hidden sm:block">
          {city}, {country}
        </div>
      </div>
    </header>
  );
};
