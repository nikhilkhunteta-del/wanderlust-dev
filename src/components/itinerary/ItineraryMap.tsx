import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ItineraryDay } from "@/types/itinerary";

interface ItineraryMapProps {
  days: ItineraryDay[];
  selectedDay: number | null;
}

// Custom colored marker icons per day
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

// Component to fit bounds when data changes
function FitBounds({ markers }: { markers: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [markers, map]);

  return null;
}

export const ItineraryMap = ({ days, selectedDay }: ItineraryMapProps) => {
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

  if (allMarkers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-border/50 text-sm text-muted-foreground">
        Map data unavailable for this itinerary
      </div>
    );
  }

  const center: [number, number] = [allMarkers[0].lat, allMarkers[0].lng];

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm" style={{ height: 400 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={allMarkers} />
        {allMarkers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            icon={createDayIcon(marker.dayNumber)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Day {marker.dayNumber} · {marker.time}</div>
                <div>{marker.title}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
