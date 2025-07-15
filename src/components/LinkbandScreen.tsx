import React, { useState } from 'react';
import { Brain, Bluetooth, Battery, Wifi, Search, RefreshCw, Settings, Activity } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';

export const LinkbandScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);

  const mockDevices = [
    { id: 'LXB-001', name: 'LINK BAND LXB-001', battery: 85, signalQuality: 'Good', status: 'Available' },
    { id: 'LXB-002', name: 'LINK BAND LXB-002', battery: 92, signalQuality: 'Excellent', status: 'Available' },
    { id: 'LXB-003', name: 'LINK BAND LXB-003', battery: 67, signalQuality: 'Fair', status: 'Busy' },
  ];

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  const handleConnect = (deviceId: string) => {
    setConnectedDevice(deviceId);
  };

  const handleDisconnect = () => {
    setConnectedDevice(null);
  };

  return (
    <div className="h-full pl-6 pr-0 py-6">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            LINK BAND Device Management
          </h1>
          <p className="text-muted-foreground text-lg">
            LINK BAND 디바이스를 검색하고 연결하여 EEG 데이터를 수집합니다
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Connection Status</h2>
            <div className="flex items-center space-x-2">
              <Bluetooth className="w-5 h-5 text-blue-500" />
              <Badge variant={connectedDevice ? "default" : "destructive"}>
                {connectedDevice ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>
          
          {connectedDevice ? (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Brain className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">{connectedDevice}</h3>
                    <p className="text-sm text-muted-foreground">Active EEG monitoring device</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <Battery className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Battery</p>
                  <p className="text-xs text-muted-foreground">85%</p>
                </div>
                <div className="text-center">
                  <Wifi className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Signal</p>
                  <p className="text-xs text-muted-foreground">Strong</p>
                </div>
                <div className="text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Quality</p>
                  <p className="text-xs text-muted-foreground">Good</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No device connected</p>
              <p className="text-sm text-muted-foreground">Scan for available LINK BAND devices</p>
            </div>
          )}
        </div>

        {/* Device Scanner */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Device Scanner</h2>
            <Button 
              onClick={handleScan} 
              disabled={isScanning}
              className="flex items-center space-x-2"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan Devices'}</span>
            </Button>
          </div>

          <div className="space-y-3">
            {mockDevices.map((device) => (
              <div key={device.id} className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Brain className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">{device.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Battery className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-muted-foreground">{device.battery}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-muted-foreground">{device.signalQuality}</span>
                        </div>
                        <Badge 
                          variant={device.status === 'Available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={device.status !== 'Available' || connectedDevice === device.id}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => handleConnect(device.id)}
                      disabled={device.status !== 'Available' || connectedDevice === device.id}
                      size="sm"
                    >
                      {connectedDevice === device.id ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Device Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">Hardware Specifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="text-foreground">LINK BAND v2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channels:</span>
                  <span className="text-foreground">8-channel EEG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sampling Rate:</span>
                  <span className="text-foreground">250 Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Battery Life:</span>
                  <span className="text-foreground">8-10 hours</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">Connection Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocol:</span>
                  <span className="text-foreground">Bluetooth 5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Range:</span>
                  <span className="text-foreground">10 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-reconnect:</span>
                  <span className="text-foreground">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Encryption:</span>
                  <span className="text-foreground">AES-256</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="w-6 h-6" />
              <span className="text-sm">Start Recording</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Settings className="w-6 h-6" />
              <span className="text-sm">Device Settings</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6" />
              <span className="text-sm">Calibration</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Brain className="w-6 h-6" />
              <span className="text-sm">Test Signal</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 