import { useEffect, useRef, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ItineraryDay } from "@/types/itinerary";

interface ItineraryMapProps {
  days: ItineraryDay[];
  selectedDay: number | null;
}

const DAY_COLORS = [
  "#EA580C", "#0D9488", "#7C3AED", "#2563EB", "#DB2777",
  "#059669", "#D97706", "#4F46E5", "#DC2626", "#0891B2",
];

function getColor(dayNumber: number) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

function createNumberedIcon(num: number, color: string, size = 28) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};color:#fff;width:${size}px;height:${size}px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:${size < 28 ? 10 : 12}px;
      font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);
      transition:opacity .2s ease;
    ">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  dayNumber: number;
  time: string;
  seq: number; // sequential number within day
}

function collectMarkers(days: ItineraryDay[], filterDay: number | null): MarkerData[] {
  const result: MarkerData[] = [];
  const filtered = filterDay ? days.filter((d) => d.dayNumber === filterDay) : days;

  for (const day of filtered) {
    if (!Array.isArray(day.slots)) continue;
    let seq = 1;
    for (const slot of day.slots) {
      for (const act of slot.activities) {
        if (act.lat && act.lng) {
          result.push({
            lat: act.lat,
            lng: act.lng,
            title: act.title,
            dayNumber: day.dayNumber,
            time: act.time,
            seq: seq++,
          });
        }
      }
    }
  }
  return result;
}

export const ItineraryMap = ({ days, selectedDay }: ItineraryMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [showAllDays, setShowAllDays] = useState(false);

  const isOverview = showAllDays || !selectedDay;

  const markers = useMemo(
    () => collectMarkers(days, isOverview ? null : selectedDay),
    [days, selectedDay, isOverview]
  );

  // Unique day numbers present
  const dayNumbers = useMemo(
    () => [...new Set(days.map((d) => d.dayNumber))].sort((a, b) => a - b),
    [days]
  );

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers when selection changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    // Fade out via CSS class on container
    const el = containerRef.current;
    if (el) {
      el.style.opacity = "0.4";
      el.style.transition = "opacity 0.2s ease";
    }

    const timeout = setTimeout(() => {
      layer.clearLayers();

      for (const m of markers) {
        const color = isOverview ? getColor(m.dayNumber) : getColor(m.dayNumber);
        const label = isOverview ? m.seq : m.seq;
        const marker = L.marker([m.lat, m.lng], {
          icon: createNumberedIcon(label, color, isOverview ? 24 : 28),
        });
        marker.bindTooltip(m.title, {
          direction: "top",
          offset: [0, -14],
          className: "itinerary-marker-tooltip",
        });
        marker.bindPopup(
          `<div style="font-size:13px"><div style="font-weight:600">Day ${m.dayNumber} · ${m.time}</div><div>${m.title}</div></div>`
        );
        layer.addLayer(marker);
      }

      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      }

      if (el) el.style.opacity = "1";
    }, 200);

    return () => clearTimeout(timeout);
  }, [markers, isOverview]);

  if (markers.length === 0 && !showAllDays) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-border/50 text-sm text-muted-foreground">
        Map data unavailable for this itinerary
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowAllDays(false)}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            !showAllDays
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Day {selectedDay}
        </button>
        <button
          onClick={() => setShowAllDays(true)}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            showAllDays
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All Days
        </button>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-border/50 shadow-sm"
        style={{ height: 400 }}
      />

      {/* Legend — only in overview mode */}
      {isOverview && dayNumbers.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
          {dayNumbers.map((d) => (
            <div key={d} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: getColor(d) }}
              />
              Day {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
