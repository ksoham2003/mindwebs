
'use client';
import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Trash2, Eye, MapPin } from 'lucide-react';
import DrawControl from './DrawControl';
import PolygonRenderer from './PolygonRenderer';
import { Legend } from './Legend';
import { useAppStore } from '@/lib/store';
import { PolygonFeature } from '@/types';

interface CustomPolygonLayer extends L.Polygon {
  feature?: {
    type: 'Feature';
    geometry: GeoJSON.Polygon;
    properties: {
      id: string;
      color: string;
      dataSourceId: string;
      label: string;
      createdAt: string;
    };
  };
}

export const MapView: React.FC = () => {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPolygonsList, setShowPolygonsList] = useState(false);
  const [highlightedPolygon, setHighlightedPolygon] = useState<string | null>(null);

  const {
    polygons,
    dataSources,
    addPolygon,
    removePolygon,
    setPolygons,
    latitude,
    longitude
  } = useAppStore();

  const mapRef = useRef<L.Map | null>(null);

  const handlePolygonCreated = (polygon: PolygonFeature) => {
    if (polygon.paths.length < 3 || polygon.paths.length > 12) {
      alert('Polygon must have between 3 and 12 points.');
      return;
    }

    if (dataSources.length === 1) {
      addPolygon({
        ...polygon,
        dataSourceId: dataSources[0].id,
        properties: {
          ...polygon.properties,
          color: dataSources[0].color
        }
      });
      return;
    }

    const popover = document.createElement('div');
    popover.innerHTML = `
      <div style="padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1)">
        <h3 style="margin-bottom: 0.5rem">Select Data Source</h3>
        <div style="display: flex; flex-direction: column; gap: 0.5rem">
          ${dataSources.map(source => `
            <button 
              style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem; background: ${source.color}; color: white"
              onclick="window.selectDataSource('${source.id}')"
            >
              ${source.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const selectDataSource = (sourceId: string) => {
      const source = dataSources.find(s => s.id === sourceId);
      if (source) {
        addPolygon({
          ...polygon,
          dataSourceId: source.id,
          properties: {
            ...polygon.properties,
            color: source.color
          }
        });
      }
      if (mapRef.current) {
        mapRef.current.closePopup();
      }
    };

    (window as typeof window & { selectDataSource?: (sourceId: string) => void }).selectDataSource = selectDataSource;

    if (mapRef.current) {
      L.popup()
        .setLatLng(polygon.paths[0])
        .setContent(popover)
        .openOn(mapRef.current);
    }
  };

  const handleDeletePolygon = (polygonId: string) => {
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
        const polyLayer = layer as CustomPolygonLayer;
        if (polyLayer.feature?.properties.id === polygonId) {
          featureGroupRef.current?.removeLayer(layer);
        }
      });
    }
    removePolygon(polygonId);
  };

  const handleDeleteAllPolygons = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setPolygons([]);
  };

  const handlePolygonClick = (polygonId: string) => {
    setHighlightedPolygon(polygonId);
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
        const polyLayer = layer as CustomPolygonLayer;
        if (polyLayer.feature?.properties.id === polygonId) {
          polyLayer.setStyle({
            color: '#ff0000',
            weight: 3,
            fillOpacity: 0.7
          });
        } else {
          const originalColor = polyLayer.feature?.properties.color || '#3388ff';
          polyLayer.setStyle({
            color: originalColor,
            weight: 2,
            fillOpacity: 0.4
          });
        }
      });
    }
  };

  const handleShowAllPolygons = () => {
    if (featureGroupRef.current && polygons.length > 0 && mapRef.current) {
      const bounds = featureGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds.pad(0.2));
      }
    }
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm shadow-md p-2 flex items-center justify-between gap-4">
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
        center={[latitude, longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FeatureGroup ref={featureGroupRef}>
          {polygons.map(polygon => (
            <Polygon
              key={polygon.id}
              positions={polygon.paths.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: polygon.properties.color || '#3388ff',
                fillColor: polygon.properties.color || '#3388ff',
                fillOpacity: 0.4
              }}
            />
          ))}
        </FeatureGroup>
        <PolygonRenderer featureGroupRef={featureGroupRef} />
        {isDrawing && (
          <DrawControl
            onPolygonCreate={handlePolygonCreated}
            featureGroupRef={featureGroupRef}
            dataSources={dataSources}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm shadow-md p-2">
        <Legend />
      </div>

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