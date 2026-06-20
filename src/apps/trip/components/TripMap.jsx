import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet marker icon resolution in Vite/bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

export default function TripMap({ places = [], onMapClick, height = 380 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const onClickRef = useRef(onMapClick);

  useEffect(() => { onClickRef.current = onMapClick; });

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-2, 117], // Indonesia default
      zoom: 5,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => {
      onClickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const valid = places.filter((p) => p.lat != null && p.lng != null);

    valid.forEach((place) => {
      const marker = L.marker([place.lat, place.lng])
        .addTo(map)
        .bindPopup(
          `<strong>${place.name}</strong>${place.notes ? `<br/>${place.notes}` : ""}`,
        );
      markersRef.current.push(marker);
    });

    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 13);
    } else if (valid.length > 1) {
      map.fitBounds(
        valid.map((p) => [p.lat, p.lng]),
        { padding: [30, 30], maxZoom: 14 },
      );
    }
  }, [places]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height,
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    />
  );
}
