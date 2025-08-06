
'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { PolygonFeature, DataSource } from '@/types';

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

    const handleCreated = (e: L.LeafletEvent & { layer: L.Layer }) => {
      const layer = e.layer as L.Polygon;
      if (!('getLatLngs' in layer)) return;

      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      if (latlngs.length < 3 || latlngs.length > 12) {
        alert('Polygon must have between 3 and 12 points.');
        map.removeLayer(layer);
        return;
      }

      const label = prompt("Enter a name for this polygon", "Unnamed Region") || "Unnamed Region";
      
      const polygon: PolygonFeature = {
        id: `polygon-${Date.now()}`,
        paths: latlngs.map(p => ({ lat: p.lat, lng: p.lng })),
        label,
        dataSourceId: dataSources[0]?.id || '',
        properties: {
          createdAt: new Date().toISOString(),
          color: dataSources[0]?.color || '#3b82f6',
        }
      };

      onPolygonCreate(polygon);
      featureGroupRef.current?.addLayer(layer);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
    };
  }, [map, featureGroupRef, dataSources, onPolygonCreate]);

  return null;
};

export default DrawControl;