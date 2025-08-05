'use client';
import { useEffect, useCallback } from 'react';
import * as L from 'leaflet';
import { calculateCentroid } from '@/lib/utils';
import { format, addHours, differenceInHours } from 'date-fns';
import { PolygonFeature, DataSource, CustomPolygonLayer, ColorRule } from '@/types';

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
  onPolygonsUpdate,
  map
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

  const updatePolygonData = useCallback(async (polygon: PolygonFeature): Promise<PolygonFeature> => {
    try {
      if (!polygon.paths || polygon.paths.length < 3) {
        console.warn('Invalid polygon structure', polygon);
        return polygon;
      }

      const centroid = calculateCentroid(polygon.paths);
      const startTime = new Date(selectedTime);
      const endTime = mode === 'range' && endDate ? new Date(endDate) : startTime;

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid start or end time');
        return polygon;
      }

      const hours = differenceInHours(endTime, startTime);
      const timePoints = Array.from({ length: hours + 1 }, (_, i) => addHours(startTime, i));

      const values: number[] = [];
      let failedRequests = 0;
      const MAX_FAILED_REQUESTS = 3;

      for (const timePoint of timePoints) {
        if (isNaN(timePoint.getTime())) {
          console.warn('Invalid time point:', timePoint);
          continue;
        }

        const cacheKey = `polygon-${centroid.lat}-${centroid.lng}-${format(timePoint, 'yyyy-MM-dd-HH')}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (typeof parsedData.value === 'number') {
              values.push(parsedData.value);
              continue;
            }
          } catch (e) {
            console.warn('Invalid cache data for', cacheKey);
          }
        }

        if (failedRequests >= MAX_FAILED_REQUESTS) {
          console.warn('Max failed requests reached, skipping');
          break;
        }

        try {
          const response = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${centroid.lat}&longitude=${centroid.lng}&start_date=${format(timePoint, 'yyyy-MM-dd')}&end_date=${format(timePoint, 'yyyy-MM-dd')}&hourly=temperature_2m`
          );

          if (!response.ok) {
            console.error('API request failed', response.status);
            failedRequests++;
            continue;
          }

          const data = await response.json();
          if (!data?.hourly?.time || !Array.isArray(data.hourly.time)) {
            console.error('Invalid API response');
            failedRequests++;
            continue;
          }

          const hourIndex = data.hourly.time.findIndex((t: string) => {
            try {
              return new Date(t).getTime() === timePoint.getTime();
            } catch {
              return false;
            }
          });

          if (hourIndex !== -1 && data.hourly.temperature_2m?.[hourIndex] !== undefined) {
            const value = data.hourly.temperature_2m[hourIndex];
            if (typeof value === 'number') {
              values.push(value);
              try {
                localStorage.setItem(cacheKey, JSON.stringify({ value }));
              } catch (e) {
                console.warn('Failed to cache data', e);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch data for time point', timePoint, error);
          failedRequests++;
        }
      }

      if (values.length === 0) {
        console.warn('No valid data found for polygon', polygon.id);
        return polygon;
      }

      const value = mode === 'range'
        ? values.reduce((sum, val) => sum + val, 0) / values.length
        : values[0];

      const source = dataSources.find(ds => ds.id === polygon.dataSourceId);
      const color = source
        ? getColorForValue(value, source.rules, source.color)
        : '#3b82f6';

      if (featureGroupRef.current) {
        featureGroupRef.current.eachLayer((layer: L.Layer) => {
          try {
            const polyLayer = layer as CustomPolygonLayer;
            if (polyLayer.feature?.properties?.id === polygon.id) {
              polyLayer.setStyle({ color, fillColor: color, fillOpacity: 0.4 });

              const tooltipContent = `${polygon.label || 'Region'}\n${mode === 'range' ? `Avg: ${value.toFixed(1)} (${values.length} hrs)` : `Value: ${value.toFixed(1)}`}`;
              polyLayer.unbindTooltip();
              polyLayer.bindTooltip(tooltipContent, {
                permanent: true,
                direction: 'center',
                className: 'bg-white text-black rounded px-2 py-1 text-xs',
              });

              // Editable label
              polyLayer.on('click', () => {
                const newLabel = prompt("Edit polygon label:", polygon.label);
                if (newLabel) {
                  polygon.label = newLabel;
                  polyLayer.unbindTooltip();
                  polyLayer.bindTooltip(`${newLabel}\n${mode === 'range' ? `Avg: ${value.toFixed(1)}` : `Value: ${value.toFixed(1)}`}`, {
                    permanent: true,
                    direction: 'center',
                    className: 'bg-white text-black rounded px-2 py-1 text-xs',
                  });
                  onPolygonsUpdate?.(
                    polygons.map(p => p.id === polygon.id ? { ...p, label: newLabel } : p)
                  );
                }
              });
            }
          } catch (e) {
            console.error('Error updating polygon layer', e);
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
      console.error('Update failed:', error);
      return polygon;
    }
  }, [selectedTime, mode, endDate, dataSources, getColorForValue]);

  useEffect(() => {
    if (!featureGroupRef.current || !polygons.length) return;

    const validPolygons = polygons.filter(
      (p): p is PolygonFeature => !!p && Array.isArray(p.paths)
    );
    if (validPolygons.length === 0) return;

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
            polygons.map(p =>
              updated.find(u => u.id === p?.id) || p
            )
          );
        }
      } catch (error) {
        console.error('Error updating polygons:', error);
      }
    };

    updateAll();
  }, [selectedTime, endDate, mode, polygons, updatePolygonData, onPolygonsUpdate]);

  return null;
};

export default PolygonRenderer;