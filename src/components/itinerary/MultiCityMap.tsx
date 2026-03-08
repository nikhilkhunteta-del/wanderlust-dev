import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MultiCityRoute } from "@/types/multiCity";
import { MultiCityDay } from "@/types/multiCity";

interface MultiCityMapProps {
  route: MultiCityRoute;
  days: MultiCityDay[];
  selectedCity: string | null;
}

const cityColors = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316",
];

function createCityIcon(index: number, city: string) {
  const color = cityColors[index % cityColors.length];
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      color: white;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
    ">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createActivityIcon(dayNumber: number) {
  const color = "#64748b";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      color: white;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 600;
      border: 1.5px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      opacity: 0.8;
    ">${dayNumber}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createFallbackCityIcon(index: number, cityName: string) {
  const color = cityColors[index % cityColors.length];
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
    ">${index + 1}. ${cityName}</div>`,
    iconSize: [100, 28],
    iconAnchor: [50, 14],
  });
}

export const MultiCityMap = ({ route, days, selectedCity }: MultiCityMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const filteredDays = useMemo(() => {
    if (!selectedCity) return days;
    return days.filter((d) => d.cityName === selectedCity);
  }, [days, selectedCity]);

  const activityMarkers = useMemo(() => {
    const markers: { lat: number; lng: number; title: string; dayNumber: number; time: string; city: string }[] = [];
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
              city: day.cityName,
            });
          }
        }
      }
    }
    return markers;
  }, [filteredDays]);

  // Check if any activity markers have coordinates
  const hasActivityCoords = activityMarkers.length > 0;
  // Check if route stops have coordinates
  const stopsWithCoords = route.stops.filter((s) => s.lat && s.lng);
  const hasRouteCoords = stopsWithCoords.length > 0;

  useEffect(() => {
    if (!containerRef.current || !hasRouteCoords) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear all layers except tile
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const allPoints: [number, number][] = [];

    // If we have activity markers, render full map
    if (hasActivityCoords) {
      // Add city stop markers
      route.stops.forEach((stop, i) => {
        if (stop.lat && stop.lng) {
          const point: [number, number] = [stop.lat, stop.lng];
          allPoints.push(point);
          L.marker(point, { icon: createCityIcon(i, stop.city), zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(
              `<div style="font-size:13px">
                <div style="font-weight:700">${i + 1}. ${stop.city}</div>
                <div style="color:#666">${stop.country} · ${stop.days} days</div>
                ${stop.highlights.length > 0 ? `<div style="margin-top:4px;font-size:11px;color:#888">${stop.highlights.slice(0, 2).join(", ")}</div>` : ""}
              </div>`
            );
        }
      });

      // Draw route lines between consecutive stops
      const routePoints: [number, number][] = stopsWithCoords.map((s) => [s.lat, s.lng]);
      if (routePoints.length >= 2) {
        L.polyline(routePoints, {
          color: "#8b5cf6",
          weight: 3,
          opacity: 0.5,
          dashArray: "8, 8",
        }).addTo(map);
      }

      // Add activity markers
      for (const m of activityMarkers) {
        allPoints.push([m.lat, m.lng]);
        L.marker([m.lat, m.lng], { icon: createActivityIcon(m.dayNumber) })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:13px">
              <div style="font-weight:600">Day ${m.dayNumber} · ${m.time}</div>
              <div>${m.title}</div>
              <div style="font-size:11px;color:#888">${m.city}</div>
            </div>`
          );
      }
    } else {
      // Fix 3: Fallback — just city markers with straight line
      stopsWithCoords.forEach((stop, i) => {
        const point: [number, number] = [stop.lat, stop.lng];
        allPoints.push(point);
        L.marker(point, { icon: createFallbackCityIcon(i, stop.city), zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:13px">
              <div style="font-weight:700">${stop.city}</div>
              <div style="color:#666">${stop.country} · ${stop.days} days</div>
            </div>`
          );
      });

      // Straight line between stops
      const fallbackPoints: [number, number][] = stopsWithCoords.map((s) => [s.lat, s.lng]);
      if (fallbackPoints.length >= 2) {
        L.polyline(fallbackPoints, {
          color: "#8b5cf6",
          weight: 2,
          opacity: 0.4,
          dashArray: "6, 10",
        }).addTo(map);
      }
    }

    // Fit bounds
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [route, activityMarkers, hasActivityCoords, hasRouteCoords]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Always render the map container if route stops have coords
  if (!hasRouteCoords) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl border border-border/50 text-sm text-muted-foreground">
        Map data unavailable for this route
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-border/50 shadow-sm"
      style={{ height: 420 }}
    />
  );
};
