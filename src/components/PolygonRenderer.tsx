'use client';

import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { PolygonFeature, DataSource, CustomPolygonLayer } from '@/types';
import { calculateCentroid } from '@/lib/utils';
import { addHours, differenceInHours, format } from 'date-fns';

interface PolygonRendererProps {
    polygons: PolygonFeature[];
    selectedTime: string;
    dataSources: DataSource[];
    featureGroupRef: React.RefObject<L.FeatureGroup>;
    mode: 'single' | 'range';
    endDate?: string;
    onPolygonsUpdate?: (updatedPolygons: PolygonFeature[]) => void;
}

const PolygonRenderer: React.FC<PolygonRendererProps> = ({
    polygons,
    selectedTime,
    dataSources,
    featureGroupRef,
    mode,
    endDate,
    onPolygonsUpdate,
}) => {
    const map = useMap(); // Now used in the component

    const getColorForValue = useCallback((value: number, dataSourceId: string): string => {
        const source = dataSources.find(ds => ds.id === dataSourceId);
        if (!source || !source.rules.length) return source?.color || '#3b82f6';

        // Sort rules by value descending so we check from highest threshold first
        const sortedRules = [...source.rules].sort((a, b) => b.value - a.value);

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

        // If no rules match, return the source's base color
        return source.color;
    }, [dataSources]);

    const fetchDataForPolygon = useCallback(async (polygon: PolygonFeature): Promise<PolygonFeature> => {
  try {
    const centroid = calculateCentroid(polygon.paths);
    const startTime = new Date(selectedTime);
    const endTime = mode === 'range' && endDate ? new Date(endDate) : startTime;
    
    // Calculate all hours in the selected range
    const hoursInRange = differenceInHours(endTime, startTime);
    const timePoints = Array.from({ length: hoursInRange + 1 }, (_, i) => 
      addHours(startTime, i)
    );

    // Create cache key based on centroid and date range
    const cacheKey = `polygon-${centroid.lat}-${centroid.lng}-${format(startTime, 'yyyy-MM-dd')}-${hoursInRange}h`;
    const cachedData = localStorage.getItem(cacheKey); // Now properly defined
    
    let values: number[] = [];
    
    if (cachedData) {
      // Use cached data if available
      values = JSON.parse(cachedData).values;
    } else {
      // Fetch data from Open-Meteo API
      const dateStr = format(startTime, 'yyyy-MM-dd');
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${centroid.lat}&longitude=${centroid.lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m`
      );

      if (!res.ok) throw new Error('Failed to fetch temperature data');
      const data = await res.json();

      // Extract values for each hour in our selected range
      values = timePoints.map(time => {
        const hour = time.getHours();
        return data?.hourly?.temperature_2m?.[hour] || 0;
      });

      // Cache the values
      localStorage.setItem(cacheKey, JSON.stringify({ values }));
    }

    // Rest of the function remains the same...
    const value = mode === 'range' 
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : values[0];

    const source = dataSources.find(ds => ds.id === polygon.dataSourceId);
    const color = source 
      ? getColorForValue(value, source.id) 
      : '#3b82f6';

    featureGroupRef.current?.eachLayer((layer) => {
      const polyLayer = layer as CustomPolygonLayer;
      if (polyLayer instanceof L.Polygon && polyLayer.feature?.properties?.id === polygon.id) {
        polyLayer.setStyle({ 
          color,
          fillColor: color,
          fillOpacity: 0.4
        });
        
        polyLayer.bindTooltip(
          `${source?.name || 'Data'}: ${value.toFixed(1)}°C`,
          { permanent: false }
        );

        if (polyLayer.feature?.properties) {
          polyLayer.feature.properties = {
            ...polyLayer.feature.properties,
            value,
            color,
            timeRange: mode === 'range' 
              ? `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`
              : format(startTime, 'HH:mm')
          };
        }
      }
    });

    return {
      ...polygon,
      properties: {
        ...polygon.properties,
        value,
        color,
        timeRange: mode === 'range' 
          ? `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`
          : format(startTime, 'HH:mm')
      }
    };
  } catch (error) {
    console.error(`Error processing polygon ${polygon.id}:`, error);
    return polygon;
  }
}, [dataSources, endDate, featureGroupRef, getColorForValue, mode, selectedTime]);

    const updatePolygons = useCallback(async (): Promise<void> => {
        if (!polygons.length) return;
        const updatedPolygons = await Promise.all(
            polygons.map(polygon => fetchDataForPolygon(polygon))
        );
        if (onPolygonsUpdate) {
            onPolygonsUpdate(updatedPolygons);
        }
    }, [fetchDataForPolygon, onPolygonsUpdate, polygons]);

    useEffect(() => {
        const updatePolygons = async () => {
            if (!polygons.length) return;

            const updatedPolygons = await Promise.all(
                polygons.map(polygon => fetchDataForPolygon(polygon))
            );

            if (onPolygonsUpdate) {
                onPolygonsUpdate(updatedPolygons);
            }
        };

        updatePolygons();
    }, [selectedTime, endDate, mode, polygons, fetchDataForPolygon, onPolygonsUpdate]);// Now properly includes all dependencies

    return null;
};

export default PolygonRenderer;