'use client';
import React, { useEffect, useState } from 'react';
import { format, subDays, addDays, differenceInHours, addHours, isSameDay } from 'date-fns';
import { Slider } from './ui/slider';
import { Card } from './ui/card';

interface TimelineSliderProps {
  mode: 'single' | 'range';
  onChange: (value: number[]) => void;
  value: number[];
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ mode, onChange, value }) => {
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    setNow(new Date()); // Client-side only initialization
  }, []);

  if (!now) return <div className="p-4 h-[180px]" />; // Loading placeholder

  const startDate = subDays(now, 15);
  const endDate = addDays(now, 15);
  const totalHours = differenceInHours(endDate, startDate);

  // Generate tick marks every 5 days
  const tickMarks = Array.from({ length: 7 }, (_, i) => i * 5 * 24);

  const handleValueChange = (newValue: number[]) => {
    if (mode === 'single') {
      onChange([newValue[0]]);
    } else {
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

        <div className="relative">
          {/* Main Slider */}
          <Slider
            min={0}
            max={totalHours}
            step={1} 
            value={mode === 'single' ? [value[0]] : value}
            onValueChange={handleValueChange}
            minStepsBetweenThumbs={1}
            className="w-full [&>span:first-child]:h-2"
          />

          {/* Current Selection Indicator */}
          {mode === 'single' && (
            <div 
              className="absolute top-0 h-2 bg-primary rounded-full"
              style={{
                left: `${(value[0] / totalHours) * 100}%`,
                width: '2px'
              }}
            />
          )}

          {/* Date Tick Marks */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {tickMarks.map((hours, index) => {
              const date = addHours(startDate, hours);
              const isToday = isSameDay(date, now);
              return (
                <div key={index} className="flex flex-col items-center">
                  <span className={isToday ? "font-bold text-primary" : ""}>
                    {format(date, 'MMM d')}
                    {isToday && " (Today)"}
                  </span>
                  <span className="mt-1 w-px h-2 bg-border" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Navigation Buttons */}
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