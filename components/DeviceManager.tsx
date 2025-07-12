import React, { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { 
  Bluetooth, 
  Search, 
  Plus, 
  Settings, 
  Battery, 
  Signal,
  CircuitBoard,
  Wifi,
  WifiOff,
  MoreHorizontal,
  Trash2,
  Edit3
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

export function DeviceManager() {
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const connectedDevices = [
    {
      id: "LB001",
      name: "LINK BAND #001",
      mac: "AA:BB:CC:DD:EE:01",
      status: "Connected",
      battery: 87,
      signal: 95,
      firmware: "v1.2.3",
      lastSync: "2 min ago",
      dataRate: "250 Hz"
    },
    {
      id: "LB002", 
      name: "LINK BAND #002",
      mac: "AA:BB:CC:DD:EE:02",
      status: "Connected",
      battery: 56,
      signal: 82,
      firmware: "v1.2.3",
      lastSync: "5 min ago",
      dataRate: "250 Hz"
    }
  ]

  const availableDevices = [
    {
      id: "LB003",
      name: "LINK BAND #003",
      mac: "AA:BB:CC:DD:EE:03",
      status: "Available",
      signal: 67,
      distance: "2.3m"
    },
    {
      id: "LB004",
      name: "LINK BAND #004", 
      mac: "AA:BB:CC:DD:EE:04",
      status: "Available",
      signal: 45,
      distance: "5.1m"
    }
  ]

  const handleScan = () => {
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 3000)
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Device Manager</h1>
            <p className="text-muted-foreground">LINK BAND 디바이스 연결 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleScan} disabled={isScanning}>
              <Search className="w-4 h-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan Devices'}
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search devices by name, MAC address, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Connected Devices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Connected Devices ({connectedDevices.length})</h3>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All Active
            </Badge>
          </div>
          
          <div className="space-y-3">
            {connectedDevices.map((device) => (
              <div key={device.id} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CircuitBoard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">{device.mac}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Battery className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{device.battery}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Signal className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{device.signal}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{device.dataRate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className="mb-2">Connected</Badge>
                      <p className="text-xs text-muted-foreground">Last sync: {device.lastSync}</p>
                      <p className="text-xs text-muted-foreground">FW: {device.firmware}</p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <WifiOff className="w-4 h-4 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Available Devices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Available Devices ({availableDevices.length})</h3>
            <Button variant="outline" size="sm" onClick={handleScan}>
              <Search className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {availableDevices.length > 0 ? (
            <div className="space-y-3">
              {availableDevices.map((device) => (
                <div key={device.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <CircuitBoard className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{device.name}</h4>
                        <p className="text-sm text-muted-foreground">{device.mac}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Signal className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{device.signal}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">~{device.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Available</Badge>
                      <Button>Connect</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bluetooth className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No devices found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Make sure your LINK BAND is in pairing mode and try scanning again
              </p>
              <Button variant="outline" onClick={handleScan}>
                <Search className="w-4 h-4 mr-2" />
                Scan for Devices
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}