'use client';

import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Card } from './ui/card';
import { MapViewProps } from '@/types';
import DrawControl from './DrawControl';
import PolygonRenderer from './PolygonRenderer';

export const MapView: React.FC<MapViewProps> = ({ 
  latitude, 
  longitude, 
  onPolygonComplete, 
  polygons = [],
  selectedTime,
  dataSources,
  mode,
  endDate,
  onPolygonsUpdate
}) => {
  // Initialize with a new FeatureGroup to ensure it's never null
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  
// In MapView.tsx
useEffect(() => {
  console.log('MapContainer mounted');
  return () => console.log('MapContainer unmounted');
}, []);

  return (
    <Card className="h-full w-full overflow-hidden relative">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        dragging={true}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        />

        <FeatureGroup ref={featureGroupRef} />
        <PolygonRenderer
          polygons={polygons}
          selectedTime={selectedTime}
          dataSources={dataSources}
          featureGroupRef={featureGroupRef}
          mode={mode}
          endDate={endDate}
          onPolygonsUpdate={onPolygonsUpdate}
        />
        <DrawControl
          onPolygonCreate={onPolygonComplete}
          featureGroupRef={featureGroupRef}
          dataSources={dataSources}
        />
      </MapContainer>
    </Card>
  );
};