'use client';

import React, { useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Card } from './ui/card';
import { PolygonFeature, DataSource } from '@/types';
import DrawControl from './DrawControl';
import PolygonRenderer from './PolygonRenderer';

interface MapViewProps {
  latitude: number;
  longitude: number;
  onPolygonComplete: (polygon: PolygonFeature) => void;
  polygons?: PolygonFeature[];
  selectedTime: string;
  dataSources: DataSource[];
  mode: 'single' | 'range';
  endDate?: string;
  onPolygonsUpdate?: (updatedPolygons: PolygonFeature[]) => void;
}

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
  const featureGroupRef = useRef<L.FeatureGroup>(null);

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