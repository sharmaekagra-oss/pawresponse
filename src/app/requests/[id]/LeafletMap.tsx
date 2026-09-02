"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const destIcon = L.divIcon({
  html: '<div style="font-size:28px;line-height:1;">📍</div>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const vetIcon = L.divIcon({
  html: '<div class="marker-ping" style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;">🚑</div>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom,
  destLat,
  destLng,
  addressLabel,
  vetLat,
  vetLng,
  vetName,
}: {
  center: [number, number];
  zoom: number;
  destLat: number | null;
  destLng: number | null;
  addressLabel: string;
  vetLat: number | null;
  vetLng: number | null;
  vetName: string | null;
}) {
  const hasDest = destLat !== null && destLng !== null;
  const hasVetPosition = vetLat !== null && vetLng !== null;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter position={center} />
      {hasDest && (
        <Marker position={[destLat as number, destLng as number]} icon={destIcon}>
          <Popup>Your location: {addressLabel}</Popup>
        </Marker>
      )}
      {hasVetPosition && (
        <Marker position={[vetLat as number, vetLng as number]} icon={vetIcon}>
          <Popup>{vetName ?? "Paravet"} is here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
