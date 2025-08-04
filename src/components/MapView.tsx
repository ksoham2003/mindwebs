'use client';

import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
} from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Card } from './ui/card';
import { PolygonFeature } from '@/types';

interface MapViewProps {
  latitude: number;
  longitude: number;
  onPolygonComplete: (polygon: PolygonFeature) => void;
  polygons?: PolygonFeature[];
  selectedTime: string;
}

const DrawControl: React.FC<{
  onPolygonCreate: (polygon: PolygonFeature) => void;
  featureGroupRef: React.RefObject<L.FeatureGroup>;
}> = ({ onPolygonCreate, featureGroupRef }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3b82f6',
            fillOpacity: 0.4,
          },
          guidelineDistance: 10,
          metric: true,
          repeatMode: false,
        },
        marker: false,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true,
      },
    });

    map.addControl(drawControl);

    const handleCreated = (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;

      if (event.layerType === 'polygon') {
        const layer = event.layer as L.Polygon;
        const latlngs = layer.getLatLngs()[0] as LatLng[];

        if (latlngs.length < 3 || latlngs.length > 12) {
          alert('Polygon must have between 3 and 12 points.');
          return;
        }

        const coords = latlngs.map((p) => ({ lat: p.lat, lng: p.lng }));
        const id = `polygon-${Date.now()}`;

        const polygon: PolygonFeature = { 
          id, 
          paths: coords, 
          label: 'temperature',
          properties: {
            createdAt: new Date().toISOString(),
            timeRange: '',
            color: '#3b82f6'
          }
        };

        onPolygonCreate(polygon);
        featureGroupRef.current?.addLayer(layer);
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
    };
  }, [map, featureGroupRef, onPolygonCreate]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  latitude, 
  longitude, 
  onPolygonComplete, 
  polygons,
  selectedTime
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  return (
    <Card className="h-full w-full overflow-hidden relative">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        ref={(ref) => {
          if (ref) mapRef.current = ref;
        }}
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
        <DrawControl
          onPolygonCreate={onPolygonComplete}
          featureGroupRef={featureGroupRef}
        />
      </MapContainer>
    </Card>
  );
};