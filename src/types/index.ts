// // Map-related types
// export interface Coordinate {
//   lng: number;
//   lat: number;
// }

// export interface PolygonFeature {
//   type: 'Feature';
//   geometry: {
//     type: 'Polygon';
//     coordinates: Coordinate[][];
//   };
//   properties: {
//     id: string;
//     createdAt: string;
//     color?: string;
//     dataSource?: string;
//     timeRange?: Date | { start: Date; end: Date };
//   };
// }

// export interface MapViewProps {
//   latitude: number;
//   longitude: number;
//   onPolygonComplete?: (polygon: PolygonFeature) => void;
//   polygons?: PolygonFeature[];
//   selectedTime?: Date;
// }

// // Time Slider types
// export type TimeSelectionMode = 'single' | 'range';

// export interface TimeSliderProps {
//   mode: TimeSelectionMode;
//   onChange: (value: number[]) => void;
//   value: number[];
// }

// // Chart Data types
// export interface WeatherDataPoint {
//   time: string;
//   temperature: number;
// }

// export type ChartType = 'bar' | 'line' | 'area';

// export interface DataChartProps {
//   data: WeatherDataPoint[];
//   type?: ChartType;
//   title?: string;
//   xAxisKey: keyof WeatherDataPoint;
//   yAxisKey: keyof WeatherDataPoint;
//   color?: string;
// }

// // API Response types
// export interface OpenMeteoResponse {
//   latitude: number;
//   longitude: number;
//   generationtime_ms: number;
//   utc_offset_seconds: number;
//   timezone: string;
//   timezone_abbreviation: string;
//   elevation: number;
//   hourly_units: {
//     time: string;
//     temperature_2m: string;
//   };
//   hourly: {
//     time: string[];
//     temperature_2m: number[];
//   };
// }

// export interface Coordinate {
//   lng: number;
//   lat: number;
// }

// export interface PolygonFeature {
//   type: 'Feature';
//   geometry: {
//     type: 'Polygon';
//     coordinates: Coordinate[][];
//   };
//   properties: {
//     id: string;
//     createdAt: string;
//     color?: string;
//     dataSource?: string;
//     timeRange?: Date | { start: Date; end: Date };
//   };
// }

// export interface MapViewProps {
//   latitude: number;
//   longitude: number;
//   onPolygonComplete?: (polygon: PolygonFeature) => void;
//   polygons?: PolygonFeature[];
//   selectedTime?: Date;
// }


// Map-related types
export interface LatLng {
  lat: number;
  lng: number;
}

// Update the PolygonFeature interface in index.ts
export interface PolygonFeature {
  id: string;
  paths: LatLng[];
  label: string;
  properties?: {
    createdAt?: string;
    timeRange?: string;
    color?: string;
  };
}

export interface MapViewProps {
  latitude: number;
  longitude: number;
  onPolygonComplete: (polygon: PolygonFeature) => void;
  polygons?: PolygonFeature[];
  selectedTime: string;
}


// Time Slider types
export type TimeSelectionMode = 'single' | 'range';

export interface TimeSliderProps {
  mode: TimeSelectionMode;
  onChange: (value: number[]) => void;
  value: number[];
}

// Chart Data types
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

// API Response types
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

// Leaflet-specific types
declare module 'leaflet' {
  interface IconOptions {
    _getIconUrl?: string;
  }
}

export interface DataSource {
  id: string;
  name: string;
  color: string;
  rules: {
    operator: '<' | '<=' | '=' | '>=' | '>';
    value: number;
    color: string;
  }[];
}
