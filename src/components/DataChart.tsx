'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { Card } from './ui/card';
import { DataChartProps, ChartType, WeatherDataPoint } from '@/types';

export const DataChart: React.FC<DataChartProps> = ({
  data,
  type = 'bar',
  title,
  xAxisKey,
  yAxisKey,
  color = '#3b82f6',
}) => {
  const ChartComponent = {
    bar: BarChart,
    line: LineChart,
    area: AreaChart,
  }[type];

  const DataComponent = {
    bar: Bar,
    line: Line,
    area: Area,
  }[type];

  return (
    <Card className="p-4 h-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <DataComponent
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              fill={color}
              fillOpacity={type === 'area' ? 0.4 : 0.8}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};