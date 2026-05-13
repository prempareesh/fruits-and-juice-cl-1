"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Target } from 'lucide-react';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialCenter: [number, number];
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  radiusKm?: number;
}

// Internal component to handle map clicks/drags
const MapEvents = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to fly to a location when it changes
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15);
  }, [center]);
  return null;
};

export default function MapPicker({ initialCenter, onLocationSelect, radiusKm = 5 }: MapPickerProps) {
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [markerPos, setMarkerPos] = useState<[number, number]>(initialCenter);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkerDrag = (e: any) => {
    const latlng = e.target.getLatLng();
    setMarkerPos([latlng.lat, latlng.lng]);
    onLocationSelect(latlng.lat, latlng.lng, "");
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setCenter(newPos);
        setMarkerPos(newPos);
        onLocationSelect(parseFloat(lat), parseFloat(lon), display_name);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <div className="flex-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-2 flex items-center gap-2">
          <Search size={18} className="ml-2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search shop address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-1"
          />
          <button 
            onClick={handleSearch}
            className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-black uppercase"
          >
            Find
          </button>
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onLocationSelect={(lat, lng) => {
          setMarkerPos([lat, lng]);
          onLocationSelect(lat, lng, "");
        }} />
        
        <MapRecenter center={center} />

        <Marker 
          position={markerPos} 
          draggable={true}
          eventHandlers={{ dragend: handleMarkerDrag }}
        >
        </Marker>

        {/* Visual Radius Rings */}
        <Circle 
          center={markerPos} 
          radius={3000} 
          pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.1, weight: 1 }} 
        />
        <Circle 
          center={markerPos} 
          radius={radiusKm * 1000} 
          pathOptions={{ color: '#F97316', fillColor: '#F97316', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
        />
      </MapContainer>

      {/* Floating Info */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Current Shop Position</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-emerald-500 uppercase">Service Radius</p>
            <p className="text-sm font-black text-slate-800 dark:text-white">{radiusKm} KM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
