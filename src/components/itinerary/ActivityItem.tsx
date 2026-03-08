import { useState, useEffect, useCallback } from "react";
import { Activity } from "@/types/itinerary";
import {
  MapPin, Utensils, Camera, Mountain, Sparkles, ShoppingBag, Moon as MoonIcon,
  Star, Leaf, ExternalLink, RotateCcw, Lock, LockOpen, Loader2, X,
  Trees, Users, MessageSquare,
} from "lucide-react";
import { getYourGuideSearchUrl, shouldShowTourLink } from "@/lib/getYourGuideLinks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityItemProps {
  activity: Activity;
  city?: string;
  country?: string;
  dayTheme?: string;
  period?: string;
  travelMonth?: string;
  userInterests?: string[];
  isLocked?: boolean;
  onToggleLock?: () => void;
  onReplaceActivity?: (newActivity: Activity) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  culture: <Camera className="w-3.5 h-3.5" />,
  nature: <Mountain className="w-3.5 h-3.5" />,
  food: <Utensils className="w-3.5 h-3.5" />,
  adventure: <Sparkles className="w-3.5 h-3.5" />,
  relaxation: <Sparkles className="w-3.5 h-3.5" />,
  shopping: <ShoppingBag className="w-3.5 h-3.5" />,
  nightlife: <MoonIcon className="w-3.5 h-3.5" />,
};

const replaceModes = [
  { key: "similar" as const, label: "Similar vibe", icon: RotateCcw },
  { key: "less-walking" as const, label: "Less walking", icon: MapPin },
  { key: "family-friendly" as const, label: "Family-friendly", icon: Users },
  { key: "custom" as const, label: "Custom", icon: MessageSquare },
];

export const ActivityItem = ({
  activity,
  city,
  country,
  dayTheme,
  period,
  travelMonth,
  userInterests,
  isLocked,
  onToggleLock,
  onReplaceActivity,
}: ActivityItemProps) => {
  const icon = categoryIcons[activity.category] || <MapPin className="w-3.5 h-3.5" />;
  const showTourLink = city && shouldShowTourLink(activity.title);

  const [showReplacePanel, setShowReplacePanel] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [undoPrevious, setUndoPrevious] = useState<Activity | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup undo timer
  useEffect(() => {
    return () => { if (undoTimer) clearTimeout(undoTimer); };
  }, [undoTimer]);

  const handleReplace = useCallback(async (mode: "similar" | "less-walking" | "family-friendly" | "custom") => {
    if (!city || !onReplaceActivity) return;
    setIsReplacing(true);

    try {
      const { data, error } = await supabase.functions.invoke("replace-activity", {
        body: {
          city,
          country,
          travelMonth: travelMonth || "",
          userInterests: userInterests || [],
          currentActivity: {
            title: activity.title,
            description: activity.description,
            category: activity.category,
            time: activity.time,
            location: activity.location,
          },
          replacementMode: mode,
          customPrompt: mode === "custom" ? customInput : undefined,
          dayTheme: dayTheme || "",
          period: period || "",
        },
      });

      if (error) throw error;

      const previousActivity = { ...activity };
      onReplaceActivity(data as Activity);
      setShowReplacePanel(false);
      setCustomInput("");

      // Set undo state
      setUndoPrevious(previousActivity);
      const timer = setTimeout(() => setUndoPrevious(null), 30000);
      setUndoTimer(timer);

      toast.success("Activity replaced");
    } catch (err) {
      console.error("Replace failed:", err);
      toast.error("Couldn't replace activity. Try again.");
    } finally {
      setIsReplacing(false);
    }
  }, [activity, city, country, travelMonth, userInterests, dayTheme, period, customInput, onReplaceActivity]);

  const handleUndo = useCallback(() => {
    if (undoPrevious && onReplaceActivity) {
      onReplaceActivity(undoPrevious);
      setUndoPrevious(null);
      if (undoTimer) clearTimeout(undoTimer);
      toast.success("Reverted");
    }
  }, [undoPrevious, onReplaceActivity, undoTimer]);

  return (
    <div className={`relative py-2.5 group ${isLocked ? "border-l-[3px] border-l-primary pl-2 -ml-2" : ""}`}>
      <div className="flex gap-3">
        {/* Time */}
        <div className="flex-shrink-0 w-14 text-[11px] text-muted-foreground/60 font-medium pt-1.5">
          {activity.time}
        </div>

        {/* Icon dot */}
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted/50 border border-border/30 text-muted-foreground/60 group-hover:text-primary/70 group-hover:border-primary/20 flex items-center justify-center transition-colors">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm text-foreground leading-tight">
              {activity.title}
            </h4>
            {activity.isMustDo && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-semibold">
                <Star className="w-2.5 h-2.5 fill-primary" />
                Highlight
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">
            {activity.description}
          </p>

          {/* Personal Note */}
          {activity.personalNote && (
            <p className="mt-1 text-[13px] italic leading-relaxed" style={{ color: '#6B7280' }}>
              <span className="mr-1">✦</span>
              {activity.personalNote}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {activity.location && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <MapPin className="w-2 h-2" />
                {activity.location}
              </span>
            )}
            {activity.seasonalNote && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600/70 dark:text-amber-400/70">
                <Leaf className="w-2 h-2" />
                {activity.seasonalNote}
              </span>
            )}
            {showTourLink && (
              <a
                href={getYourGuideSearchUrl(activity.title, city!, country)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-primary transition-colors"
              >
                Check availability
                <ExternalLink className="w-2 h-2" />
              </a>
            )}
          </div>

          {/* Hover actions: Replace + Undo */}
          <div className="flex items-center gap-3 mt-1">
            {onReplaceActivity && !isLocked && (
              <button
                onClick={() => setShowReplacePanel(!showReplacePanel)}
                className="text-[11px] text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Replace this
              </button>
            )}
            {undoPrevious && (
              <button
                onClick={handleUndo}
                className="text-[11px] text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1 animate-fade-in"
              >
                Changed · Undo
              </button>
            )}
          </div>

          {/* Replace Panel — inline */}
          {showReplacePanel && (
            <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium">Replace with:</span>
                <button onClick={() => setShowReplacePanel(false)} className="text-muted-foreground/40 hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {replaceModes.filter(m => m.key !== "custom").map((m) => {
                  const MIcon = m.icon;
                  return (
                    <button
                      key={m.key}
                      onClick={() => handleReplace(m.key)}
                      disabled={isReplacing}
                      className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#F3F4F6' }}
                      onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = '#E5E7EB'); }}
                      onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = '#F3F4F6'); }}
                    >
                      {isReplacing ? <Loader2 className="w-3 h-3 animate-spin" /> : <MIcon className="w-3 h-3" />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Find me something..."
                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) handleReplace("custom");
                  }}
                />
                <button
                  onClick={() => handleReplace("custom")}
                  disabled={isReplacing || !customInput.trim()}
                  className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lock button — right aligned */}
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`flex-shrink-0 mt-1.5 transition-all ${
              isLocked
                ? "text-primary"
                : "text-muted-foreground/20 opacity-0 group-hover:opacity-100 hover:text-muted-foreground/60"
            }`}
            title={isLocked ? "Unlock activity" : "Lock activity (survives regeneration)"}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
