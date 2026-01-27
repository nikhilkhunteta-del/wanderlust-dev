import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TemperatureUnit = "celsius" | "fahrenheit";

interface TemperatureToggleProps {
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
}

export const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9) / 5 + 32);
};

export const formatTemp = (celsius: number, unit: TemperatureUnit): string => {
  if (unit === "fahrenheit") {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${celsius}°C`;
};

export const formatTempValue = (celsius: number, unit: TemperatureUnit): number => {
  if (unit === "fahrenheit") {
    return celsiusToFahrenheit(celsius);
  }
  return celsius;
};

export const TemperatureToggle = ({ unit, onUnitChange }: TemperatureToggleProps) => {
  return (
    <ToggleGroup
      type="single"
      value={unit}
      onValueChange={(value) => value && onUnitChange(value as TemperatureUnit)}
      className="bg-muted/50 rounded-lg p-1"
    >
      <ToggleGroupItem
        value="celsius"
        aria-label="Celsius"
        className="px-3 py-1.5 text-sm font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
      >
        °C
      </ToggleGroupItem>
      <ToggleGroupItem
        value="fahrenheit"
        aria-label="Fahrenheit"
        className="px-3 py-1.5 text-sm font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
      >
        °F
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
