import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ItineraryDay } from "@/types/itinerary";

interface ItineraryMapProps {
  days: ItineraryDay[];
  selectedDay: number | null;
}

const dayColors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

function createDayIcon(dayNumber: number) {
  const color = dayColors[(dayNumber - 1) % dayColors.length];
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${dayNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export const ItineraryMap = ({ days, selectedDay }: ItineraryMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const allMarkers = useMemo(() => {
    const markers: { lat: number; lng: number; title: string; dayNumber: number; time: string }[] = [];
    const filteredDays = selectedDay ? days.filter((d) => d.dayNumber === selectedDay) : days;

    for (const day of filteredDays) {
      if (!Array.isArray(day.slots)) continue;
      for (const slot of day.slots) {
        for (const activity of slot.activities) {
          if (activity.lat && activity.lng) {
            markers.push({
              lat: activity.lat,
              lng: activity.lng,
              title: activity.title,
              dayNumber: day.dayNumber,
              time: activity.time,
            });
          }
        }
      }
    }
    return markers;
  }, [days, selectedDay]);

  useEffect(() => {
    if (!containerRef.current || allMarkers.length === 0) return;

    // Create map if not exists
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // Add markers
    for (const m of allMarkers) {
      L.marker([m.lat, m.lng], { icon: createDayIcon(m.dayNumber) })
        .addTo(map)
        .bindPopup(`<div style="font-size:13px"><div style="font-weight:600">Day ${m.dayNumber} · ${m.time}</div><div>${m.title}</div></div>`);
    }

    // Fit bounds
    const bounds = L.latLngBounds(allMarkers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [allMarkers]);

  // Cleanup
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (allMarkers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-border/50 text-sm text-muted-foreground">
        Map data unavailable for this itinerary
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-border/50 shadow-sm"
      style={{ height: 400 }}
    />
  );
};
