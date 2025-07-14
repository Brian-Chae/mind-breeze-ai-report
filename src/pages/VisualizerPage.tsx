import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Activity, Brain, BarChart3, LineChart, Settings, Play, Pause, Square, Download } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';

export const VisualizerPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };
  const [isRecording, setIsRecording] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('All');

  const channels = ['All', 'Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4'];
  const visualizationModes = ['Raw EEG', 'Filtered', 'Power Spectrum', 'Band Powers', 'Signal Quality'];

  const mockEEGData = Array.from({ length: 100 }, (_, i) => ({
    time: i,
    fp1: Math.sin(i * 0.1) * 50 + Math.random() * 20,
    fp2: Math.cos(i * 0.1) * 45 + Math.random() * 15,
    f3: Math.sin(i * 0.15) * 40 + Math.random() * 25,
    f4: Math.cos(i * 0.12) * 35 + Math.random() * 18,
  }));

  const handleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <Layout currentSection="visualizer" onSectionChange={handleSectionChange}>
      <div className="h-full p-6 w-full">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            EEG Data Visualizer
          </h1>
          <p className="text-muted-foreground text-lg">
            실시간 EEG 데이터 시각화 및 분석 도구
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recording Controls</h2>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <Badge variant={isRecording ? "default" : "secondary"}>
                {isRecording ? "Recording" : "Stopped"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRecording}
                className={`flex items-center space-x-2 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRecording ? 'Pause' : 'Start'}</span>
              </Button>
              
              <Button variant="outline" className="flex items-center space-x-2">
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </Button>

              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Duration: <span className="text-foreground font-mono">00:02:34</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Samples: <span className="text-foreground font-mono">38,500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Visualization Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Channel Selection</label>
              <select 
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground"
              >
                {channels.map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Visualization Mode</label>
              <select className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground">
                {visualizationModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Time Window</label>
              <select className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground">
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Visualization Area */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Real-time EEG Signals</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mock EEG Chart Area */}
          <div className="bg-muted rounded-lg p-4 h-96 flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">EEG Visualization Chart</p>
              <p className="text-sm text-muted-foreground mt-2">
                {isRecording ? 'Real-time data streaming...' : 'Start recording to view live data'}
              </p>
            </div>
          </div>
        </div>

        {/* Signal Quality and Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Signal Quality */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Signal Quality</h2>
            <div className="space-y-4">
              {channels.slice(1).map((channel) => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{channel}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          Math.random() > 0.7 ? 'bg-green-500' : 
                          Math.random() > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${60 + Math.random() * 40}%` }}
                      ></div>
                    </div>
                    <Badge 
                      variant={Math.random() > 0.7 ? 'default' : Math.random() > 0.4 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {Math.random() > 0.7 ? 'Good' : Math.random() > 0.4 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Real-time Statistics</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Sampling Rate</p>
                  <p className="text-lg font-semibold text-foreground">250 Hz</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Channels</p>
                  <p className="text-lg font-semibold text-foreground">8/8</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Data Rate</p>
                  <p className="text-lg font-semibold text-foreground">2.4 KB/s</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Buffer Usage</p>
                  <p className="text-lg font-semibold text-foreground">45%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequency Analysis */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Frequency Band Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Delta', range: '0.5-4 Hz', power: 45, color: 'bg-blue-500' },
              { name: 'Theta', range: '4-8 Hz', power: 62, color: 'bg-green-500' },
              { name: 'Alpha', range: '8-13 Hz', power: 78, color: 'bg-yellow-500' },
              { name: 'Beta', range: '13-30 Hz', power: 34, color: 'bg-orange-500' },
              { name: 'Gamma', range: '30-100 Hz', power: 23, color: 'bg-red-500' },
            ].map((band) => (
              <div key={band.name} className="text-center p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-foreground">{band.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{band.range}</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${band.color}`}
                    style={{ width: `${band.power}%` }}
                  ></div>
                </div>
                <p className="text-sm font-medium text-foreground">{band.power}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}; 