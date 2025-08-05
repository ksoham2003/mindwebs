
import React from "react";
import { DataChart } from "@/components/DataChart";

interface WeatherDataPoint {
  time: string;
  temperature: number;
}

interface Props {
  data: WeatherDataPoint[];
  startTime?: Date;
  endTime?: Date;
}

export const CurrentTemperatureChart: React.FC<Props> = ({ data, startTime, endTime }) => {
  if (!data || !data.length) return <div>No temperature data available</div>;

  // Filter data based on time range if provided
  const filteredData = startTime && endTime
    ? data.filter(d => {
        const date = new Date(d.time);
        return date >= startTime && date <= endTime;
      })
    : data;

  return (
    <DataChart
      title={startTime && endTime ? 'Selected Time Range Temperature' : 'Temperature Data'}
      data={filteredData}
      type="line"
      xAxisKey="time"
      yAxisKey="temperature"
    />
  );
};
