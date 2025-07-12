# First Connection

This guide provides step-by-step instructions for setting up your first connection with a LINK BAND device in Link Band SDK Web.

## 🚀 Quick Start

### Step 1: Device Preparation
Before connecting your LINK BAND device, check the following:

- [ ] **Charge Status**: Battery level 20% or higher
- [ ] **Power On**: Press and hold the device power button to turn on
- [ ] **Pairing Mode**: Verify LED is blinking blue
- [ ] **Distance**: Keep device within 1m of your computer

### Step 2: Web Application Access
1. Launch a supported browser (Chrome, Edge, Opera)
2. Navigate to Link Band SDK Web address
3. Verify HTTPS connection (🔒 icon in address bar)

### Step 3: Open Device Manager
1. Click **"Device Manager"** in the left sidebar
2. Click **"Search Devices"** button
3. Click **"Allow"** when browser requests Bluetooth permissions

## 📱 Detailed Connection Process

### Device Manager Interface

Device Manager consists of the following sections:

```
┌─────────────────────────────────────┐
│ 🔍 Device Search                    │
│ [Search Devices] [Refresh]          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 📱 Discovered Devices               │
│ ● LINK BAND-ABC123                  │
│   Battery: 85% | Signal: Strong     │
│   [Connect] [Details]               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🔗 Connected Devices                │
│ ✅ LINK BAND-ABC123 (Connected)     │
│   Status: Receiving data            │
│   [Disconnect] [Settings]           │
└─────────────────────────────────────┘
```

### Step-by-Step Connection Process

#### 1. Device Search
```
🔍 Searching for devices...
├── Starting Bluetooth scan
├── Detecting nearby LINK BAND devices
├── Checking signal strength and battery status
└── Displaying available devices list
```

**Expected Duration**: 5-10 seconds

#### 2. Device Selection and Connection
```
📱 Selecting LINK BAND-ABC123
├── Verifying device information
├── Sending connection request
├── Waiting for pairing approval
└── Completing connection and status check
```

**Expected Duration**: 10-15 seconds

#### 3. Connection Verification
```
✅ Connection successful!
├── Device status: Connected
├── Battery level: Real-time display
├── Signal quality: Real-time monitoring
└── Data streaming started
```

## 🔧 Connection Settings

### Default Connection Settings
The following settings are automatically applied during connection:

| Setting | Default Value | Description |
|---------|---------------|-------------|
| **Sampling Frequency** | 250Hz | EEG data collection frequency |
| **Data Buffering** | 1 second | Buffer size for real-time processing |
| **Auto Reconnect** | Enabled | Auto reconnect on disconnection |
| **Battery Alert** | 20% | Low battery alert threshold |

### Advanced Settings
Additional settings for advanced users:

```javascript
// Connection configuration example
const connectionConfig = {
  samplingRate: 250,        // Sampling frequency (Hz)
  bufferSize: 1000,        // Buffer size (number of samples)
  autoReconnect: true,     // Auto reconnect
  batteryThreshold: 20,    // Battery alert threshold (%)
  signalQualityCheck: true // Automatic signal quality check
};
```

## 📊 Connection Status Monitoring

### Real-Time Status Display
After connection, the following information is updated in real-time:

#### Connection Status Indicator
- 🟢 **Connected**: Normal data reception
- 🟡 **Connecting**: Connection attempt in progress
- 🔴 **Disconnected**: Connection failed or lost
- 🟠 **Reconnecting**: Auto reconnection attempt

#### Device Information
```
📱 LINK BAND-ABC123
├── 🔋 Battery: 85% (about 6 hours remaining)
├── 📶 Signal strength: -45dBm (Strong)
├── 🧠 EEG channels: 2 channels active
├── ❤️ PPG sensor: Normal operation
└── 🏃 ACC sensor: Normal operation
```

#### Data Streaming Status
```
📈 Data Stream
├── EEG: 250 samples/sec
├── PPG: 25 samples/sec
├── ACC: 50 samples/sec
└── Packet loss: 0.1%
```

## 🚨 Troubleshooting

### Common Connection Issues

#### 1. Device Not Found
**Causes and Solutions**:
- ❌ **Device powered off** → Press and hold power button to turn on
- ❌ **Not in pairing mode** → Restart device and verify pairing mode
- ❌ **Distance too far** → Move within 1m range
- ❌ **Bluetooth disabled** → Check system Bluetooth settings

#### 2. Connection Attempt Failed
**Causes and Solutions**:
- ❌ **Connected to another device** → Disconnect from other devices
- ❌ **Browser permission denied** → Allow Bluetooth permission in browser settings
- ❌ **Network issues** → Check internet connection status
- ❌ **Outdated device firmware** → Check for device updates

#### 3. No Data Reception After Connection
**Causes and Solutions**:
- ❌ **Signal interference** → Distance from other Bluetooth devices
- ❌ **Low battery** → Charge device
- ❌ **Poor sensor contact** → Check device wearing condition
- ❌ **Browser performance issues** → Restart browser

### Connection Status Diagnosis

#### Automatic Diagnosis Feature
Click the **"Connection Diagnosis"** button in Device Manager:

```
🔍 Running connection diagnosis...
├── ✅ Bluetooth adapter normal
├── ✅ Browser permissions allowed
├── ✅ Device response normal
├── ⚠️ Signal strength weak (-65dBm)
└── 📋 Diagnosis complete (1 caution)

💡 Recommendations:
- Position closer to device
- Maintain distance from other Bluetooth devices
```

#### Manual Diagnosis Checklist
When connection issues occur, check the following items in order:

- [ ] Verify device power status
- [ ] Confirm battery level above 20%
- [ ] Allow browser Bluetooth permissions
- [ ] Disconnect from other devices
- [ ] Clear browser cache
- [ ] Refresh page
- [ ] Restart browser

## ✅ Connection Success Verification

### Success Indicators
Connection is successfully completed when all of the following conditions are met:

1. **Device Manager** shows device status as "Connected"
2. **Battery level** updates in real-time
3. **Signal quality** shows "Good" or better
4. **Data streaming** starts normally

### Next Steps
Once connection is complete, you can proceed to:

1. **Interface Tour** → [Interface Tour](interface-tour.md)
2. **Real-time Data Check** → Use Visualizer module
3. **Data Storage Setup** → Configure Data Center module

> **🎉 Congratulations!** Your first connection with the LINK BAND device is complete. You can now start collecting real-time EEG data! 