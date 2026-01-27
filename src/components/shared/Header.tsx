import { useNavigate, useLocation } from "react-router-dom";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  rightContent?: React.ReactNode;
  variant?: "default" | "transparent";
}

export const Header = ({ rightContent, variant = "default" }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <header
      className={cn(
        "py-4 px-4 sticky top-0 z-20 transition-colors",
        variant === "default" &&
          "border-b border-border/30 bg-card/80 backdrop-blur-md",
        variant === "transparent" && "bg-transparent absolute w-full"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex items-center gap-2 hover:opacity-80 transition-opacity",
            isHome && "pointer-events-none"
          )}
        >
          <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Wanderlust</span>
        </button>

        {rightContent && (
          <div className="text-sm text-muted-foreground">{rightContent}</div>
        )}
      </div>
    </header>
  );
};
