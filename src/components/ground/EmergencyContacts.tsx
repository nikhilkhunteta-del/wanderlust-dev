import { useState } from "react";
import { EmergencyContact } from "@/types/onTheGround";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  note: string | null;
  city: string;
}

const toTitleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const EmergencyContacts = ({ contacts, note, city }: EmergencyContactsProps) => {
  const [open, setOpen] = useState(false);

  const hasContent = note || (contacts && contacts.length > 0);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>Emergency contacts for {toTitleCase(city)}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-1 text-sm text-muted-foreground">
          {note && <p className="font-medium text-foreground">{note}</p>}
          {contacts && contacts.length > 0 && (
            <p>
              {contacts.map((c, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {c.service}: {c.number}
                </span>
              ))}
            </p>
          )}
          {!hasContent && (
            <p className="text-muted-foreground">Check local emergency numbers before travel</p>
          )}
        </div>
      )}
    </div>
  );
};
