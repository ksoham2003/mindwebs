'use client';

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataSource } from '@/types';

interface DataSourceSidebarProps {
  dataSources: DataSource[];
  onDataSourceChange: (updatedSources: DataSource[]) => void;
  onPolygonColorUpdate: () => void;
}

export const DataSourceSidebar: React.FC<DataSourceSidebarProps> = ({ 
  dataSources, 
  onDataSourceChange, 
  onPolygonColorUpdate 
}) => {
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleOperator, setNewRuleOperator] = useState('<');
  const [newRuleColor, setNewRuleColor] = useState('#3b82f6');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceColor, setNewSourceColor] = useState('#3b82f6');
  const [newSourceField, setNewSourceField] = useState('temperature_2m');

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
              operator: newRuleOperator as '<' | '<=' | '=' | '>=' | '>',
              value,
              color: newRuleColor
            }
          ].sort((a, b) => a.value - b.value)
        };
      }
      return source;
    });

    onDataSourceChange(updated);
    setNewRuleValue('');
    onPolygonColorUpdate();
  };

  const handleRemoveRule = (sourceId: string, index: number) => {
    const updated = dataSources.map(source => {
      if (source.id === sourceId) {
        return {
          ...source,
          rules: source.rules.filter((_, i) => i !== index)
        };
      }
      return source;
    });

    onDataSourceChange(updated);
    onPolygonColorUpdate();
  };

  const handleFieldChange = (sourceId: string, field: string) => {
    const updated = dataSources.map(source => {
      if (source.id === sourceId) {
        return { ...source, field };
      }
      return source;
    });
    onDataSourceChange(updated);
    onPolygonColorUpdate();
  };

  const handleAddDataSource = () => {
    if (!newSourceName.trim()) return;

    const newSource: DataSource = {
      id: `source-${Date.now()}`,
      name: newSourceName,
      color: newSourceColor,
      field: newSourceField,
      rules: [],
      isRemovable: true
    };

    onDataSourceChange([...dataSources, newSource]);
    setNewSourceName('');
    setNewSourceColor('#3b82f6');
    setNewSourceField('temperature_2m');
  };

  return (
    <Card className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <Input
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="New source name"
            className="flex-1"
          />
          <Input
            type="color"
            value={newSourceColor}
            onChange={(e) => setNewSourceColor(e.target.value)}
            className="w-10 h-10"
          />
          <Select value={newSourceField} onValueChange={setNewSourceField}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temperature_2m">Temperature</SelectItem>
              <SelectItem value="relativehumidity_2m">Humidity</SelectItem>
              <SelectItem value="precipitation">Precipitation</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddDataSource}>
            Add Source
          </Button>
        </div>
      </div>

      {dataSources.map(source => (
        <div key={source.id} className="mb-6 border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: source.color }}
              />
              <h3 className="font-medium">{source.name}</h3>
            </div>
            {source.isRemovable !== false && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDataSourceChange(dataSources.filter(s => s.id !== source.id))}
              >
                Remove
              </Button>
            )}
          </div>

          <div className="mb-2">
            <Select 
              value={source.field}
              onValueChange={(value) => handleFieldChange(source.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature_2m">Temperature</SelectItem>
                <SelectItem value="relativehumidity_2m">Humidity</SelectItem>
                <SelectItem value="precipitation">Precipitation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 mb-4">
            {source.rules.length === 0 && (
              <p className="text-sm text-muted-foreground">No rules defined</p>
            )}
            {source.rules.map((rule, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: rule.color }}
                  />
                  <span className="text-sm">
                    {rule.operator} {rule.value} → {rule.color}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveRule(source.id, i)}
                >
                  ×
                </Button>
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
            className="w-full"
          >
            Add Rule
          </Button>
        </div>
      ))}
    </Card>
  );
};