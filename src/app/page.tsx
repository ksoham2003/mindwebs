'use client';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { TimelineSlider } from '@/components/TimeSlider';
import { DataSourceSidebar } from '@/components/DataSourceSidebar';
import { Card } from '@/components/ui/card';
import { CurrentTemperatureChart } from '@/components/CurrentTemperatureChart';
import { useAppStore } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const MapView = dynamic(() =>
  import('@/components/MapView').then((mod) => mod.MapView), { ssr: false });

export default function Dashboard() {
  const {
    mode,
    weatherData,
    isLoading,
    sliderValue,
    selectedTime,
    selectedEndTime,
    setMode,
    setSliderValue,
    fetchWeatherData,
    averageTemperature
  } = useAppStore();

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handleSliderChange = (newValue: number[]) => {
    if (mode === 'single') {
      setSliderValue([newValue[0]]);
    } else {
      const [start, end] = newValue.length === 2
        ? [Math.min(newValue[0], newValue[1]), Math.max(newValue[0], newValue[1])]
        : [newValue[0], newValue[0] + 24];
      setSliderValue([start, end]);
    }
  };

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
            <div className="lg:col-span-3">
              <DataSourceSidebar />
            </div>

            <div className="lg:col-span-9 space-y-4">
              <TimelineSlider
                mode={mode}
                value={sliderValue}
                onChange={handleSliderChange}
              />

              <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                <div className="lg:col-span-5">
                  <Card className="p-4 h-full">
                    <h2 className="text-xl font-semibold mb-4">Spatial Analysis</h2>
                    <div className="h-[500px]">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Loading map...</p>
                        </div>
                      ) : (
                        <MapView />
                      )}
                    </div>
                  </Card>
                </div>

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