'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays, addHours, differenceInHours, addDays } from 'date-fns';
import { TimelineSlider } from '@/components/TimeSlider';
import { DataSourceSidebar } from '@/components/DataSourceSidebar';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PolygonFeature, TimeSelectionMode, WeatherDataPoint, DataSource } from '@/types';
import { CurrentTemperatureChart } from '@/components/CurrentTemperatureChart';

const generateMockWeatherData = (startDate: Date, endDate: Date): WeatherDataPoint[] => {
  const hours = differenceInHours(endDate, startDate);
  return Array.from({ length: hours }, (_, i) => {
    const date = addHours(startDate, i);
    return {
      time: format(date, 'MMM d HH:mm'),
      temperature: 20 + 10 * Math.sin(i / 24 * Math.PI * 2) + (Math.random() * 4 - 2)
    };
  });
};

export default function Dashboard() {
  const [mode, setMode] = useState<TimeSelectionMode>('single');
  const [polygons, setPolygons] = useState<PolygonFeature[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherDataPoint[]>([]);
  const [, setIsLoading] = useState<boolean>(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([
  {
    id: 'open-meteo',
    name: 'Open-Meteo Temperature',
    color: '#3b82f6', // default blue
    field: 'temperature_2m',
    rules: [
      { operator: '<', value: 10, color: '#ef4444' }, // red
      { operator: '<', value: 25, color: '#3b82f6' }, // blue
      { operator: '>=', value: 25, color: '#10b981' } // green
    ],
    isRemovable: false
  }
]);

  const [sliderValue, setSliderValue] = useState<number[]>([0, 24]);
  const MapView = dynamic(() =>
    import('@/components/MapView').then((mod) => mod.MapView), { ssr: false });

  const [latitude] = useState<number>(22.5726);
  const [longitude] = useState<number>(88.3639);
  // In your fetchWeatherData function (page.tsx):
  const today = new Date();
  const endDate = subDays(today, 1); // Yesterday (last available date)
  const startDate = subDays(endDate, 14); // 15-day window (including endDate)
  const selectedTime = addHours(startDate, sliderValue[0]);
  const selectedEndTime = addHours(startDate, sliderValue[sliderValue.length - 1]);

  const fetchWeatherData = useCallback(async (): Promise<void> => {
    console.log('Fetching weather data...');

    setIsLoading(true);
    try {
      const today = new Date();
      const endDate = subDays(today, 1); // Yesterday (last available date)
      const startDate = subDays(endDate, 14); // 15-day window

      const cacheKey = `weather-${latitude}-${longitude}-${format(startDate, 'yyyy-MM-dd')}`;
      const cachedData = localStorage.getItem(cacheKey);
       console.log('Cache key:', cacheKey);

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
        const chartData: WeatherDataPoint[] = data.hourly.time.map((time: string, index: number) => ({
          time: format(new Date(time), 'MMM d HH:mm'),
          temperature: data.hourly.temperature_2m[index],
          humidity: data.hourly.relativehumidity_2m[index],
          precipitation: data.hourly.precipitation[index]
        }));

        localStorage.setItem(cacheKey, JSON.stringify(chartData));
        setWeatherData(chartData);
        console.log('Weather data fetch successful');
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
  }, [latitude, longitude]);

  

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handlePolygonComplete = useCallback((polygon: PolygonFeature): void => {
    const polygonWithSource = {
      ...polygon,
      dataSourceId: dataSources[0]?.id || '',
      properties: {
        ...polygon.properties,
        color: dataSources[0]?.color || '#3b82f6'
      }
    };
    setPolygons((prev) => [...prev, polygonWithSource]);
  }, [dataSources]);

  const handleDataSourceChange = useCallback((updatedSources: DataSource[]): void => {
    setDataSources(updatedSources);
    setPolygons(prev => prev.map(polygon => ({
      ...polygon,
      properties: {
        ...polygon.properties,
        color: updatedSources.find(ds => ds.id === polygon.dataSourceId)?.color || '#3b82f6'
      }
    })));
  }, []);

  const handlePolygonColorUpdate = useCallback((): void => {
    setPolygons(prev => [...prev]);
  }, []);

  const handleSliderChange = useCallback((value: number[]): void => {
    if (mode === 'single') {
      setSliderValue([value[0]]);
    } else {
      setSliderValue([value[0], value[1]]);
    }
  }, [mode]);

  const filteredWeatherData = useCallback((): WeatherDataPoint[] => {
    if (mode === 'single') {
      return weatherData.filter((d) => {
        const date = new Date(d.time);
        return date.getTime() === selectedTime.getTime();
      });
    } else {
      const start = addHours(startDate, sliderValue[0]);
      const end = addHours(startDate, sliderValue[1]);
      return weatherData.filter((d) => {
        const date = new Date(d.time);
        return date >= start && date <= end;
      });
    }
  }, [mode, weatherData, selectedTime, sliderValue, startDate]);

  const averageTemperature = useCallback((): number | null => {
    const filteredData = filteredWeatherData();
    if (filteredData.length === 0) return null;
    const sum = filteredData.reduce((acc, curr) => acc + curr.temperature, 0);
    return sum / filteredData.length;
  }, [filteredWeatherData]);

  // In page.tsx
  // Add these useEffect hooks to page.tsx
  useEffect(() => {
    const savedPolygons = localStorage.getItem('saved-polygons');
    const savedDataSources = localStorage.getItem('saved-data-sources');

    if (savedPolygons) {
      setPolygons(JSON.parse(savedPolygons));
    }

    if (savedDataSources) {
      setDataSources(JSON.parse(savedDataSources));
    }
  }, []);

  useEffect(() => {
    if (polygons.length > 0 || dataSources.length > 1) {
      localStorage.setItem('saved-polygons', JSON.stringify(polygons));
      localStorage.setItem('saved-data-sources', JSON.stringify(dataSources));
    }
  }, [polygons, dataSources]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Environmental Data Dashboard</h1>
            <p className="text-muted-foreground">
              Visualize and analyze temporal and spatial data
            </p>
          </header>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="mode">Selection Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {mode === 'single' ? 'Single time point' : 'Time range'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Single</span>
                <Switch
                  id="mode"
                  checked={mode === 'range'}
                  onCheckedChange={(checked) => setMode(checked ? 'range' : 'single')}
                />
                <span className="text-sm">Range</span>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sidebar - takes 3 columns */}
            <div className="lg:col-span-3">
              <DataSourceSidebar
                dataSources={dataSources}
                onDataSourceChange={handleDataSourceChange}
                onPolygonColorUpdate={handlePolygonColorUpdate}
              />
            </div>

            {/* Main content area - takes 9 columns */}
            <div className="lg:col-span-9 space-y-4">
              {/* Timeline slider full width */}
              <TimelineSlider
                mode={mode}
                value={sliderValue}
                onChange={handleSliderChange}
              />

              {/* Map and charts in a 2:1 ratio */}
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                {/* Map - takes 2/3 width (5 cols) */}
                <div className="lg:col-span-5">
                  <Card className="p-4 h-full">
                    <h2 className="text-xl font-semibold mb-4">Spatial Analysis</h2>
                    <div className="h-[500px]">
                      <MapView
                        latitude={latitude}
                        longitude={longitude}
                        onPolygonComplete={handlePolygonComplete}
                        polygons={polygons}
                        selectedTime={selectedTime.toISOString()}
                        dataSources={dataSources}
                        mode={mode}
                        endDate={selectedEndTime.toISOString()}
                        onPolygonsUpdate={setPolygons}
                        
                      />
                    </div>
                  </Card>
                </div>

                {/* Charts - takes 1/3 width (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  {mode === 'range' && averageTemperature() !== null && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold">Range Summary</h3>
                      <p className="text-muted-foreground">
                        Average temperature: {averageTemperature()?.toFixed(1)}°C
                      </p>
                    </Card>
                  )}

                  <CurrentTemperatureChart
                    data={weatherData}
                    startTime={selectedTime}
                    endTime={mode === 'range' ? selectedEndTime : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}