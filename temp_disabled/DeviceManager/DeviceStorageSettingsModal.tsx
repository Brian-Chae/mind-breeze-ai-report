import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  Database, 
  Settings, 
  Clock, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  RotateCcw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DeviceStorageSettings, useDeviceActions, useDeviceStorageSettings } from '../../stores/deviceStore';

interface DeviceStorageSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
}

export function DeviceStorageSettingsModal({
  open,
  onOpenChange,
  deviceId,
  deviceName
}: DeviceStorageSettingsModalProps) {
  const { updateDeviceStorageSettings, resetDeviceStorageSettings } = useDeviceActions();
  const currentSettings = useDeviceStorageSettings(deviceId);
  
  const [settings, setSettings] = useState<DeviceStorageSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize settings when modal opens
  useEffect(() => {
    if (open && currentSettings) {
      setSettings({ ...currentSettings });
      setHasChanges(false);
    }
  }, [open, currentSettings]);

  const handleSettingChange = (key: keyof DeviceStorageSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings) return;
    
    updateDeviceStorageSettings(deviceId, settings);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetDeviceStorageSettings(deviceId);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setHasChanges(false);
    onOpenChange(false);
  };

  if (!settings) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Storage Settings - {deviceName}
          </DialogTitle>
          <DialogDescription>
            Configure device-specific storage and recording settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Recording Settings
              </CardTitle>
              <CardDescription>
                Basic recording and session configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Record */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Auto Record</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically start recording when device connects
                  </p>
                </div>
                <Switch
                  checked={settings.autoRecord}
                  onCheckedChange={(checked) => handleSettingChange('autoRecord', checked)}
                />
              </div>

              {/* Default Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Format</label>
                <Select
                  value={settings.defaultFormat}
                  onValueChange={(value) => handleSettingChange('defaultFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jsonl">JSON Lines (.jsonl)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="binary">Binary (.bin)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default file format for recordings from this device
                </p>
              </div>

              {/* Session Name Template */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Name Template</label>
                <Input
                  value={settings.sessionNameTemplate}
                  onChange={(e) => handleSettingChange('sessionNameTemplate', e.target.value)}
                  placeholder="{deviceName}_{date}_{time}"
                />
                <p className="text-xs text-muted-foreground">
                  Template for session names. Use {'{deviceName}'}, {'{date}'}, {'{time}'}
                </p>
              </div>

              {/* Max Session Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Session Duration: {settings.maxSessionDuration} minutes
                </label>
                <Slider
                  value={[settings.maxSessionDuration]}
                  onValueChange={(value: number[]) => handleSettingChange('maxSessionDuration', value[0])}
                  min={5}
                  max={480}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum recording duration before automatic stop
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HardDrive className="w-5 h-5" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                File storage and compression configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compression */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Enable Compression</label>
                  <p className="text-xs text-muted-foreground">
                    Compress data files to save storage space
                  </p>
                </div>
                <Switch
                  checked={settings.compressionEnabled}
                  onCheckedChange={(checked) => handleSettingChange('compressionEnabled', checked)}
                />
              </div>

              {/* Save Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Save Location</label>
                <Input
                  value={settings.saveLocation}
                  onChange={(e) => handleSettingChange('saveLocation', e.target.value)}
                  placeholder="sessions"
                />
                <p className="text-xs text-muted-foreground">
                  Relative path within storage directory for this device
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Memory and performance optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Save Interval */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Auto Save Interval: {settings.autoSaveInterval} seconds
                </label>
                <Slider
                  value={[settings.autoSaveInterval]}
                  onValueChange={(value: number[]) => handleSettingChange('autoSaveInterval', value[0])}
                  min={1}
                  max={60}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How often to save data during recording
                </p>
              </div>

              {/* Memory Threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Memory Threshold: {settings.memoryThreshold} MB
                </label>
                <Slider
                  value={[settings.memoryThreshold]}
                  onValueChange={(value: number[]) => handleSettingChange('memoryThreshold', value[0])}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Memory usage limit before triggering cleanup
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quality Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5" />
                Quality Settings
              </CardTitle>
              <CardDescription>
                Signal quality monitoring and control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Min Signal Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Minimum Signal Quality: {settings.minSignalQuality}%
                </label>
                <Slider
                  value={[settings.minSignalQuality]}
                  onValueChange={(value: number[]) => handleSettingChange('minSignalQuality', value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum acceptable signal quality threshold
                </p>
              </div>

              {/* Pause on Low Quality */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Pause on Low Quality</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically pause recording when signal quality drops below threshold
                  </p>
                </div>
                <Switch
                  checked={settings.pauseOnLowQuality}
                  onCheckedChange={(checked) => handleSettingChange('pauseOnLowQuality', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5" />
                Settings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Auto Record:</span>
                    <Badge variant={settings.autoRecord ? "default" : "secondary"}>
                      {settings.autoRecord ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <Badge variant="outline">{settings.defaultFormat.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Compression:</span>
                    <Badge variant={settings.compressionEnabled ? "default" : "secondary"}>
                      {settings.compressionEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Max Duration:</span>
                    <Badge variant="outline">{settings.maxSessionDuration}min</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Save Interval:</span>
                    <Badge variant="outline">{settings.autoSaveInterval}s</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Limit:</span>
                    <Badge variant="outline">{settings.memoryThreshold}MB</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 