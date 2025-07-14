import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ChannelData {
  timestamp: number;
  value: number;
}

interface EEGData {
  channels: {
    FP1: ChannelData[];
    FP2: ChannelData[];
  };
}

interface PPGData {
  channels: {
    RED: ChannelData[];
    IR: ChannelData[];
  };
}

interface ACCData {
  channels: {
    X: ChannelData[];
    Y: ChannelData[];
    Z: ChannelData[];
    MAGNITUDE: ChannelData[];
  };
}

interface MiniChartsProps {
  eegData: EEGData | null;
  ppgData: PPGData | null;
  accData: ACCData | null;
}

export default function MiniCharts({ eegData, ppgData, accData }: MiniChartsProps) {
  // EEG 데이터 통합 (FP1 + FP2)
  const prepareEEGData = () => {
    if (!eegData || !eegData.channels.FP1.length || !eegData.channels.FP2.length) {
      return [];
    }
    
    const maxLength = Math.min(eegData.channels.FP1.length, eegData.channels.FP2.length, 50);
    return eegData.channels.FP1.slice(-maxLength).map((fp1, index) => {
      const fp2 = eegData.channels.FP2[eegData.channels.FP2.length - maxLength + index];
      return {
        timestamp: fp1.timestamp,
        combined: (fp1.value + fp2.value) / 2
      };
    });
  };

  // PPG 데이터 통합 (RED + IR)
  const preparePPGData = () => {
    if (!ppgData || !ppgData.channels.RED.length || !ppgData.channels.IR.length) {
      return [];
    }
    
    const maxLength = Math.min(ppgData.channels.RED.length, ppgData.channels.IR.length, 50);
    return ppgData.channels.RED.slice(-maxLength).map((red, index) => {
      const ir = ppgData.channels.IR[ppgData.channels.IR.length - maxLength + index];
      return {
        timestamp: red.timestamp,
        red: red.value,
        ir: ir.value
      };
    });
  };

  // ACC 데이터 준비 (막대그래프용)
  const prepareACCData = () => {
    if (!accData || !accData.channels.X.length) {
      return [
        { axis: 'X', value: 0 },
        { axis: 'Y', value: 0 },
        { axis: 'Z', value: 0 }
      ];
    }
    
    const latest = {
      x: accData.channels.X[accData.channels.X.length - 1]?.value || 0,
      y: accData.channels.Y[accData.channels.Y.length - 1]?.value || 0,
      z: accData.channels.Z[accData.channels.Z.length - 1]?.value || 0
    };
    
    return [
      { axis: 'X', value: Math.abs(latest.x) },
      { axis: 'Y', value: Math.abs(latest.y) },
      { axis: 'Z', value: Math.abs(latest.z) }
    ];
  };

  const eegChartData = prepareEEGData();
  const ppgChartData = preparePPGData();
  const accChartData = prepareACCData();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* EEG 미니 차트 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h5 className="text-xs font-medium text-gray-600 mb-2">EEG (FP1+FP2)</h5>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eegChartData}>
              <Line 
                type="monotone" 
                dataKey="combined" 
                stroke="#3b82f6" 
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PPG 미니 차트 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h5 className="text-xs font-medium text-gray-600 mb-2">PPG (IR+RED)</h5>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ppgChartData}>
              <Line 
                type="monotone" 
                dataKey="red" 
                stroke="#ef4444" 
                strokeWidth={1}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ir" 
                stroke="#dc2626" 
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACC 막대 차트 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h5 className="text-xs font-medium text-gray-600 mb-2">ACC (3축)</h5>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accChartData}>
              <XAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 