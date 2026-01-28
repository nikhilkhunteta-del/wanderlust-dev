import { Shield } from "lucide-react";

interface TravelInsuranceNoteProps {
  note: string;
}

export const TravelInsuranceNote = ({ note }: TravelInsuranceNoteProps) => {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">Travel Insurance</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>
        </div>
      </div>
    </div>
  );
};
