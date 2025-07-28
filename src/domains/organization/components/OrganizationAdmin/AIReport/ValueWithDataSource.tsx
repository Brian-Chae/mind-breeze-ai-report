import React from 'react';
import { DataSourceIndicator } from './DataSourceIndicator';

interface ValueWithDataSourceProps {
  value: number;
  metricName: string;
  metricType: 'eeg' | 'ppg' | 'acc';
  formatValue: (value: any, decimals?: number) => string;
  decimals?: number;
}

export const ValueWithDataSource: React.FC<ValueWithDataSourceProps> = ({
  value,
  metricName,
  metricType,
  formatValue,
  decimals = 2
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <span>{formatValue(value, decimals)}</span>
      <DataSourceIndicator 
        value={value} 
        metricName={metricName} 
        metricType={metricType} 
      />
    </div>
  );
};