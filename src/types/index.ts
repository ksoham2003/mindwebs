export interface LatLng {
  lat: number;
  lng: number;
}

export interface PolygonFeature {
  id: string;
  paths: LatLng[];
  label: string;
  dataSourceId: string;
  properties: {
    createdAt: string;
    timeRange?: string;
    color?: string;
    value?: number;
  };
}

export interface MapViewProps {
  latitude: number;
  longitude: number;
  onPolygonComplete: (polygon: PolygonFeature) => void;
  polygons?: PolygonFeature[];
  selectedTime: string;
  dataSources: DataSource[];
  mode: 'single' | 'range';
  endDate?: string;
}

export type TimeSelectionMode = 'single' | 'range';

export interface TimeSliderProps {
  mode: TimeSelectionMode;
  onChange: (value: number[]) => void;
  value: number[];
}

export interface WeatherDataPoint {
  time: string;
  temperature: number;
}

export type ChartType = 'bar' | 'line' | 'area';

export interface DataChartProps {
  data: WeatherDataPoint[];
  type?: ChartType;
  title?: string;
  xAxisKey: keyof WeatherDataPoint;
  yAxisKey: keyof WeatherDataPoint;
  color?: string;
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

export interface DataSource {
  id: string;
  name: string;
  color: string;
  field: string;
  rules: {
    operator: '<' | '<=' | '=' | '>=' | '>';
    value: number;
    color: string;
  }[];
  isRemovable?: boolean;
}

declare module 'leaflet' {
  interface IconOptions {
    _getIconUrl?: string;
  }
}

import type { Feature, Polygon as GeoJSONPolygon } from 'geojson';
import * as L from 'leaflet';

export interface CustomPolygonLayer extends L.Polygon {
  feature?: Feature<GeoJSONPolygon, {
    id: string;
    createdAt: string;
    color?: string;
    dataSourceId?: string;
    value?: number;
    label?: string;
    timeRange?: string;
  }>;
}