'use client';

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataSource } from '@/types';

export const DataSourceSidebar: React.FC<{
  dataSources: DataSource[];
  onDataSourceChange: (updatedSources: DataSource[]) => void;
  onPolygonColorUpdate: (polygonId: string, color: string) => void;
}> = ({ dataSources, onDataSourceChange, onPolygonColorUpdate }) => {
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleOperator, setNewRuleOperator] = useState('<');
  const [newRuleColor, setNewRuleColor] = useState('#3b82f6');

  const handleAddRule = (sourceId: string) => {
    const value = parseFloat(newRuleValue);
    if (isNaN(value)) return;

    const updated = dataSources.map(source => {
      if (source.id === sourceId) {
        return {
          ...source,
          rules: [
            ...source.rules,
            {
              operator: newRuleOperator,
              value,
              color: newRuleColor
            }
          ].sort((a, b) => a.value - b.value) // Sort rules by value
        };
      }
      return source;
    });

    onDataSourceChange(updated);
    setNewRuleValue('');
  };

  return (
    <Card className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
      
      {dataSources.map(source => (
        <div key={source.id} className="mb-6">
          <div className="flex items-center mb-2">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: source.color }}
            />
            <h3 className="font-medium">{source.name}</h3>
          </div>

          <div className="space-y-2 mb-4">
            {source.rules.map((rule, i) => (
              <div key={i} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: rule.color }}
                />
                <span className="text-sm">
                  {rule.operator} {rule.value} → {rule.color}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <Select value={newRuleOperator} onValueChange={setNewRuleOperator}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<">{'<'}</SelectItem>
                <SelectItem value="<=">{'<='}</SelectItem>
                <SelectItem value="=">{'='}</SelectItem>
                <SelectItem value=">=">{'>='}</SelectItem>
                <SelectItem value=">">{'>'}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={newRuleValue}
              onChange={(e) => setNewRuleValue(e.target.value)}
              placeholder="Value"
              className="w-24"
            />

            <Input
              type="color"
              value={newRuleColor}
              onChange={(e) => setNewRuleColor(e.target.value)}
              className="w-10 h-10"
            />
          </div>

          <Button
            size="sm"
            onClick={() => handleAddRule(source.id)}
          >
            Add Rule
          </Button>
        </div>
      ))}
    </Card>
  );
}; 