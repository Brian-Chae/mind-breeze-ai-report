# Device Manager User Guide

Device Manager is the core module for managing connections with LINK BAND devices. It provides all device-related functions including device search, connection, status monitoring, and settings management.

## 🚀 Getting Started

### Accessing Device Manager
1. Click **"📱 Device Manager"** in the left sidebar
2. Or use keyboard shortcut `Ctrl+1` (Windows/Linux) or `Cmd+1` (macOS)

### Initial Screen Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Device Search                                            │
│ [🔍 Start Search] [🔄 Refresh] [⚙️ Settings]                │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📱 Discovered Devices (Search Results Area)                 │
│ Start device search to find nearby LINK BAND devices.       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Connected Devices (Connection Status Area)               │
│ No devices currently connected.                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Device Search

### Starting Search
1. Click **"🔍 Start Search"** button
2. Select **"Allow"** when browser requests Bluetooth permissions
3. Monitor search progress

### Search Process
```
🔍 Searching for devices... (5-10 seconds)
├── 📡 Activating Bluetooth adapter
├── 🔄 Starting peripheral device scan
├── 📱 Filtering LINK BAND devices
├── 🔋 Checking battery status
├── 📶 Measuring signal strength
└── 📋 Displaying search results
```

### Interpreting Search Results
Each discovered device displays the following information:

```
🔵 LINK BAND-ABC123    🔋 85%  📶 -45dBm (Strong)
Last connected: 2024-01-15 14:30
[🔗 Connect] [ℹ️ Details] [⭐ Favorite]
```

#### Status Indicator Meanings
- **🔵 Blue**: Connectable device
- **🟢 Green**: Currently connected device
- **🔴 Red**: Non-connectable device
- **🟡 Yellow**: Low battery device

#### Signal Strength Interpretation
| Signal Strength | dBm Range | Status | Recommendation |
|-----------------|-----------|--------|----------------|
| **Strong** | -30 ~ -50 | 🟢 | Connection recommended |
| **Good** | -50 ~ -70 | 🟡 | Connection possible |
| **Weak** | -70 ~ -90 | 🟠 | Move closer |
| **Very Weak** | -90 or below | 🔴 | Unstable connection |

## 🔗 Device Connection

### Connection Process
1. Click **"🔗 Connect"** button for desired device
2. Monitor connection progress
3. Verify connection completion and status

### Step-by-Step Connection Status
```
📱 Connecting to LINK BAND-ABC123...
├── 🔄 Sending connection request (2-3 seconds)
├── 🤝 Pairing negotiation (3-5 seconds)
├── 🔐 Security authentication (2-3 seconds)
├── 📡 Service discovery (1-2 seconds)
├── 🔗 Setting up data channels (1-2 seconds)
└── ✅ Connection complete!
```

### Connection Success Verification
When connection is successful, it displays as follows:

```
🟢 LINK BAND-ABC123    🔋 85%  📶 Real-time monitoring
Status: Receiving data | Session: 00:00:15
EEG: ✅ PPG: ✅ ACC: ✅
[🔌 Disconnect] [⚙️ Settings] [📊 View Status]
```

## 📊 Connection Status Monitoring

### Real-time Status Information

#### Battery Monitoring
- **🔋 85%**: Current battery level
- **⏱️ About 6 hours**: Estimated usage time
- **⚡ Charging**: Charging status display (when applicable)

#### Signal Quality Monitoring
- **📶 -45dBm**: Real-time signal strength
- **📈 Stable**: Signal stability status
- **📊 99.9%**: Packet reception success rate

#### Sensor Status Check
- **🧠 EEG**: ✅ Normal / ⚠️ Warning / ❌ Error
- **❤️ PPG**: ✅ Normal / ⚠️ Warning / ❌ Error
- **🏃 ACC**: ✅ Normal / ⚠️ Warning / ❌ Error

### Data Streaming Status
```
📈 Real-time Data Stream
├── 🧠 EEG: 250 samples/sec (Normal)
├── ❤️ PPG: 25 samples/sec (Normal)
├── 🏃 ACC: 50 samples/sec (Normal)
├── 📊 Packet loss: 0.1% (Excellent)
└── ⏱️ Latency: 12ms (Excellent)
```

## ⚙️ Device Settings

### Accessing Settings Menu
Click the **"⚙️ Settings"** button for a connected device to open the settings panel.

### Basic Settings

#### Sampling Settings
```
🔬 Sampling Settings
├── EEG Sampling: [250Hz] [500Hz] [1000Hz]
├── PPG Sampling: [25Hz] [50Hz] [100Hz]
├── ACC Sampling: [50Hz] [100Hz] [200Hz]
└── Synchronization: [Auto] [Manual]
```

#### Filter Settings
```
🔧 Signal Filters
├── Notch Filter: [50Hz] [60Hz] [Disabled]
├── High-pass: [0.1Hz] [0.5Hz] [1Hz]
├── Low-pass: [30Hz] [50Hz] [100Hz]
└── Adaptive Filter: [Enabled] [Disabled]
```

#### Notification Settings
```
🔔 Notification Settings
├── Low Battery: [10%] [20%] [30%]
├── Connection Lost: [Immediate] [After 30s] [After 1min]
├── Signal Quality: [Warning] [Error only] [Disabled]
└── Data Loss: [1%] [5%] [10%]
```

### Advanced Settings

#### Connection Parameters
```
🔗 Connection Parameters
├── Connection Interval: [7.5ms] [15ms] [30ms]
├── Slave Latency: [0] [1] [2]
├── Supervision Timeout: [4s] [6s] [10s]
└── Auto Reconnect: [Enabled] [Disabled]
```

#### Data Buffering
```
📊 Data Buffering
├── Buffer Size: [1 second] [2 seconds] [5 seconds]
├── Buffer Policy: [Circular] [Overwrite] [Wait]
├── Memory Limit: [10MB] [50MB] [100MB]
└── Compression: [Enabled] [Disabled]
```

## 🔌 Disconnection

### Normal Disconnection
1. Click **"🔌 Disconnect"** button for connected device
2. Select **"Confirm"** in confirmation dialog
3. Verify disconnection completion

### Disconnection Process
```
🔌 Disconnecting...
├── 📊 Saving ongoing data session
├── 🔄 Flushing buffer data
├── 🤝 Sending connection termination signal
├── 🔗 Releasing Bluetooth connection
└── ✅ Disconnection complete
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Device Not Found During Search
**Symptoms**: No devices appear in search results
**Causes and Solutions**:
- ❌ **Device powered off** → Press and hold power button to turn on
- ❌ **Device not in pairing mode** → Restart device and verify pairing mode
- ❌ **Distance too far** → Move device within 1m range
- ❌ **Bluetooth disabled** → Enable Bluetooth in system settings
- ❌ **Browser permissions denied** → Allow Bluetooth permissions in browser

#### 2. Connection Attempt Fails
**Symptoms**: Connection fails after clicking connect button
**Causes and Solutions**:
- ❌ **Device already connected to another device** → Disconnect from other devices
- ❌ **Weak signal strength** → Move closer to device
- ❌ **Low battery** → Charge device above 20%
- ❌ **Bluetooth interference** → Move away from other Bluetooth devices
- ❌ **Browser compatibility** → Use Chrome, Edge, or Opera

#### 3. Frequent Disconnections
**Symptoms**: Device connects but disconnects frequently
**Causes and Solutions**:
- ❌ **Unstable signal** → Maintain stable distance from device
- ❌ **Power saving mode** → Disable power saving on computer
- ❌ **Network interference** → Change Wi-Fi channel or move location
- ❌ **Device firmware issue** → Check for device updates

#### 4. Poor Data Quality
**Symptoms**: High packet loss or signal quality warnings
**Causes and Solutions**:
- ❌ **Poor sensor contact** → Adjust device wearing position
- ❌ **Motion artifacts** → Minimize movement during measurement
- ❌ **Environmental interference** → Move to quieter location
- ❌ **Device calibration** → Perform device calibration

### Diagnostic Tools

#### Connection Diagnosis
Click **"🔍 Diagnose"** button to run automatic diagnosis:

```
🔍 Running connection diagnosis...
├── ✅ Bluetooth adapter: Normal
├── ✅ Browser permissions: Allowed
├── ✅ Device response: Normal
├── ⚠️ Signal strength: Weak (-65dBm)
├── ✅ Data streaming: Normal
└── 📋 Diagnosis complete (1 warning)

💡 Recommendations:
- Move closer to device
- Avoid interference from other devices
- Check device battery level
```

#### Performance Monitoring
Monitor key performance metrics:
- **Connection stability**: 99.5%
- **Data throughput**: 2.1 KB/s
- **Latency**: 15ms average
- **Packet loss**: 0.2%

## 📱 Multiple Device Management

### Connecting Multiple Devices
1. Connect first device following standard procedure
2. Search for additional devices
3. Connect up to 4 devices simultaneously
4. Monitor all connections in unified view

### Multi-Device Interface
```
🔗 Connected Devices (3/4)
┌─────────────────────────────────────────────────────────────┐
│ 🟢 LINK BAND-ABC123  🔋85%  📶Strong  EEG+PPG+ACC          │
│ 🟢 LINK BAND-DEF456  🔋72%  📶Good    EEG+PPG              │
│ 🟢 LINK BAND-GHI789  🔋91%  📶Strong  EEG+ACC              │
│ [🔌 Disconnect All] [⚙️ Global Settings] [📊 View All]     │
└─────────────────────────────────────────────────────────────┘
```

### Synchronized Operations
- **Start/Stop All**: Control all devices simultaneously
- **Settings Sync**: Apply settings to all devices
- **Data Sync**: Synchronize data collection across devices
- **Battery Monitoring**: Monitor all device batteries

## 🔧 Advanced Features

### Favorite Devices
- **Add to Favorites**: Star frequently used devices
- **Quick Connect**: One-click connection to favorite devices
- **Auto-Connect**: Automatically connect to favorites when available
- **Favorite Management**: Organize and manage favorite devices

### Connection Profiles
- **Custom Profiles**: Create custom connection settings
- **Profile Templates**: Use predefined settings for different scenarios
- **Profile Switching**: Quickly switch between different configurations
- **Profile Sharing**: Share profiles with team members

### Batch Operations
- **Bulk Connect**: Connect multiple devices at once
- **Bulk Settings**: Apply settings to multiple devices
- **Bulk Disconnect**: Disconnect all devices simultaneously
- **Bulk Export**: Export data from all connected devices

## 📊 Usage Statistics

### Connection History
- **Connection Log**: View detailed connection history
- **Usage Patterns**: Analyze device usage patterns
- **Performance Trends**: Track connection quality over time
- **Battery Usage**: Monitor battery consumption patterns

### Reports
- **Daily Reports**: Daily connection and usage summary
- **Weekly Reports**: Weekly performance analysis
- **Monthly Reports**: Monthly usage statistics
- **Custom Reports**: Generate custom reports for specific periods

> **Next Step**: Once your devices are connected, proceed to [Visualizer](visualizer.md) to see your data in real-time! 