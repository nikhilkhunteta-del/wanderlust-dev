import { Check } from "lucide-react";

interface HealthPackingListProps {
  items: string[];
}

export const HealthPackingList = ({ items }: HealthPackingListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Healthy Travel Packing List</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
          >
            <div className="p-1 rounded bg-primary/10">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
