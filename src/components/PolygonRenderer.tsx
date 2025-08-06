
'use client';
import { useEffect, useCallback, useRef } from 'react';
import * as L from 'leaflet';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { calculateCentroid, getColorForValue } from '@/lib/utils';
import { fetchWeatherData } from '@/lib/weatherApi';
import type { PolygonFeature } from '@/types';

const PolygonRenderer = ({ featureGroupRef }: { featureGroupRef: React.RefObject<L.FeatureGroup> }) => {
  const {
    polygons,
    selectedTime,
    dataSources,
    mode,
    selectedEndTime,
    updatePolygon,
    sliderValue
  } = useAppStore();

  const prevSliderValue = useRef<number[] | undefined>(undefined);

  const getFieldUnit = (field: string): string => {
    switch(field) {
      case 'temperature_2m': return '°C';
      case 'relativehumidity_2m': return '%';
      case 'precipitation': return 'mm';
      default: return '';
    }
  };

  const fetchPolygonData = useCallback(async (
    polygon: PolygonFeature,
    currentTime: Date,
    endTime?: Date
  ): Promise<number | null> => {
    const source = dataSources.find(ds => ds.id === polygon.dataSourceId);
    if (!source) return null;

    try {
      const centroid = calculateCentroid(polygon.paths);
      const data = await fetchWeatherData(
        centroid,
        currentTime,
        endTime || currentTime,
        [source.field]
      );

      const values = data.hourly[source.field as keyof typeof data.hourly] as number[];
      const times = data.hourly.time;

      const filteredValues = times
        .map((timeStr: string, i: number) => {
          const time = new Date(timeStr);
          const isInRange = endTime 
            ? time >= currentTime && time <= endTime
            : Math.abs(time.getTime() - currentTime.getTime()) < 3600000; 
          return isInRange ? values[i] : null;
        })
        .filter((v): v is number => v !== null);

      if (filteredValues.length === 0) return null;

      return mode === 'range' && endTime
        ? filteredValues.reduce((sum: number, v: number) => sum + v, 0) / filteredValues.length
        : filteredValues[0];
    } catch (error: unknown) {
      toast(`Failed to fetch data for polygon ${polygon.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, [dataSources, mode]);

  const updatePolygonVisuals = useCallback(async (polygon: PolygonFeature) => {
    const currentTime = new Date(selectedTime);
    const endTime = mode === 'range' && selectedEndTime ? new Date(selectedEndTime) : undefined;
    
    const value = await fetchPolygonData(polygon, currentTime, endTime);
    if (value === null) return;

    const source = dataSources.find(ds => ds.id === polygon.dataSourceId);
    if (!source) return;

    const color = getColorForValue(value, source.rules, source.color);
if (featureGroupRef.current) {
  featureGroupRef.current.eachLayer((layer: L.Layer) => {
    const polyLayer = layer as L.Polygon & { feature?: { properties?: { id: string } } };
    if (polyLayer.feature?.properties?.id === polygon.id) {
      
      polyLayer.setStyle({
        color: color,         
        fillColor: color,     
        weight: 2,           
        fillOpacity: 0.4      
      });

      // Force redraw
      polyLayer.redraw();

      const unit = getFieldUnit(source.field);
      const tooltipContent = `${polygon.label}\n${value.toFixed(1)}${unit}`;
      
      polyLayer.unbindTooltip();
      polyLayer.bindTooltip(tooltipContent, {
        permanent: true,
        direction: 'center'
      });

      console.log('Current layer style:', polyLayer.options);
    }
  });
}

    updatePolygon(polygon.id, {
      properties: {
        ...polygon.properties,
        value,
        color,
        timeRange: endTime
          ? `${format(currentTime, 'MMM d HH:mm')} - ${format(endTime, 'MMM d HH:mm')}`
          : undefined
      }
    });
  }, [dataSources, featureGroupRef, fetchPolygonData, mode, selectedTime, selectedEndTime, updatePolygon]);

  useEffect(() => {
    if (!featureGroupRef.current || polygons.length === 0) return;
    
    if (JSON.stringify(prevSliderValue.current) === JSON.stringify(sliderValue)) return;
    prevSliderValue.current = sliderValue;

    const updateAllPolygons = async () => {
      try {
        await Promise.all(
          polygons.map(polygon => 
            polygon.paths?.length ? updatePolygonVisuals(polygon) : Promise.resolve()
          )
        );
      } catch (error) {
        toast(`Error updating polygons: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    updateAllPolygons();
  }, [sliderValue, polygons, updatePolygonVisuals, featureGroupRef]);

  return null;
};

export default PolygonRenderer;

function toast(message: string) {
  console.log('Toast message:', message);
}
