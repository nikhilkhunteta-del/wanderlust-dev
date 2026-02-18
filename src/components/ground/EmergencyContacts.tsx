import { useState } from "react";
import { EmergencyContact } from "@/types/onTheGround";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  note: string | null;
  city: string;
}

export const EmergencyContacts = ({ contacts, note, city }: EmergencyContactsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>Emergency contacts for {city}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-1 text-sm text-muted-foreground">
          {note && <p className="font-medium text-foreground">{note}</p>}
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-2">
              <span>{c.service}:</span>
              <span className="font-mono">{c.number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
