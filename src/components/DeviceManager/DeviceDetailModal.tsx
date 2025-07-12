import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  CircuitBoard, 
  Battery, 
  Signal, 
  Wifi, 
  Clock, 
  Calendar,
  Activity,
  Zap,
  X
} from 'lucide-react'
import { useDeviceStatus, useSystemStatus } from '../../stores/systemStore'
import { useConnectedDevice, useDeviceMonitoring } from '../../stores/deviceStore'

interface DeviceDetailModalProps {
  device: any
  deviceType: 'registered' | 'connected'
  isOpen: boolean
  onClose: () => void
}

export function DeviceDetailModal({ device, deviceType, isOpen, onClose }: DeviceDetailModalProps) {
  if (!device) return null

  // Store에서 실시간 데이터 가져오기
  const deviceStatus = useDeviceStatus()
  const systemStatus = useSystemStatus()
  const connectedDevice = useConnectedDevice()
  const deviceMonitoring = useDeviceMonitoring()

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const renderRegisteredDeviceInfo = () => {
    // 현재 연결된 디바이스인지 확인
    const isCurrentlyConnected = deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id
    const connectionStatus = isCurrentlyConnected ? 'Connected' : 'Registered'
    
    return (
      <div className="space-y-6">
        {/* Device Info */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Device Info</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                <p className="text-foreground">{device.nickname || device.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                <p className="text-foreground font-mono text-sm">{device.id}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Connection Status</label>
                <Badge className={isCurrentlyConnected ? 
                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : 
                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                }>
                  {connectionStatus}
                </Badge>
              </div>
              {isCurrentlyConnected && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Connection Duration</label>
                    <p className="text-foreground">{deviceMonitoring?.connectionDuration || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Battery Level</label>
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4" />
                      <span className="text-foreground">{deviceMonitoring?.batteryLevel || 0}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Registration Info */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Registration Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Registered Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-foreground">{formatDate(device.registeredAt)}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Connected</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-foreground">
                  {device.lastConnectedAt ? formatDate(device.lastConnectedAt) : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">Usage Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{formatDuration(device.totalUsageDuration || 0)}</div>
              <div className="text-sm text-muted-foreground">Total Usage Duration</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{device.connectionCount || 0}</div>
              <div className="text-sm text-muted-foreground">Total Usage Time</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderConnectedDeviceInfo = () => (
    <div className="space-y-6">
      {/* Device Info */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Device Info</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Device Name</label>
              <p className="text-foreground">{connectedDevice?.device.name || deviceStatus.deviceName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Device ID</label>
              <p className="text-foreground font-mono text-sm">{connectedDevice?.device.id || deviceStatus.currentDeviceId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connection Start Time</label>
              <p className="text-foreground">
                {connectedDevice?.connectionStartTime ? 
                  new Date(connectedDevice.connectionStartTime).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connection Status</label>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Connected
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connection Duration</label>
              <p className="text-foreground">{deviceMonitoring?.connectionDuration || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Battery Level</label>
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4" />
                <span className="text-foreground">{deviceMonitoring?.batteryLevel || deviceStatus.batteryLevel}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sampling Rates */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-foreground mb-3">Sampling Rates</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.samplingRates?.eeg || 0}Hz</div>
            <div className="text-sm text-muted-foreground">EEG</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.samplingRates?.ppg || 0}Hz</div>
            <div className="text-sm text-muted-foreground">PPG</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.samplingRates?.acc || 0}Hz</div>
            <div className="text-sm text-muted-foreground">ACC</div>
          </div>
        </div>
      </div>

      {/* Signal Quality */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-foreground mb-3">Signal Quality</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.signalQuality?.eeg || 0}%</div>
            <div className="text-sm text-muted-foreground">EEG</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.signalQuality?.ppg || 0}%</div>
            <div className="text-sm text-muted-foreground">PPG</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.signalQuality?.acc || 0}%</div>
            <div className="text-sm text-muted-foreground">ACC</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{deviceMonitoring?.signalQuality?.overall || 0}%</div>
            <div className="text-sm text-muted-foreground">Overall</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <CircuitBoard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">{device.name}</div>
              <div className="text-sm text-muted-foreground">
                {deviceType === 'connected' ? 'Connected Device' : 'Registered Device'} Details
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {deviceType === 'registered' ? renderRegisteredDeviceInfo() : renderConnectedDeviceInfo()}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 