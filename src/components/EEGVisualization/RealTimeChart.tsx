import { useEffect, useRef, useState } from 'react';

interface RealTimeChartProps {
  data: Float32Array[];  // Array of channel data
  sampleRate: number;    // Samples per second
  timeWindow: number;    // Time window in seconds
  channels: string[];    // Channel names
  className?: string;
}

export default function RealTimeChart({ 
  data, 
  sampleRate, 
  timeWindow, 
  channels, 
  className = '' 
}: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawChart = () => {
      // Canvas 크기 설정
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      if (data.length === 0) return;

      const channelHeight = height / data.length;
      const samplesPerWindow = Math.floor(sampleRate * timeWindow);
      
      data.forEach((channelData, channelIndex) => {
        const yOffset = channelIndex * channelHeight + channelHeight / 2;
        
        // 채널 라벨
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.fillText(channels[channelIndex] || `CH${channelIndex + 1}`, 10, yOffset - channelHeight / 2 + 15);
        
        // 중앙선
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        ctx.lineTo(width, yOffset);
        ctx.stroke();
        
        // 신호 데이터 그리기
        if (channelData.length > 0) {
          ctx.strokeStyle = getChannelColor(channelIndex);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          
          const step = width / Math.min(channelData.length, samplesPerWindow);
          const amplitudeScale = (channelHeight * 0.4) / 100; // 100μV 기준으로 스케일링
          
          for (let i = 0; i < Math.min(channelData.length, samplesPerWindow); i++) {
            const x = i * step;
            const y = yOffset - (channelData[i] * amplitudeScale);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.stroke();
        }
        
        // 채널 구분선
        if (channelIndex < data.length - 1) {
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, (channelIndex + 1) * channelHeight);
          ctx.lineTo(width, (channelIndex + 1) * channelHeight);
          ctx.stroke();
        }
      });

      // 시간 축
      drawTimeAxis(ctx, width, height, timeWindow);
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawChart);
      }
    };

    if (isPlaying) {
      drawChart();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, sampleRate, timeWindow, channels, isPlaying]);

  const getChannelColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red  
      '#10b981', // green
      '#f59e0b', // yellow
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
      '#84cc16'  // lime
    ];
    return colors[index % colors.length];
  };

  const drawTimeAxis = (ctx: CanvasRenderingContext2D, width: number, height: number, timeWindow: number) => {
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    
    for (let i = 0; i <= 5; i++) {
      const x = (width * i) / 5;
      const time = (timeWindow * i) / 5;
      
      // 세로선
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // 시간 라벨
      ctx.fillText(`${time.toFixed(1)}s`, x + 2, height - 5);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-time EEG</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {sampleRate}Hz | {timeWindow}s window
          </span>
          <button
            onClick={togglePlayPause}
            className="px-3 py-1 text-sm bg-brain-100 text-brain-700 rounded-md hover:bg-brain-200 transition-colors"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-gray-200 rounded-md"
          style={{ height: '16rem' }}
        />
        
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-500">No EEG data available</p>
              <p className="text-sm text-gray-400">Connect device to start recording</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 범례 */}
      {data.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {channels.map((channel, index) => (
            <div key={channel} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getChannelColor(index) }}
              />
              <span className="text-sm text-gray-600">{channel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 