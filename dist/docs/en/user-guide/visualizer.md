# Visualizer User Guide

Visualizer is the core module that provides real-time visualization of biosignals collected from LINK BAND devices. It offers intuitive analysis by displaying EEG (brainwaves), PPG (pulse waves), and ACC (accelerometer) data through various charts and graphs.

## 🚀 Getting Started

### Accessing Visualizer
1. Click **"📊 Visualizer"** in the left sidebar
2. Or use keyboard shortcut `Ctrl+2` (Windows/Linux) or `Cmd+2` (macOS)
3. Device must be connected for data visualization

### Initial Screen Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Data Visualization                                       │
│ [🧠 EEG] [❤️ PPG] [🏃 ACC] [📈 Unified View] [⚙️ Settings]  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📱 Device Status                                            │
│ 🟢 LINK BAND-ABC123 Connected | 🔋 85% | 📶 Strong | ⏱️ 00:05:32 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Main Visualization Area                  │
│                                                             │
│                (Content changes based on selected tab)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 EEG Visualization

### EEG Tab Configuration
Clicking the EEG tab displays various visualizations of brainwave data:

```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 EEG Visualization                                        │
│ [📈 Real-time Waves] [📊 Frequency Analysis] [🎯 EEG Indices] [📋 Status] │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 📈 Real-time EEG (2 Channels)                              │
│ ┌─ CH1 ────────────────────────────────────────────────────┐ │
│ │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ (µV)                     │ │
│ │ Signal Quality: ✅ Excellent (95%) | Impedance: 5kΩ     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ CH2 ────────────────────────────────────────────────────┐ │
│ │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ (µV)                     │ │
│ │ Signal Quality: ✅ Excellent (92%) | Impedance: 7kΩ     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Real-time EEG Waveforms

#### Waveform Chart Features
- **2-Channel Simultaneous Display**: CH1, CH2 independent waveforms displayed in real-time
- **Auto Scaling**: Automatic Y-axis adjustment based on signal amplitude
- **Time Window Adjustment**: Selectable 5s, 10s, 30s, 60s options
- **Zoom Function**: Zoom in/out with mouse wheel
- **Panning**: Time axis navigation by dragging

#### Waveform Interpretation Guide
```
EEG Amplitude Range (µV):
├── Normal Range: 10-100 µV
├── Low Signal: < 10 µV (poor electrode contact)
├── High Signal: > 200 µV (EMG interference)
└── Saturated Signal: > 500 µV (electrode problem)

Frequency Characteristics:
├── Clean Signal: Smooth curves
├── Noisy Signal: Irregular spikes
├── Power Line Interference: 50/60Hz periodic pattern
└── Motion Artifacts: Abrupt changes
```

### Frequency Analysis

#### Band Power Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Frequency Band Analysis                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Delta (0.5-4Hz)   ████░░░░░░ 25% | Average: 12.5 µV²   │ │
│ │ Theta (4-8Hz)     ██████░░░░ 35% | Average: 18.2 µV²   │ │
│ │ Alpha (8-13Hz)    ████████░░ 65% | Average: 28.7 µV²   │ │
│ │ Beta (13-30Hz)    ██████░░░░ 45% | Average: 15.3 µV²   │ │
│ │ Gamma (30-100Hz)  ███░░░░░░░ 20% | Average: 8.1 µV²    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Meaning of Each Frequency Band
| Frequency Band | Range | Characteristics | State Interpretation |
|----------------|-------|-----------------|---------------------|
| **Delta** | 0.5-4Hz | Deep sleep | High: Drowsiness, fatigue |
| **Theta** | 4-8Hz | Creativity, meditation | High: Focus, creative thinking |
| **Alpha** | 8-13Hz | Relaxation, calm | High: Comfortable state |
| **Beta** | 13-30Hz | Focus, alertness | High: Active thinking |
| **Gamma** | 30-100Hz | Cognitive processing | High: Higher-order thinking |

### EEG Index Analysis

#### Cognitive State Indices
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 EEG Indices                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧠 Attention Index                                      │ │
│ │ ████████░░ 78% (High)                                   │ │
│ │ Formula: (Alpha + Beta) / (Theta + Delta)               │ │
│ │ Current: 2.1 | Average: 1.8 | Peak: 2.5                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 😌 Relaxation Index                                     │ │
│ │ ██████░░░░ 65% (Good)                                   │ │
│ │ Formula: Alpha / (Alpha + Beta)                         │ │
│ │ Current: 0.65 | Average: 0.58 | Peak: 0.82             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 😰 Stress Index                                         │ │
│ │ ███░░░░░░░ 25% (Low)                                    │ │
│ │ Formula: Beta / Alpha                                   │ │
│ │ Current: 0.25 | Average: 0.32 | Minimum: 0.18          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Index Interpretation Guide
**Attention Index**:
- 🟢 **High (70-100%)**: High attention state, optimal for learning/work
- 🟡 **Medium (40-70%)**: General attention state
- 🔴 **Low (0-40%)**: Distracted or fatigued state

**Relaxation Index**:
- 🟢 **High (70-100%)**: Deep relaxation state, suitable for meditation/rest
- 🟡 **Medium (40-70%)**: Moderate relaxation state
- 🔴 **Low (0-40%)**: Tense or aroused state

**Stress Index**:
- 🟢 **Low (0-30%)**: Stress-free calm state
- 🟡 **Medium (30-60%)**: Normal stress level
- 🔴 **High (60-100%)**: High stress, rest needed

> **Next Step**: Use the insights from Visualizer to make informed decisions about your mental and physical state. Proceed to [Data Center](data-center.md) for long-term analysis and reporting! 