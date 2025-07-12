# Data Center User Guide

Data Center is a centralized data hub that systematically stores, manages, and analyzes biosignal data collected from LINK BAND devices. It provides session-based data management, advanced analysis tools, and various export options.

## 🚀 Getting Started

### Accessing Data Center
1. Click **"💾 Data Center"** in the left sidebar
2. Or use keyboard shortcut `Ctrl+3` (Windows/Linux) or `Cmd+3` (macOS)
3. Stored data must be available to use analysis features

### Initial Screen Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 💾 Data Center                                              │
│ [📊 Sessions] [📈 Analysis] [📁 Export] [⚙️ Settings]       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📊 Data Overview                                            │
│ Total Sessions: 47 | Total Data: 2.3GB | Total Time: 15h 32m │
│ Recent Session: 2024-01-15 14:30 | Average: 19m 45s        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Session Management

### Session List View
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Session List                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Meditation Session #47           📅 2024-01-15 14:30 │ │
│ │ Duration: 25m 32s | Size: 45.2MB | Quality: Excellent (94%) │ │
│ │ Sensors: EEG ✅ PPG ✅ ACC ✅ | Tags: #meditation #relax │ │
│ │ [▶️ Play] [📊 Analyze] [📁 Export] [✏️ Edit] [🗑️ Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔵 Study Session #46                📅 2024-01-15 10:15 │ │
│ │ Duration: 45m 18s | Size: 82.7MB | Quality: Good (87%)  │ │
│ │ Sensors: EEG ✅ PPG ✅ ACC ✅ | Tags: #study #focus      │ │
│ │ [▶️ Play] [📊 Analyze] [📁 Export] [✏️ Edit] [🗑️ Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Session Quality Indicators
| Quality Grade | Score Range | Meaning | Recommendation |
|---------------|-------------|---------|----------------|
| **Excellent** | 90-100% | All sensors normal | Optimal for analysis |
| **Good** | 80-89% | Minor noise | Suitable for analysis |
| **Fair** | 70-79% | Some data issues | Analyze with caution |
| **Poor** | 60-69% | Serious problems | Re-measurement recommended |
| **Very Poor** | < 60% | Unusable data | Consider deletion |

## 📈 Data Analysis

### Basic Analysis Results
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Analysis Summary                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 EEG Analysis                                         │ │
│ │ Average Attention: 78% (High)                           │ │
│ │ Average Relaxation: 65% (Good)                          │ │
│ │ Stress Index: 25% (Low)                                 │ │
│ │ Dominant Frequency: Alpha (8-13Hz)                      │ │
│ │ Signal Stability: 94% (Excellent)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ❤️ PPG Analysis                                         │ │
│ │ Average Heart Rate: 68 BPM (Normal)                     │ │
│ │ HRV RMSSD: 42.5 ms (Good)                              │ │
│ │ Stress Index: Low (25%)                                 │ │
│ │ Autonomic Balance: Good                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏃 ACC Analysis                                         │ │
│ │ Average Activity: 0.12g (Very Low)                     │ │
│ │ Primary Posture: Sitting (98.5%)                       │ │
│ │ Movement Pattern: Static meditation                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Trend Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 30-Day Trends                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 Attention Trend: 📈 +15% improvement                 │ │
│ │ 😌 Relaxation Trend: 📈 +25% improvement                │ │
│ │ 😰 Stress Trend: 📉 -18% improvement                    │ │
│ │ ❤️ Heart Rate Variability: 📈 +12% improvement          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### AI-Powered Insights
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI Recommendations                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💡 Personalized Insights                                │ │
│ │ • Optimal Session Time: 20-25 minutes                   │ │
│ │ • Best Time of Day: 2:00 PM - 3:00 PM                  │ │
│ │ • Weekly Pattern: Peak performance on Wed-Thu           │ │
│ │ • Improvement Areas: Stress management                  │ │
│ │ • Recommendation: Try breathing exercises               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Data Export

### Export Options
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Export Formats                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Data Formats                                         │ │
│ │ [✓] CSV (Comma-Separated Values)                        │ │
│ │ [✓] JSON (JavaScript Object Notation)                   │ │
│ │ [✓] Excel (.xlsx)                                       │ │
│ │ [  ] EDF (European Data Format)                         │ │
│ │ [  ] MAT (MATLAB Format)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Report Formats                                       │ │
│ │ [✓] PDF Report                                          │ │
│ │ [✓] HTML Report                                         │ │
│ │ [  ] Word Document (.docx)                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Export Content Selection
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Export Content                                           │
│ [✓] Raw signals (EEG, PPG, ACC)                            │
│ [✓] Processed indices (Attention, Relaxation, Stress)      │
│ [✓] Heart rate and HRV metrics                             │
│ [✓] Signal quality metrics                                 │
│ [✓] Session metadata and timestamps                        │
│ [✓] Analysis results and insights                          │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Reports and Documentation

### Automated Reports
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Report Types                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 Daily Summary                                        │ │
│ │ • Sessions: 3 (Total: 1h 42m)                          │ │
│ │ • Average Attention: 82% (↑5%)                         │ │
│ │ • Best Session: Meditation #47 (94% quality)           │ │
│ │ • Goal Achievement: 85%                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Weekly Progress                                      │ │
│ │ • Total Sessions: 18 (Goal: 15) ✅                     │ │
│ │ • Average Quality: 89% (↑4%)                           │ │
│ │ • Consistency: 6/7 days ✅                             │ │
│ │ • Improvement Areas: Stress management                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Settings and Configuration

### Storage Management
```
┌─────────────────────────────────────────────────────────────┐
│ 💾 Storage Overview                                         │
│ Used: 2.3GB / 10GB (23%)                                   │
│ ████████████████████████████████████████████████████████████│
│ Sessions: 47 | Average Size: 48.9MB                        │
│ Estimated Full: 6 months                                   │
└─────────────────────────────────────────────────────────────┘
```

### Privacy and Security
```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Security Settings                                        │
│ • Encryption: AES-256 (Enabled)                            │
│ • Local Storage: Encrypted                                 │
│ • Cloud Backup: [✓] Enabled                               │
│ • Password Protection: [✓] Enabled                         │
│ • Data Sharing: [✓] Disabled                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Usage Tips

### Best Practices
1. **Regular Backup**: Export important sessions regularly
2. **Quality Control**: Review and tag sessions for easy retrieval
3. **Trend Monitoring**: Use weekly/monthly reports to track progress
4. **Storage Management**: Clean up poor-quality sessions periodically

### Analysis Guidelines
1. **Context Documentation**: Add detailed notes to sessions
2. **Consistent Tagging**: Use standardized tags for better organization
3. **Comparative Analysis**: Compare similar sessions for insights
4. **Long-term Tracking**: Focus on trends rather than individual sessions

> **Next Step**: Use Data Center insights to optimize your practice and track long-term progress. Return to [Visualizer](visualizer.md) for real-time monitoring or [Device Manager](device-manager.md) for device optimization! 