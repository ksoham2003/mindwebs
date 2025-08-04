'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays, addHours, differenceInHours } from 'date-fns';
import { TimelineSlider } from '@/components/TimeSlider';
import { DataChart } from '@/components/DataChart';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PolygonFeature, TimeSelectionMode, WeatherDataPoint, OpenMeteoResponse } from '@/types';

export default function Dashboard() {
  const [mode, setMode] = useState<TimeSelectionMode>('single');
  const [polygons, setPolygons] = useState<PolygonFeature[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherDataPoint[]>([]);
  const [, setIsLoading] = useState<boolean>(false);

  const [sliderValue, setSliderValue] = useState<number[]>([0, 24]); // Default to 24-hour range 
  const MapView = dynamic(() =>
    import('@/components/MapView').then((mod) => mod.MapView), { ssr: false });

  const [latitude,] = useState<number>(22.5726);
  const [longitude,] = useState<number>(88.3639);
  // const totalHours = differenceInHours(endDate, startDate);

  // Update the initial state and date calculations
  const now = new Date();
  const startDate = subDays(now, 15);
  const endDate = now; // Only use current date, not future dates
  const totalHours = differenceInHours(endDate, startDate);

  const selectedTime = addHours(startDate, sliderValue[0]);

  // Update the fetchWeatherData function
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate valid date range (past 15 days only, as API doesn't support future dates)
      const endDate = new Date();
      const startDate = subDays(endDate, 15);

      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&hourly=temperature_2m`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.hourly || !data.hourly.time || !data.hourly.temperature_2m) {
        throw new Error('Invalid data structure from API');
      }

      const chartData: WeatherDataPoint[] = data.hourly.time.map((time: string, index: number) => ({
        time: format(new Date(time), 'MMM d HH:mm'),
        temperature: data.hourly.temperature_2m[index],
      }));

      setWeatherData(chartData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Set default/fallback data
      setWeatherData([]);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);



  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handlePolygonComplete = useCallback((polygon: PolygonFeature) => {
  setPolygons((prev) => [...prev, polygon]);
}, []);



  const handleSliderChange = useCallback((value: number[]) => {
    if (mode === 'single') {
      setSliderValue([value[0]]);
    } else {
      // Ensure we always have [start, end] values
      if (value.length === 1) {
        setSliderValue([value[0], value[0] + 24]);
      } else {
        setSliderValue([value[0], value[1]]);
      }
    }
  }, [mode]);

  const filteredWeatherData = useCallback(() => {
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

  // Calculate average temperature for the range
  const averageTemperature = useCallback(() => {
    if (filteredWeatherData().length === 0) return null;
    const sum = filteredWeatherData().reduce((acc, curr) => acc + curr.temperature, 0);
    return sum / filteredWeatherData().length;
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

          {/* Mode selector */}
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

          {/* Timeline slider */}
          <TimelineSlider
            mode={mode}
            value={sliderValue}
            onChange={handleSliderChange}
          />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map view */}
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
                  />
                </div>
              </Card>
            </div>

            {/* Data charts */}
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
  );
}