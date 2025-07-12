# Interface Tour

Link Band SDK Web's intuitive interface allows you to easily perform all processes from EEG data collection to analysis. Let's explore the features and usage of each module in detail.

## 🏠 Overall Layout

### Main Interface Structure
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Link Band SDK Web                    🔋85% 📶Strong 👤User │ ← Top Navigation
├─────────────────────────────────────────────────────────────┤
│ 📱 Device Manager  │                                       │
│ 📊 Visualizer      │                                       │
│ 💾 Data Center     │          Main Content Area           │
│ 📈 Dashboard       │                                       │
│ 📚 Documents       │                                       │
│                    │                                       │
│ Sidebar            │                                       │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Connected | 📊 Collecting | 💾 Auto Save | ⚡ Real-time │ ← Bottom Status Bar
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Top Navigation Bar
- **Logo**: Link Band SDK Web
- **Device Status**: Battery level, signal strength
- **User Menu**: Settings, help, logout

#### 2. Left Sidebar
- **Module Menu**: 5 main module shortcuts
- **Quick Actions**: Frequently used functions
- **Status Display**: Current active module highlight

#### 3. Main Content Area
- **Dynamic Content**: Changes based on selected module
- **Real-time Updates**: Automatic data refresh
- **Responsive Design**: Adjusts to screen size

#### 4. Bottom Status Bar
- **Connection Status**: Device connection information
- **Data Collection**: Real-time collection status
- **Save Status**: Auto-save progress
- **System Status**: Overall system operation status

## 📱 Device Manager

### Interface Structure
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Device Search                                            │
│ [🔍 Start Search] [🔄 Refresh] [⚙️ Settings]                │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📱 Discovered Devices (2)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔵 LINK BAND-ABC123    🔋 85%  📶 -45dBm (Strong)       │ │
│ │ Last connected: 2024-01-15 14:30                        │ │
│ │ [🔗 Connect] [ℹ️ Details] [⭐ Favorite]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔵 LINK BAND-XYZ789    🔋 72%  📶 -52dBm (Good)         │ │
│ │ New device                                              │ │
│ │ [🔗 Connect] [ℹ️ Details]                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ✅ Connected Devices (1)                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 LINK BAND-ABC123    🔋 85%  📶 Real-time monitoring   │ │
│ │ Status: Receiving data | Session: 00:15:32              │ │
│ │ EEG: ✅ PPG: ✅ ACC: ✅                                   │ │
│ │ [🔌 Disconnect] [⚙️ Settings] [📊 View Status]          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

#### Device Search
- **Auto Scan**: Automatic detection of nearby LINK BAND devices
- **Filtering**: Filter by signal strength, battery status
- **Favorites**: Save frequently used devices

#### Connection Management
- **One-click Connection**: Simple click to connect devices
- **Auto Reconnection**: Automatic reconnection attempt on disconnection
- **Multiple Connections**: Support for simultaneous multiple device connections

#### Status Monitoring
- **Real-time Battery**: Real-time battery level display
- **Signal Quality**: Connection status and signal strength monitoring
- **Sensor Status**: Individual status check for EEG, PPG, ACC sensors

## 📊 Visualizer

### Interface Structure
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Data Visualization                                       │
│ [🧠 EEG] [❤️ PPG] [🏃 ACC] [📈 Integrated View]            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🧠 EEG Visualization                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📈 Real-time EEG (2 channels)                           │ │
│ │ ┌─ CH1 ────────────────────────────────────────────────┐ │ │
│ │ │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ Real-time waveform                   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─ CH2 ────────────────────────────────────────────────┐ │ │
│ │ │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ Real-time waveform                   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Frequency Spectrum                                   │ │
│ │ Alpha: ████████ 65%  Beta: ██████ 45%                   │ │
│ │ Theta: ████ 25%      Delta: ██ 15%                      │ │
│ │ Gamma: ███ 20%                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### EEG Visualization Features

#### Real-time EEG Charts
- **2-channel Simultaneous Display**: Independent waveform display for CH1, CH2
- **Auto Scaling**: Automatic adjustment based on signal amplitude
- **Time Window**: Selectable 5-60 second intervals
- **Filtering Options**: Noise removal, band-pass filters

#### Frequency Analysis
- **Band Power**: Power analysis by Alpha, Beta, Theta, Delta, Gamma bands
- **Power Spectrum**: Full frequency band spectrum analysis
- **Real-time Updates**: Real-time calculation based on 250Hz sampling

#### EEG Indices
- **Concentration Index**: Focus measurement based on Alpha/Theta ratio
- **Relaxation Index**: Relaxation state measurement based on Alpha power
- **Stress Index**: Stress level based on Beta/Alpha ratio

### PPG Visualization Features

#### Heart Rate Monitoring
- **Real-time HR**: Current heart rate BPM display
- **HR Changes**: Heart rate change graph over time
- **HRV Analysis**: Heart rate variability calculation and visualization

#### Pulse Wave Analysis
- **Raw PPG Signal**: Real-time pulse wave display
- **Peak Detection**: Automatic heartbeat peak detection and display
- **Signal Quality**: PPG signal quality index display

### ACC Visualization Features

#### 3-axis Acceleration
- **X, Y, Z Axes**: Individual display of 3-axis acceleration
- **Composite Acceleration**: 3-axis composite acceleration magnitude
- **Motion Patterns**: Motion pattern analysis and classification

#### Activity Analysis
- **Activity Measurement**: Activity level calculation per unit time
- **Posture Detection**: Posture classification (sitting, standing, walking)
- **Motion Events**: Sudden motion detection and alerts

## 💾 Data Center

### Interface Structure
```
┌─────────────────────────────────────────────────────────────┐
│ 💾 Data Center                                              │
│ [📂 Sessions] [📊 Statistics] [⚙️ Settings] [📤 Export]     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📂 Data Session List                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 2024-01-15 14:30:25 | ⏱️ 00:15:32 | 📊 EEG+PPG+ACC   │ │
│ │ Device: LINK BAND-ABC123 | Size: 2.5MB                  │ │
│ │ [👁️ View] [📤 Export] [🗑️ Delete]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 2024-01-15 09:15:10 | ⏱️ 00:45:18 | 📊 EEG+PPG       │ │
│ │ Device: LINK BAND-XYZ789 | Size: 7.2MB                  │ │
│ │ [👁️ View] [📤 Export] [🗑️ Delete]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📊 Storage Statistics                                       │
│ Total sessions: 127 | Total size: 1.2GB | Average: 15min   │
│ This week: 15 | This month: 68                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

#### Automatic Data Storage
- **Real-time Storage**: Automatic storage simultaneously with data collection
- **Session Management**: Manage connection to disconnection as one session
- **Metadata**: Automatic recording of date, time, device info, data type

#### Data Export
- **Multiple Formats**: CSV, JSON, MAT file export support
- **Selective Export**: Export specific time ranges or data types
- **Batch Export**: Multiple session simultaneous export

#### Storage Management
- **Usage Statistics**: Storage usage and trend analysis
- **Cleanup Tools**: Old data cleanup and optimization
- **Backup Options**: Cloud backup and synchronization

## 📈 Dashboard

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 System Dashboard                                         │
│ [📊 Overview] [🔧 Performance] [📱 Devices] [⚙️ Settings]   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Quick Status                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 System Status: Normal                                │ │
│ │ 📱 Connected Devices: 1/4                               │ │
│ │ 📊 Active Sessions: 1                                   │ │
│ │ 💾 Storage Usage: 1.2GB/10GB (12%)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Performance Monitoring
- **Real-time Metrics**: CPU, memory, network usage
- **Data Processing**: Processing speed and latency monitoring
- **System Health**: Overall system health assessment

### Device Status
- **Connection Overview**: All connected devices status
- **Battery Monitoring**: Battery level monitoring for all devices
- **Signal Quality**: Signal quality monitoring for all devices

## 🎯 Navigation Tips

### Keyboard Shortcuts
- **Ctrl + 1**: Device Manager
- **Ctrl + 2**: Visualizer
- **Ctrl + 3**: Data Center
- **Ctrl + 4**: Dashboard
- **Ctrl + D**: Documents
- **F11**: Full screen mode

### Quick Actions
- **Space**: Start/Stop data collection
- **Ctrl + S**: Save current session
- **Ctrl + E**: Export current data
- **Ctrl + R**: Refresh current view

### Mobile Usage
- **Touch Gestures**: Swipe navigation between modules
- **Responsive Design**: Optimized for tablet and smartphone
- **Offline Mode**: Limited functionality without internet

## 🚀 Getting Started Tips

### First Time Users
1. **Start with Device Manager**: Connect your first device
2. **Explore Visualizer**: See real-time data visualization
3. **Check Data Center**: Verify data is being saved
4. **Review Dashboard**: Monitor system performance

### Advanced Users
- **Customize Views**: Adjust chart settings and layouts
- **Set Up Alerts**: Configure battery and signal alerts
- **Optimize Performance**: Adjust buffer sizes and processing options
- **Batch Operations**: Use bulk export and management features

> **Next Step**: Now that you're familiar with the interface, explore each module in detail through the [User Guide](../user-guide/) section! 