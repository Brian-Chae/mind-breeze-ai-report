# Dashboard User Guide

Dashboard is the integrated management panel where you can monitor the overall system status of Link Band SDK Web at a glance. You can check real-time information about connected devices, system performance, and data collection statistics.

## 🚀 Getting Started

### Accessing Dashboard
1. Click **"📈 Dashboard"** in the left sidebar
2. Or use keyboard shortcut `Ctrl+4` (Windows/Linux) or `Cmd+4` (macOS)

### Overall Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 System Dashboard                                         │
│ [📊 Overview] [🔧 Performance] [📱 Devices] [⚙️ Settings]   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Quick Status                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 System Status: Normal                                │ │
│ │ 📱 Connected Devices: 2/4                               │ │
│ │ 📊 Active Sessions: 2                                   │ │
│ │ 💾 Storage Usage: 1.2GB/10GB (12%)                      │ │
│ │ 🔋 Average Battery: 78%                                 │ │
│ │ 📶 Signal Quality: Good                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Overview Tab

### System Status Overview
The default tab of Dashboard where you can check key indicators of the entire system at a glance.

#### Real-time Status Cards
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Real-time Status Cards                                   │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 🟢 System       │ │ 📱 Devices      │ │ 📊 Data Stream  │ │
│ │ Status: Normal  │ │ Connected: 2/4  │ │ Rate: 500 sps   │ │
│ │ Uptime: 2h 15m  │ │ Battery: 78%    │ │ Quality: 99.8%  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 💾 Storage      │ │ 🔄 Sessions     │ │ ⚡ Performance  │ │
│ │ Used: 1.2GB     │ │ Active: 2       │ │ CPU: 15%        │ │
│ │ Free: 8.8GB     │ │ Today: 8        │ │ Memory: 2.1GB   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Connected Devices Summary
```
┌─────────────────────────────────────────────────────────────┐
│ 📱 Connected Devices Summary                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 LINK BAND-ABC123  🔋85%  📶Strong  EEG+PPG+ACC       │ │
│ │ Session: 01:23:45 | Data: 15.2MB | Quality: 99.9%      │ │
│ │ [📊 View Details] [⚙️ Settings] [🔌 Disconnect]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 LINK BAND-DEF456  🔋72%  📶Good    EEG+PPG           │ │
│ │ Session: 00:45:12 | Data: 8.7MB | Quality: 99.5%       │ │
│ │ [📊 View Details] [⚙️ Settings] [🔌 Disconnect]         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Recent Activity Log
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Recent Activity Log                                      │
│ 15:23:45 ✅ LINK BAND-ABC123 connected successfully         │
│ 15:22:10 🔄 Data session started for LINK BAND-ABC123      │
│ 15:20:33 ⚠️ Low battery warning for LINK BAND-DEF456       │
│ 15:18:22 📊 Data export completed (session_20240115.csv)   │
│ 15:15:47 🔌 LINK BAND-GHI789 disconnected                  │
│ 15:12:15 ✅ System startup completed                        │
│ [📜 View Full Log] [🔍 Filter] [📤 Export Log]             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Performance Tab

### System Performance Monitoring
Monitor real-time performance indicators of the system and optimize them.

#### Real-time Performance Charts
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Real-time Performance Charts                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖥️ CPU Usage (%)                                        │ │
│ │ 100 ┤                                                   │ │
│ │  75 ┤     ▄▄                                            │ │
│ │  50 ┤   ▄▄  ▄▄    ▄▄                                    │ │
│ │  25 ┤ ▄▄      ▄▄▄▄  ▄▄▄▄                                │ │
│ │   0 └─────────────────────────────────────────────────── │ │
│ │     Current: 15% | Average: 22% | Peak: 68%            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 Memory Usage (GB)                                    │ │
│ │  8 ┤                                                    │ │
│ │  6 ┤                                    ▄▄▄▄            │ │
│ │  4 ┤                          ▄▄▄▄▄▄▄▄▄    ▄▄▄▄        │ │
│ │  2 ┤▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄        ▄▄▄▄    ▄▄▄▄    │ │
│ │  0 └─────────────────────────────────────────────────── │ │
│ │     Current: 2.1GB | Available: 5.9GB | Total: 8GB    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Data Processing Performance
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Data Processing Performance                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 EEG Processing                                       │ │
│ │ Throughput: 500 samples/sec | Latency: 12ms            │ │
│ │ Buffer Usage: 65% | Processing Load: 18%               │ │
│ │ ████████████████████████████████████████████████████    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ❤️ PPG Processing                                       │ │
│ │ Throughput: 50 samples/sec | Latency: 8ms              │ │
│ │ Buffer Usage: 45% | Processing Load: 12%               │ │
│ │ ████████████████████████████████████████████████████    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏃 ACC Processing                                       │ │
│ │ Throughput: 100 samples/sec | Latency: 5ms             │ │
│ │ Buffer Usage: 35% | Processing Load: 8%                │ │
│ │ ████████████████████████████████████████████████████    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Network Performance
```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Network Performance                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📡 Bluetooth Connections                                │ │
│ │ Active: 2/4 | Signal Quality: Good | Interference: Low │ │
│ │ Data Rate: 2.1 KB/s | Packet Loss: 0.2%                │ │
│ │ Connection Stability: 99.8%                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔄 Data Synchronization                                 │ │
│ │ Sync Status: Up to date | Last Sync: 2 minutes ago     │ │
│ │ Pending: 0 sessions | Failed: 0 sessions               │ │
│ │ Bandwidth Usage: 1.2 MB/min                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Devices Tab

### Detailed Device Monitoring
Monitor and manage detailed information of all connected devices.

#### Device Status Matrix
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Device Status Matrix                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Device ID    │ Status │ Battery │ Signal │ Data Rate    │ │
│ │──────────────│────────│─────────│────────│──────────────│ │
│ │ ABC123       │ 🟢 ON  │ 85%     │ Strong │ 250 sps      │ │
│ │ DEF456       │ 🟢 ON  │ 72%     │ Good   │ 250 sps      │ │
│ │ GHI789       │ 🔴 OFF │ --      │ --     │ --           │ │
│ │ JKL012       │ 🔴 OFF │ --      │ --     │ --           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Battery Status Monitoring
```
┌─────────────────────────────────────────────────────────────┐
│ 🔋 Battery Status Monitoring                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LINK BAND-ABC123                                        │ │
│ │ 🔋 85% ████████████████████████████████████████████████  │ │
│ │ Estimated: 6h 15m remaining | Charging: No             │ │
│ │ Health: Excellent | Cycles: 127                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LINK BAND-DEF456                                        │ │
│ │ 🔋 72% ████████████████████████████████████████████████  │ │
│ │ Estimated: 5h 2m remaining | Charging: No              │ │
│ │ Health: Good | Cycles: 89                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Signal Quality Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ 📶 Signal Quality Analysis                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 EEG Signal Quality                                   │ │
│ │ CH1: 99.8% ████████████████████████████████████████████  │ │
│ │ CH2: 99.5% ████████████████████████████████████████████  │ │
│ │ Impedance: Good | Noise Level: Low                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ❤️ PPG Signal Quality                                   │ │
│ │ Quality: 99.2% ████████████████████████████████████████  │ │
│ │ SNR: 45dB | Perfusion: Good                            │ │
│ │ Motion Artifacts: Minimal                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Settings Tab

### System Settings and Optimization
Manage Dashboard operation methods and overall system settings.

#### Monitoring Settings
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Monitoring Settings                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔄 Update Intervals                                     │ │
│ │ Real-time Charts: [1s] [5s] [10s] [30s]                │ │
│ │ Device Status: [5s] [10s] [30s] [1min]                 │ │
│ │ Performance Metrics: [10s] [30s] [1min] [5min]         │ │
│ │ Activity Log: [Real-time] [1min] [5min]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📈 Chart Settings                                       │ │
│ │ Time Window: [1min] [5min] [15min] [1hour]             │ │
│ │ Data Points: [100] [500] [1000] [5000]                 │ │
│ │ Auto Scale: [✓] Enable [  ] Disable                    │ │
│ │ Grid Lines: [✓] Show [  ] Hide                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Notification Settings
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notification Settings                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 Critical Alerts                                      │ │
│ │ [✓] Device disconnection                               │ │
│ │ [✓] Low battery (< 20%)                                │ │
│ │ [✓] Signal quality degradation                         │ │
│ │ [✓] Data loss > 5%                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Warning Alerts                                       │ │
│ │ [✓] Battery < 50%                                      │ │
│ │ [✓] Signal quality < 95%                               │ │
│ │ [  ] High CPU usage > 80%                              │ │
│ │ [  ] Memory usage > 90%                                │ │
│ │ [✓] Data loss > 5%                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Performance Optimization
```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Performance Optimization                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔧 Processing Settings                                  │ │
│ │ Buffer Size: [Small] [Medium] [Large] [Custom]         │ │
│ │ Processing Priority: [Low] [Normal] [High] [Real-time] │ │
│ │ Multi-threading: [✓] Enable [  ] Disable               │ │
│ │ Hardware Acceleration: [✓] Enable [  ] Disable         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💾 Storage Settings                                     │ │
│ │ Auto-cleanup: [✓] Enable [  ] Disable                  │ │
│ │ Cleanup Threshold: [1GB] [5GB] [10GB] [Custom]         │ │
│ │ Compression: [✓] Enable [  ] Disable                   │ │
│ │ Backup Frequency: [Daily] [Weekly] [Monthly] [Manual]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Statistics and Analysis

### Usage Statistics
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Usage Statistics                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 Today's Summary                                      │ │
│ │ Sessions: 8 | Total Duration: 6h 32m                   │ │
│ │ Data Collected: 247MB | Devices Used: 3                │ │
│ │ Average Session: 49m | Success Rate: 98.5%             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 This Week's Trends                                   │ │
│ │ Total Sessions: 47 | Total Duration: 38h 15m           │ │
│ │ Data Collected: 1.8GB | Most Used: LINK BAND-ABC123    │ │
│ │ Peak Usage: Tuesday 2-4 PM | Avg Quality: 99.2%        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Performance Report
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Performance Report                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 System Health Score: 94/100                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Connection Stability: 99.8% ████████████████████████ │ │ │
│ │ │ Data Quality: 99.2% ████████████████████████████████ │ │ │
│ │ │ Processing Speed: 95.5% ████████████████████████████ │ │ │
│ │ │ Resource Usage: 85.2% ████████████████████████████  │ │ │
│ │ │ Error Rate: 0.3% ████████████████████████████████████ │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Notifications and Alerts

### Notification Center
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notification Center                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Critical (1)                                         │ │
│ │ 15:45 LINK BAND-GHI789 disconnected unexpectedly       │ │
│ │ [🔧 Diagnose] [🔄 Reconnect] [❌ Dismiss]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟡 Warning (2)                                          │ │
│ │ 15:30 LINK BAND-DEF456 battery below 20%               │ │
│ │ 15:25 Signal quality degraded for LINK BAND-ABC123     │ │
│ │ [⚡ Charge] [📶 Optimize] [❌ Dismiss All]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔵 Info (3)                                             │ │
│ │ 15:20 Data export completed successfully               │ │
│ │ 15:15 New device LINK BAND-MNO345 discovered           │ │
│ │ 15:10 Session auto-saved to cloud storage              │ │
│ │ [📁 Open] [🔗 Connect] [☁️ View] [❌ Clear All]         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### System Status Indicators
```
┌─────────────────────────────────────────────────────────────┐
│ 🚦 System Status Indicators                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 All Systems Operational                              │ │
│ │ ├── 🟢 Bluetooth Service: Running                       │ │
│ │ ├── 🟢 Data Processing: Normal                          │ │
│ │ ├── 🟢 Storage System: Available                        │ │
│ │ ├── 🟢 Network Connection: Stable                       │ │
│ │ └── 🟢 User Interface: Responsive                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### System Diagnosis
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 System Diagnosis                                         │
│ [🔄 Run Full Diagnosis] [⚡ Quick Check] [📊 Performance Test] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Running system diagnosis...                          │ │
│ │ ├── ✅ Browser compatibility: Chrome 120.0 (Supported)  │ │
│ │ ├── ✅ Bluetooth adapter: Available and functional      │ │
│ │ ├── ✅ Memory usage: 2.1GB/8GB (26% - Normal)          │ │
│ │ ├── ✅ Storage space: 8.8GB/10GB (88% - Available)     │ │
│ │ ├── ⚠️ Network latency: 85ms (High - Check connection) │ │
│ │ └── ✅ WebAssembly support: Available                   │ │
│ │ 📋 Diagnosis complete: 1 warning found                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Auto Recovery Features
```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Auto Recovery Features                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [✓] Auto-reconnect disconnected devices                 │ │
│ │ [✓] Restart failed services automatically              │ │
│ │ [✓] Clear cache when memory usage > 90%                │ │
│ │ [✓] Backup data before system restart                  │ │
│ │ [✓] Notify user of critical issues                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Mobile Optimization

### Mobile Dashboard
Provides optimized Dashboard experience on tablets and smartphones.

```
┌─────────────────────────────────────┐
│ 📱 Mobile Dashboard                 │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 System: OK                   │ │
│ │ 📱 Devices: 2/4                 │ │
│ │ 🔋 Battery: 78%                 │ │
│ │ 📊 Quality: 99.8%               │ │
│ └─────────────────────────────────┘ │
│ [📊] [🔧] [📱] [⚙️]                │
│ ┌─────────────────────────────────┐ │
│ │ 🔔 Notifications (3)            │ │
│ │ • Low battery warning           │ │
│ │ • Export completed              │ │
│ │ • New device found              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🎯 Usage Tips

### Efficient Monitoring
1. **Priority Setting**: Place the most important metrics at the top
2. **Notification Optimization**: Enable only important notifications to reduce fatigue
3. **Automation Utilization**: Use auto-recovery features to reduce management burden
4. **Regular Checks**: Periodically review performance reports

### Problem Prevention
1. **Battery Monitoring**: Charge devices before battery runs low
2. **Signal Quality Management**: Take immediate action when signal quality degrades
3. **Storage Management**: Regularly clean up unnecessary data
4. **Performance Optimization**: Continuously monitor system resource usage

> **Next Step**: After checking system status in Dashboard, manage problem areas in detail through the corresponding modules ([Device Manager](device-manager.md), [Visualizer](visualizer.md), [Data Center](data-center.md))! 