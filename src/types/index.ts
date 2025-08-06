import 'leaflet';
import 'leaflet-draw';

declare module 'leaflet' {
  interface Polygon {
    editing: {
      enable(): void;
      disable(): void;
    };
  }

  interface Map {
    _layers: Record<number, Layer>;
  }
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PolygonProperties {
  createdAt: string;
  timeRange?: string;
  color?: string;
  value?: number;
  lastUpdated?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PolygonFeature {
  id: string;
  paths: LatLng[];
  label: string;
  dataSourceId: string;
  properties: PolygonProperties;
}

export interface ColorRule {
  operator: ComparisonOperator;
  value: number;
  color: string;
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
  onPolygonsUpdate?: (updatedPolygons: PolygonFeature[]) => void;
  map?: L.Map;
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
  humidity?: number;
  precipitation?: number;
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
    relativehumidity_2m?: string;
    precipitation?: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m?: number[];
    precipitation?: number[];
  };
}

export type ComparisonOperator = '<' | '<=' | '=' | '>=' | '>';

export interface ColorRule {
  operator: ComparisonOperator;
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  color: string;
  field: string;
  rules: ColorRule[];
  isRemovable?: boolean;
}

import type { Feature, Polygon as GeoJSONPolygon, GeoJsonProperties } from 'geojson';

type ExtendedProperties = {
  id: string;
  createdAt: string;
  color?: string;
  dataSourceId?: string;
  value?: number;
  label?: string;
  timeRange?: string;
};

export type PolygonGeoJSONProperties = GeoJsonProperties & ExtendedProperties;

export interface CustomPolygonLayer extends L.Polygon {
  feature?: Feature<GeoJSONPolygon, PolygonGeoJSONProperties>;
}


export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  hourly: {
    time: string[];
    temperature_2m?: number[];
    relativehumidity_2m?: number[];
    precipitation?: number[];
  };
}

export interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
}

export interface DataSource {
  id: string;
  name: string;
  color: string;
  field: string;
  rules: ColorRule[];
  isRemovable?: boolean;
  apiType?: 'weather' | 'air-quality';
}