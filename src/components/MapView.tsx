'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapViewProps, DataSource, PolygonFeature, CustomPolygonLayer } from '@/types';
import DrawControl from './DrawControl';
import PolygonRenderer from './PolygonRenderer';
import { Button } from './ui/button';
import { Trash2, Eye, MapPin } from 'lucide-react';

const MapInstanceHandler = ({ setMapInstance }: { setMapInstance: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
};

const MapContent = ({
  featureGroupRef,
  polygons = [],
  selectedTime,
  dataSources,
  mode,
  endDate,
  onPolygonsUpdate,
  onPolygonComplete,
  isDrawing,
  setMapInstance
}: {
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  polygons?: PolygonFeature[];
  selectedTime: string;
  dataSources: DataSource[];
  mode: 'single' | 'range';
  endDate?: string;
  onPolygonsUpdate?: (polygons: PolygonFeature[]) => void;
  onPolygonComplete: (polygon: PolygonFeature) => void;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  setMapInstance: (map: L.Map) => void;
}) => {
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <FeatureGroup ref={featureGroupRef} />
      <MapInstanceHandler setMapInstance={setMapInstance} />
      <PolygonRenderer
        polygons={polygons}
        selectedTime={selectedTime}
        dataSources={dataSources}
        featureGroupRef={featureGroupRef}
        mode={mode}
        endDate={endDate}
        onPolygonsUpdate={onPolygonsUpdate}
        map={useMap()}
      />
      {isDrawing && (
        <DrawControl
          onPolygonCreate={onPolygonComplete}
          featureGroupRef={featureGroupRef}
          dataSources={dataSources}
        />
      )}
    </>
  );
};

const Legend: React.FC<{ dataSources: DataSource[] }> = ({ dataSources }) => (
  <div className="w-full">
    <h4 className="font-medium text-sm mb-2">Data Sources & Rules</h4>
    <div className="flex flex-wrap gap-4">
      {dataSources.map(source => (
        <div key={source.id} className="flex items-start">
          <div className="flex items-center mr-2">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: source.color }}
            />
            <span className="text-sm font-medium">{source.name}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {source.rules.length > 0 ? (
              source.rules.map((rule, i) => (
                <div key={i} className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
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
  </div>
);



export const MapView: React.FC<MapViewProps> = (props) => {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPolygonsList, setShowPolygonsList] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [highlightedPolygon, setHighlightedPolygon] = useState<string | null>(null);

  // Ensure polygons is always an array
  const polygons = useMemo(() => props.polygons || [], [props.polygons]);




  // Alternative safer approach using the map prop
  const handlePolygonClick = (polygonId: string) => {
    console.log('Polygon clicked:', polygonId);
    setHighlightedPolygon(polygonId);

    if (featureGroupRef.current && props.map) {
      featureGroupRef.current.eachLayer((layer: L.Layer) => {
        const polyLayer = layer as L.Polygon;
        const feature = (polyLayer as CustomPolygonLayer).feature;


        if (feature?.properties?.id === polygonId) {
          // Highlight the polygon
          polyLayer.setStyle({
            color: '#ff0000',
            weight: 3,
            fillOpacity: 0.7
          });

          // Use the map prop instead of accessing _map directly
          props.map?.fitBounds(polyLayer.getBounds(), {
            padding: [50, 50],
            maxZoom: 18
          });
        } else {
          // Reset other polygons
          const originalColor = feature?.properties?.color || '#3388ff';
          polyLayer.setStyle({
            color: originalColor,
            weight: 2,
            fillOpacity: 0.4
          });
        }
      });
    }
  };

  // Reset highlight when closing the list
  useEffect(() => {
    if (!showPolygonsList) {
      setHighlightedPolygon(null);
      resetPolygonStyles();
    }
  }, [showPolygonsList]);

  const resetPolygonStyles = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer: L.Layer) => {
        const polyLayer = layer as L.Polygon;
        const feature = (polyLayer as CustomPolygonLayer).feature;

        const originalColor = feature?.properties?.color || '#3388ff';
        polyLayer.setStyle({
          color: originalColor,
          weight: 2,
          fillOpacity: 0.4
        });
      });
    }
  };

  const handleShowAllPolygons = () => {
    if (featureGroupRef.current && polygons.length > 0 && mapInstance) {
      const bounds = featureGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds.pad(0.2));
      }
    }
  };

  const handleDeletePolygon = (polygonId: string) => {
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
  const polyLayer = layer as CustomPolygonLayer;
  const feature = polyLayer.feature;

  if (feature?.properties?.id === polygonId) {
    featureGroupRef.current?.removeLayer(layer);
  }
});

    }
    props.onPolygonsUpdate?.(polygons.filter(p => p.id !== polygonId));
  };

  const handleDeleteAllPolygons = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    props.onPolygonsUpdate?.([]);
  };

  const handlePolygonComplete = (polygon: PolygonFeature) => {
    setIsDrawing(false);
    props.onPolygonComplete(polygon);
  };

  // In MapView.tsx
  useEffect(() => {
    console.log('Polygons updated - rendering:', polygons.length);
    // This ensures polygons stay on the map and update when data changes
    if (featureGroupRef.current) {
      console.log('Clearing existing layers');
      featureGroupRef.current.clearLayers();
      polygons.forEach(polygon => {
        console.log('Rendering polygon:', polygon.id);
        const layer = L.polygon(
          polygon.paths.map(p => [p.lat, p.lng]),
          {
            color: polygon.properties.color,
            fillColor: polygon.properties.color,
            fillOpacity: 0.4
          }
        ) as CustomPolygonLayer;

        layer.feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygon.paths.map(p => [p.lng, p.lat])]
          },
          properties: {
            ...polygon.properties, // Spread existing properties
            id: polygon.id,
            color: polygon.properties.color,
            label: polygon.label,
            createdAt: polygon.properties.createdAt || new Date().toISOString(), // Ensure createdAt exists
            dataSourceId: polygon.dataSourceId,
            value: polygon.properties.value,
            timeRange: polygon.properties.timeRange
          }
        };

        const tooltipContent = `${polygon.label}\n${polygon.properties.value ? `${polygon.properties.value.toFixed(1)}°C` : 'Loading...'}`;
        layer.bindTooltip(tooltipContent, {
          permanent: true,
          direction: 'center'
        });

        featureGroupRef.current?.addLayer(layer);
      });
    }
  }, [polygons]);

  return (
    <div className="h-full w-full relative">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm shadow-md p-2 flex items-center justify-between gap-4">
        {/* Left Side - Main Controls */}
        <div className="flex items-center gap-2 ml-10">

          <Button
            variant={isDrawing ? "default" : "outline"}
            onClick={() => {
              setIsDrawing(!isDrawing);
              setShowPolygonsList(false);
            }}
            size="sm"
            className="gap-2"
          >
            <MapPin size={16} />
            {isDrawing ? 'Stop Drawing' : 'Draw Polygon'}
          </Button>

          {polygons.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPolygonsList(!showPolygonsList)}
                size="sm"
                className="gap-2"
              >
                <Eye size={16} />
                {showPolygonsList ? 'Hide List' : 'Show Polygons'}
              </Button>

              <Button
                variant="outline"
                onClick={handleShowAllPolygons}
                size="sm"
                className="gap-2"
              >
                <Eye size={16} />
                View All
              </Button>
            </>
          )}
        </div>

        {/* Right Side - Delete All */}
        {polygons.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllPolygons}
            className="text-red-500 hover:text-red-700 gap-2"
          >
            <Trash2 size={16} />
            Clear All
          </Button>
        )}
      </div>
      <MapContainer
        center={[props.latitude, props.longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContent
          featureGroupRef={featureGroupRef}
          polygons={props.polygons}
          selectedTime={props.selectedTime}
          dataSources={props.dataSources}
          mode={props.mode}
          endDate={props.endDate}
          onPolygonsUpdate={props.onPolygonsUpdate}
          onPolygonComplete={handlePolygonComplete}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          setMapInstance={setMapInstance}
        />
      </MapContainer>




      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm shadow-md p-2">
        <Legend dataSources={props.dataSources} />
      </div>

      {/* Polygons List - appears below controls when toggled */}
      {showPolygonsList && polygons.length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-[999] bg-white shadow-lg mx-4 p-3 max-h-60 overflow-y-auto border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {polygons.map(polygon => (
              <div
                key={polygon.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${highlightedPolygon === polygon.id
                    ? 'bg-blue-100 border border-blue-400'
                    : 'hover:bg-gray-50'
                  }`}
                onClick={() => handlePolygonClick(polygon.id)}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: polygon.properties.color }}
                  />
                  <span className="text-sm">
                    {polygon.label || "Unnamed Region"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePolygon(polygon.id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};