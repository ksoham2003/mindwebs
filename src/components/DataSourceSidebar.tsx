
'use client';
import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { DataSource, ColorRule, ComparisonOperator } from '@/types';

export const DataSourceSidebar = () => {
  const { dataSources, setDataSources } = useAppStore();
  const [newRuleValue, setNewRuleValue] = useState<string>('');
  const [newRuleOperator, setNewRuleOperator] = useState<ComparisonOperator>('<');
  const [newRuleColor, setNewRuleColor] = useState<string>('#3b82f6');
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceColor, setNewSourceColor] = useState<string>('#3b82f6');
  const [newSourceField, setNewSourceField] = useState<string>('temperature_2m');

  const handleAddRule = (sourceId: string) => {
    const value = parseFloat(newRuleValue);
    if (isNaN(value)) return;

    const updated = dataSources.map(source => {
      if (source.id === sourceId) {
        const newRule: ColorRule = {
          operator: newRuleOperator,
          value,
          color: newRuleColor
        };
        return {
          ...source,
          rules: [...source.rules, newRule].sort((a, b) => a.value - b.value)
        };
      }
      return source;
    });

    setDataSources(updated);
    setNewRuleValue('');
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

    setDataSources(updated);
  };

  const handleFieldChange = (sourceId: string, field: string) => {
    const updated = dataSources.map(source => {
      if (source.id === sourceId) {
        return { ...source, field };
      }
      return source;
    });
    setDataSources(updated);
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

    setDataSources([...dataSources, newSource]);
    setNewSourceName('');
    setNewSourceColor('#3b82f6');
    setNewSourceField('temperature_2m');
  };

  const handleRemoveDataSource = (sourceId: string) => {
    if (dataSources.find(ds => ds.id === sourceId)?.isRemovable === false) {
      return;
    }
    setDataSources(dataSources.filter(ds => ds.id !== sourceId));
  };

  return (
    <Card className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
      
      <div className="mb-6 space-y-2">
        <h3 className="text-sm font-medium">Add New Data Source</h3>
        <div className="flex gap-2">
          <Input
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="Source name"
            className="flex-1"
          />
          <Input
            type="color"
            value={newSourceColor}
            onChange={(e) => setNewSourceColor(e.target.value)}
            className="w-10 h-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={newSourceField} onValueChange={setNewSourceField}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temperature_2m">Temperature</SelectItem>
              <SelectItem value="relativehumidity_2m">Humidity</SelectItem>
              <SelectItem value="precipitation">Precipitation</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddDataSource} className="gap-1">
            <Plus size={16} />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {dataSources.map(source => (
          <div key={source.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
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
                  onClick={() => handleRemoveDataSource(source.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Field</label>
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

            <div className="space-y-2">
              <label className="block text-sm font-medium">Color Rules</label>
              
              {source.rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rules defined</p>
              ) : (
                <div className="space-y-1">
                  {source.rules.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: rule.color }}
                        />
                        <span className="text-sm">
                          {rule.operator} {rule.value}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveRule(source.id, i)}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Minus size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <div className="flex gap-2 mb-2">
                  <Select 
                    value={newRuleOperator} 
                    onValueChange={(value: ComparisonOperator) => setNewRuleOperator(value)}
                  >
                    <SelectTrigger>
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
                    className="w-20"
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
                  className="w-full gap-1"
                >
                  <Plus size={14} />
                  Add Rule
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};