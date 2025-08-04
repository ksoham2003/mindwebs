'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { PolygonFeature, DataSource, CustomPolygonLayer } from '@/types';

interface DrawControlProps {
  onPolygonCreate: (polygon: PolygonFeature) => void;
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  dataSources: DataSource[];
}

const DrawControl: React.FC<DrawControlProps> = ({
  onPolygonCreate,
  featureGroupRef,
  dataSources,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    // Initialize the draw control with proper types
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: dataSources[0]?.color || '#3b82f6',
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
      const layer = (e as L.DrawEvents.Created).layer as L.Polygon;
      if (!('getLatLngs' in layer)) return;

      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      if (latlngs.length < 3 || latlngs.length > 12) {
        alert('Polygon must have between 3 and 12 points.');
        return;
      }

      const polygon: PolygonFeature = {
        id: `polygon-${Date.now()}`,
        paths: latlngs.map((p) => ({ lat: p.lat, lng: p.lng })),
        label: 'temperature',
        dataSourceId: dataSources[0]?.id || '',
        properties: {
          createdAt: new Date().toISOString(),
          color: dataSources[0]?.color || '#3b82f6',
        },
      };

      (layer as CustomPolygonLayer).feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [latlngs.map((p) => [p.lng, p.lat])],
        },
        properties: {
          id: polygon.id,
          createdAt: polygon.properties.createdAt,
          color: polygon.properties.color,
          dataSourceId: polygon.dataSourceId,
          label: polygon.label,
        },
      };

      onPolygonCreate(polygon);
      featureGroupRef.current?.addLayer(layer);
    };

    map.on('draw:created', handleCreated);

    return () => {
      map.off('draw:created', handleCreated);
      map.removeControl(drawControl);
    };
  }, [map, featureGroupRef, dataSources, onPolygonCreate]);

  return null;
};

export default DrawControl;