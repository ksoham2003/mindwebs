'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays, addHours, differenceInHours, addDays } from 'date-fns';
import { TimelineSlider } from '@/components/TimeSlider';
import { DataChart } from '@/components/DataChart';
import { DataSourceSidebar } from '@/components/DataSourceSidebar';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PolygonFeature, TimeSelectionMode, WeatherDataPoint, DataSource } from '@/types';

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
      color: '#3b82f6',
      field: 'temperature_2m',
      rules: [
        { operator: '<', value: 10, color: '#ef4444' },
        { operator: '<', value: 20, color: '#f59e0b' },
        { operator: '<', value: 30, color: '#3b82f6' },
        { operator: '>=', value: 30, color: '#10b981' }
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

  // Format dates ensuring they're within valid range
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const selectedTime = addHours(startDate, sliderValue[0]);
  const selectedEndTime = addHours(startDate, sliderValue[sliderValue.length - 1]);

  const fetchWeatherData = useCallback(async (): Promise<void> => {
  setIsLoading(true);
  try {
    const today = new Date();
    const endDate = subDays(today, 1); // Yesterday (last available date)
    const startDate = subDays(endDate, 14); // 15-day window

    const cacheKey = `weather-${latitude}-${longitude}-${format(startDate, 'yyyy-MM-dd')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      setWeatherData(JSON.parse(cachedData));
      return;
    }

    try {
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&hourly=temperature_2m`
      );

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();

      const chartData: WeatherDataPoint[] = data.hourly.time.map((time: string, index: number) => ({
        time: format(new Date(time), 'MMM d HH:mm'),
        temperature: data.hourly.temperature_2m[index],
      }));

      localStorage.setItem(cacheKey, JSON.stringify(chartData));
      setWeatherData(chartData);
      console.log('Weather data fetched and cached:', chartData);
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

console.log(fetchWeatherData)

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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <DataSourceSidebar
                dataSources={dataSources}
                onDataSourceChange={handleDataSourceChange}
                onPolygonColorUpdate={handlePolygonColorUpdate}
              />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <TimelineSlider
                mode={mode}
                value={sliderValue}
                onChange={handleSliderChange}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-4">
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

                <div className="space-y-4">
                  <DataChart
                    title={mode === 'single' ? 'Current Temperature' : 'Temperature Range'}
                    data={filteredWeatherData()}
                    type={mode === 'single' ? 'bar' : 'line'}
                    xAxisKey="time"
                    yAxisKey="temperature"
                  />

                  {mode === 'range' && averageTemperature() !== null && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold">Range Summary</h3>
                      <p className="text-muted-foreground">
                        Average temperature: {averageTemperature()?.toFixed(1)}°C
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}