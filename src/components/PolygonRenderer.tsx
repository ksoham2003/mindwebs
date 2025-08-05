'use client';
import { useEffect, useCallback } from 'react';
import * as L from 'leaflet';
import 'leaflet-draw';
import { calculateCentroid } from '@/lib/utils';
import { format } from 'date-fns';
import { PolygonFeature, DataSource, ColorRule, CustomPolygonLayer } from '@/types';

interface PolygonRendererProps {
  polygons: PolygonFeature[];
  selectedTime: string;
  dataSources: DataSource[];
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  mode: 'single' | 'range';
  endDate?: string;
  onPolygonsUpdate?: (polygons: PolygonFeature[]) => void;
  map: L.Map;
}

const PolygonRenderer: React.FC<PolygonRendererProps> = ({
  polygons,
  selectedTime,
  dataSources,
  featureGroupRef,
  mode,
  endDate,
  onPolygonsUpdate
}) => {
  const getColorForValue = useCallback((
    value: number,
    rules: ColorRule[],
    defaultColor: string = '#3b82f6'
  ): string => {
    if (!rules || !rules.length) return defaultColor;

    const sortedRules = [...rules].sort((a, b) => b.value - a.value);
    for (const rule of sortedRules) {
      if (
        (rule.operator === '<' && value < rule.value) ||
        (rule.operator === '<=' && value <= rule.value) ||
        (rule.operator === '=' && value === rule.value) ||
        (rule.operator === '>=' && value >= rule.value) ||
        (rule.operator === '>' && value > rule.value)
      ) {
        return rule.color;
      }
    }
    return defaultColor;
  }, []);

  // In PolygonRenderer.tsx
const updatePolygonData = useCallback(async (polygon: PolygonFeature): Promise<PolygonFeature> => {
  console.log('Starting polygon data update for:', polygon.id);
  try {
    const centroid = calculateCentroid(polygon.paths);
    
    console.log('Calculated centroid:', centroid);
    const startTime = new Date(selectedTime);
    const endTime = mode === 'range' && endDate ? new Date(endDate) : startTime;
console.log('Time range:', { startTime, endTime, mode });
    const source = dataSources.find(ds => ds.id === polygon.dataSourceId);
    console.log('Found data source:', source?.name || 'Not found');
    if (!source) return polygon;

    // Fetch temperature data
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${centroid.lat}&longitude=${centroid.lng}&start_date=${format(startTime, 'yyyy-MM-dd')}&end_date=${format(endTime, 'yyyy-MM-dd')}&hourly=temperature_2m`
    );
    console.log('Fetching from:', response.url);

    if (!response.ok) {
      console.error('API request failed', response.status);
      return polygon;
    }

    const data = await response.json();
    const temperatures = data.hourly.temperature_2m;
    const times = data.hourly.time;

    // Get values for our time range
    const values = times.map((timeStr: string, i: number) => {
  const time = new Date(timeStr);
  return time >= startTime && time <= endTime ? temperatures[i] : null;
}).filter((v: number | null): v is number => v !== null);
  console.log('Filtered values:', values);
    if (values.length === 0) {
      console.warn('No data for time range');
      return polygon;
    }

    // Calculate value (single or average)
    const value = mode === 'range' 
  ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length 
  : values[0];
console.log('Filtered values:', values);
    // Get color based on rules
    const color = getColorForValue(value, source.rules, source.color);

    // Update polygon appearance
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer: L.Layer) => {
        const polyLayer = layer as CustomPolygonLayer;
        if (polyLayer.feature?.properties?.id === polygon.id) {
          polyLayer.setStyle({
            color: color,
            fillColor: color,
            fillOpacity: 0.4
          });

          // Update tooltip
          const tooltipContent = `${polygon.label}\n${value.toFixed(1)}°C`;
          polyLayer.unbindTooltip();
          polyLayer.bindTooltip(tooltipContent, {
            permanent: true,
            direction: 'center'
          });
        }
      });
    }

    return {
      ...polygon,
      properties: {
        ...polygon.properties,
        value,
        color,
        timeRange: mode === 'range' 
          ? `${format(startTime, 'MMM d HH:mm')} - ${format(endTime, 'MMM d HH:mm')}`
          : undefined
      }
    };
  } catch (error) {
    console.error('Error updating polygon:', error);
    return polygon;
  }
}, [selectedTime, mode, endDate, dataSources, getColorForValue, featureGroupRef]);

  useEffect(() => {
    if (!featureGroupRef.current || !polygons.length) return;

    const validPolygons = polygons.filter(
      (p): p is PolygonFeature => !!p && Array.isArray(p.paths)
    );
    if (validPolygons.length === 0) return;

    const initEditHandlers = () => {
      const group = featureGroupRef.current;
      if (!group) return;

      group.eachLayer((layer: L.Layer) => {
        const polyLayer = layer as CustomPolygonLayer;

        if (polyLayer.editing) {
          polyLayer.editing.enable();

          polyLayer.on('edit', () => {
            const latlngs = polyLayer.getLatLngs()[0] as L.LatLng[];
            if (latlngs.length < 3 || latlngs.length > 12) {
              alert('Polygon must have between 3 and 12 points.');
              return;
            }

            const feature = polyLayer.feature;
            if (!feature?.properties?.id) return;

            const updatedPolygons = polygons.map(p => {
              if (p.id === feature.properties.id) {
                return {
                  ...p,
                  paths: latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }))
                };
              }
              return p;
            });

            onPolygonsUpdate?.(updatedPolygons);
          });
        }
      });
    };

    const updateAll = async () => {
      try {
        const updated = await Promise.all(validPolygons.map(updatePolygonData));

        const hasChanged = updated.some((p, i) => {
          const old = validPolygons[i];
          return (
            p?.properties?.value !== old?.properties?.value ||
            p?.properties?.color !== old?.properties?.color
          );
        });

        if (hasChanged) {
          onPolygonsUpdate?.(
            polygons.map(p => updated.find(u => u.id === p.id) || p)
          );
        }

        initEditHandlers();
      } catch (error) {
        console.error('Error updating polygons:', error);
      }
    };

    updateAll();

    const group = featureGroupRef.current;
    return () => {
      if (group) {
        group.eachLayer((layer: L.Layer) => {
          const polyLayer = layer as CustomPolygonLayer;
          if (polyLayer.editing) {
            polyLayer.off('edit');
            polyLayer.editing.disable();
          }
        });
      }
    };
  }, [selectedTime, endDate, mode, polygons, updatePolygonData, onPolygonsUpdate, featureGroupRef]);

  return null;
};

export default PolygonRenderer;