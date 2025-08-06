'use client';
import { useAppStore } from '@/lib/store';

export const Legend = () => {
  const { dataSources } = useAppStore();

  return (
    <div className="w-full">
      <h4 className="font-medium text-sm mb-2">Data Sources & Rules</h4>
      <div className="flex flex-wrap gap-4">
        {dataSources.map(source => (
          <div key={source.id} className="flex items-start">
            <div className="flex items-center mr-2">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: source.color }}
              />
              <span className="text-sm font-medium">{source.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {source.rules.length > 0 ? (
                source.rules.map((rule, i) => (
                  <div key={i} className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: rule.color }}
                    />
                    <span>{rule.operator} {rule.value}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No rules defined</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};