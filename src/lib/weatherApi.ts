import { LatLng } from '@/types';

const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';

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

export const fetchWeatherData = async (
  location: LatLng,
  startDate: Date,
  endDate: Date,
  fields: string[]
): Promise<WeatherApiResponse> => {
  const params = new URLSearchParams({
    latitude: location.lat.toString(),
    longitude: location.lng.toString(),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    hourly: fields.join(','),
    timezone: 'auto'
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }
  return response.json();
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};