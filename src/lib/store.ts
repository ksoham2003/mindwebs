import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, subDays, addHours } from 'date-fns';
import { 
  PolygonFeature, 
  DataSource, 
  TimeSelectionMode, 
  WeatherDataPoint 
} from '@/types';

interface AppState {
  mode: TimeSelectionMode;
  polygons: PolygonFeature[];
  weatherData: WeatherDataPoint[];
  isLoading: boolean;
  dataSources: DataSource[];
  sliderValue: number[];
  latitude: number;
  longitude: number;
  averageTemperature: () => number | null;
  filteredWeatherData: WeatherDataPoint[];
  
  selectedTime: Date;
  selectedEndTime: Date;
  
  setMode: (mode: TimeSelectionMode) => void;
  setPolygons: (polygons: PolygonFeature[]) => void;
  setWeatherData: (weatherData: WeatherDataPoint[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setDataSources: (dataSources: DataSource[]) => void;
  setSliderValue: (sliderValue: number[]) => void;
  addPolygon: (polygon: PolygonFeature) => void;
  removePolygon: (polygonId: string) => void;
  updatePolygon: (polygonId: string, updates: Partial<PolygonFeature>) => void;
  fetchWeatherData: () => Promise<void>;
}

const today = new Date();
const endDate = subDays(today, 1);
const startDate = subDays(endDate, 14);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mode: 'single',
      polygons: [],
      weatherData: [],
      isLoading: false,
      dataSources: [
        {
          id: 'open-meteo',
          name: 'Open-Meteo Temperature',
          color: '#3b82f6',
          field: 'temperature_2m',
          rules: [
            { operator: '<', value: 10, color: '#ef4444' },
            { operator: '<', value: 25, color: '#3b82f6' },
            { operator: '>=', value: 25, color: '#10b981' }
          ],
          isRemovable: false
        }
      ],
      sliderValue: [0, 24],
      latitude: 22.5726,
      longitude: 88.3639,
      
      get selectedTime() {
        return addHours(startDate, get().sliderValue[0]);
      },
      get selectedEndTime() {
        return addHours(startDate, get().sliderValue[get().sliderValue.length - 1]);
      },

      averageTemperature: () => {
        if (get().mode !== 'range') return null;
        const data = get().weatherData.filter(d => {
          const date = new Date(d.time);
          return date >= get().selectedTime && date <= get().selectedEndTime;
        });
        if (!data.length) return null;
        return data.reduce((sum, point) => sum + point.temperature, 0) / data.length;
      },
      
      get filteredWeatherData() {
        return get().weatherData.filter(d => {
          const date = new Date(d.time);
          return date >= get().selectedTime && 
                 (get().mode === 'single' || date <= get().selectedEndTime);
        });
      },
      
      setMode: (mode) => set({ mode }),
      setPolygons: (polygons) => set({ polygons }),
      setWeatherData: (weatherData) => set({ weatherData }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setDataSources: (dataSources) => set({ dataSources }),
      setSliderValue: (sliderValue) => set({ sliderValue }),
      addPolygon: (polygon) => set((state) => ({ polygons: [...state.polygons, polygon] })),
      removePolygon: (polygonId) => 
        set((state) => ({ polygons: state.polygons.filter(p => p.id !== polygonId) })),
      updatePolygon: (polygonId, updates) =>
        set((state) => ({
          polygons: state.polygons.map(p => 
            p.id === polygonId ? { ...p, ...updates } : p
          )
        })),
      
      fetchWeatherData: async () => {
        const { latitude, longitude, setIsLoading, setWeatherData } = get();
        setIsLoading(true);
        
        try {
          const cacheKey = `weather-${latitude}-${longitude}-${format(startDate, 'yyyy-MM-dd')}`;
          const cachedData = localStorage.getItem(cacheKey);

          if (cachedData) {
            setWeatherData(JSON.parse(cachedData));
            return;
          }

          try {
            const response = await fetch(
              `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&hourly=temperature_2m,relativehumidity_2m,precipitation`
            );

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const data = await response.json();
            const chartData = data.hourly.time.map((time: string, index: number) => ({
              time: format(new Date(time), 'MMM d HH:mm'),
              temperature: data.hourly.temperature_2m[index],
              humidity: data.hourly.relativehumidity_2m[index],
              precipitation: data.hourly.precipitation[index]
            }));

            localStorage.setItem(cacheKey, JSON.stringify(chartData));
            setWeatherData(chartData);
          } catch (apiError) {
            console.warn('API request failed, using mock data:', apiError);
            const mockData = generateMockWeatherData(startDate, addDays(startDate, 15));
            setWeatherData(mockData);
          }
        } catch (error) {
          console.error('Error fetching weather data:', error);
          const mockData = generateMockWeatherData(subDays(new Date(), 15), new Date());
          setWeatherData(mockData);
        } finally {
          setIsLoading(false);
        }
      }
    }),
    {
      name: 'environmental-dashboard-storage',
      partialize: (state) => ({ 
        polygons: state.polygons,
        dataSources: state.dataSources,
        sliderValue: state.sliderValue,
        mode: state.mode
      })
    }
  )
);

function generateMockWeatherData(startDate: Date, endDate: Date): WeatherDataPoint[] {
  const hours = differenceInHours(endDate, startDate);
  return Array.from({ length: hours }, (_, i) => {
    const date = addHours(startDate, i);
    return {
      time: format(date, 'MMM d HH:mm'),
      temperature: 20 + 10 * Math.sin(i / 24 * Math.PI * 2) + (Math.random() * 4 - 2)
    };
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function differenceInHours(dateLeft: Date, dateRight: Date): number {
  return (dateLeft.getTime() - dateRight.getTime()) / (1000 * 60 * 60);
}