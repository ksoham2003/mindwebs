'use client';
import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapViewProps, DataSource, PolygonFeature } from '@/types';
import DrawControl from './DrawControl';
import PolygonRenderer from './PolygonRenderer';

interface MapContentProps {
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  polygons: PolygonFeature[];
  selectedTime: string;
  dataSources: DataSource[];
  mode: 'single' | 'range';
  endDate?: string;
  onPolygonsUpdate?: (polygons: PolygonFeature[]) => void;
  onPolygonComplete: (polygon: PolygonFeature) => void;
}

const MapContent: React.FC<MapContentProps> = (props) => {
  const map = useMap();

  useEffect(() => {
    if (map && props.featureGroupRef.current) {
      props.featureGroupRef.current.addTo(map);
    }
  }, [map, props.featureGroupRef]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <FeatureGroup ref={props.featureGroupRef} />
      <PolygonRenderer {...props} map={map} />
      <DrawControl {...props} onPolygonCreate={props.onPolygonComplete} />
    </>
  );
};

const Legend: React.FC<{ dataSources: DataSource[] }> = ({ dataSources }) => (
  <div className="absolute bottom-4 right-4 bg-white p-4 rounded shadow z-[1000] min-w-[200px]">
    <h4 className="font-medium mb-2 text-sm">Data Sources & Rules</h4>
    {dataSources.map(source => (
      <div key={source.id} className="mb-3">
        <div className="flex items-center mb-1">
          <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: source.color }}
          />
          <span className="text-sm font-medium">{source.name}</span>
        </div>
        <div className="ml-6 space-y-1">
          {source.rules.length > 0 ? (
            source.rules.map((rule, i) => (
              <div key={i} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: rule.color }}
                />
                <span>{rule.operator} {rule.value}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No rules defined</div>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const MapView: React.FC<MapViewProps> = (props) => {
  // Initialize with non-null FeatureGroup
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[props.latitude, props.longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContent
          {...props}
          featureGroupRef={featureGroupRef}
          polygons={props.polygons ?? []} // <-- Ensure it's always an array
        />
      </MapContainer>
      <Legend dataSources={props.dataSources} />
    </div>
  );
};