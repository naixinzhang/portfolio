"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Visit = { city: string; lat: number; lng: number; count: number };

const SEED: Visit[] = [
  { city: "New York", lat: 40.71, lng: -74.01, count: 42 },
  { city: "Tokyo", lat: 35.68, lng: 139.69, count: 28 },
  { city: "London", lat: 51.51, lng: -0.13, count: 17 },
  { city: "Shanghai", lat: 31.23, lng: 121.47, count: 23 },
  { city: "Berlin", lat: 52.52, lng: 13.4, count: 9 },
  { city: "San Francisco", lat: 37.77, lng: -122.42, count: 19 },
];

export default function VisitorMap({ visits = SEED }: { visits?: Visit[] }) {
  const total = visits.reduce((s, v) => s + v.count, 0);
  return (
    <div className="w-full">
      <div
        className="h-[220px] w-full max-w-xl mx-auto overflow-hidden rounded-sm border border-[var(--border)]"
        style={{ opacity: 0.75 }}
      >
        <MapContainer
          center={[20, 10]}
          zoom={1}
          style={{ height: "100%", width: "100%", background: "var(--background)" }}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          worldCopyJump
        >
          <TileLayer
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          {visits.map((v) => (
            <CircleMarker
              key={v.city}
              center={[v.lat, v.lng]}
              radius={Math.max(3, Math.min(10, Math.sqrt(v.count) * 1.6))}
              pathOptions={{ color: "#f5f5f5", fillColor: "#f5f5f5", fillOpacity: 0.7, weight: 0 }}
            >
              <Tooltip>{v.city} · {v.count}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="mt-3 text-center text-xs text-[var(--muted)]">
        <strong className="text-[var(--foreground)]">{total}</strong> page views since Apr 13, 2026
      </div>
    </div>
  );
}
