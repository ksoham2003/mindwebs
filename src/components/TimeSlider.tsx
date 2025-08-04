'use client';

import React, { useEffect } from 'react';
import { format, subDays, addDays, differenceInHours, addHours } from 'date-fns';
import { Slider } from './ui/slider';
import { Card } from './ui/card';

interface TimelineSliderProps {
  mode: 'single' | 'range';
  onChange: (value: number[]) => void;
  value: number[];
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ mode, onChange, value }) => {
  const now = new Date();
  const startDate = subDays(now, 15);
  const endDate = addDays(now, 15);
  const totalHours = differenceInHours(endDate, startDate);

  // Generate tick marks for every 3 days
  const tickMarks = Array.from({ length: 6 }, (_, i) => i * 3 * 24);

  // Handle mode changes
  useEffect(() => {
    if (mode === 'range' && value.length === 1) {
      onChange([value[0], Math.min(value[0] + 24, totalHours)]); // Default 24h range
    } else if (mode === 'single' && value.length > 1) {
      onChange([value[0]]);
    }
  }, [mode, onChange, totalHours, value]);

  const formatTime = (hours: number): string => {
    const date = addHours(startDate, hours);
    return format(date, 'MMM d, HH:mm');
  };

  const handleValueChange = (newValue: number[]) => {
    if (mode === 'single') {
      onChange([newValue[0]]);
    } else {
      // Ensure valid range (start <= end)
      const [start, end] = newValue.length === 2 
        ? [Math.min(newValue[0], newValue[1]), Math.max(newValue[0], newValue[1])]
        : [newValue[0], newValue[0] + 24];
      onChange([start, end]);
    }
  };

  const currentStartTime = addHours(startDate, value[0]);
  const currentEndTime = addHours(startDate, value[value.length - 1]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Timeline Control</h3>
          <div className="text-sm text-muted-foreground">
            {mode === 'single' ? (
              <span>Selected: {format(currentStartTime, 'MMM d, yyyy HH:mm')}</span>
            ) : (
              <span>
                Range: {format(currentStartTime, 'MMM d HH:mm')} - {format(currentEndTime, 'MMM d HH:mm')}
              </span>
            )}
          </div>
        </div>

        {/* Main Slider */}
        <div className="relative">
          <Slider
            min={0}
            max={totalHours}
            step={1} // Hourly resolution
            value={mode === 'single' ? [value[0]] : value}
            onValueChange={handleValueChange}
            minStepsBetweenThumbs={mode === 'single' ? 0 : 1}
            className="w-full"
          />

          {/* Time markers */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {tickMarks.map((hour) => (
              <div key={hour} className="flex flex-col items-center">
                <span>{format(addHours(startDate, hour), 'MMM d')}</span>
                <span className="mt-1 w-px h-2 bg-border" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onChange(mode === 'single' 
              ? [differenceInHours(now, startDate)] 
              : [0, totalHours]
            )}
            className="px-3 py-1 text-xs border rounded hover:bg-accent"
          >
            {mode === 'single' ? 'Jump to Now' : 'Show All'}
          </button>
          {mode === 'range' && (
            <>
              <button
                onClick={() => onChange([
                  Math.max(0, value[0] - 24),
                  Math.min(totalHours, value[1] - 24)
                ])}
                className="px-3 py-1 text-xs border rounded hover:bg-accent"
              >
                ← Previous Day
              </button>
              <button
                onClick={() => onChange([
                  Math.max(0, value[0] + 24),
                  Math.min(totalHours, value[1] + 24)
                ])}
                className="px-3 py-1 text-xs border rounded hover:bg-accent"
              >
                Next Day →
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};