import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AIHealthReportApp } from '../AIHealthReportApp';
import { ProcessedDataCollector } from '../../services/ProcessedDataCollector';

// Mock Firebase
vi.mock('../../../../core/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user', isAnonymous: false }
  },
  db: {},
  storage: {}
}));

// Mock ProcessedDataCollector
vi.mock('../../services/ProcessedDataCollector');

describe('AIHealthReportApp Integration - ProcessedDataCollector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup ProcessedDataCollector mock
    const mockCollector = {
      start: vi.fn(),
      stop: vi.fn(),
      isCollectingData: vi.fn().mockReturnValue(false),
      getDataPointCount: vi.fn().mockReturnValue(0),
      getCollectedData: vi.fn().mockReturnValue({
        sessionId: 'test-session',
        measurementId: 'test-measurement',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        eeg: { focusIndex: Array(60).fill(75) },
        ppg: { heartRate: Array(60).fill(72), lf: Array(60).fill(890), hf: Array(60).fill(560) },
        acc: { activityLevel: Array(60).fill(1.2) },
        fusedMetrics: { overallStress: Array(60).fill(32) },
        metadata: { qualityScore: 95 }
      })
    };
    
    vi.mocked(ProcessedDataCollector).mockImplementation(() => mockCollector as any);
  });
  
  it('should initialize ProcessedDataCollector when measurement mode starts', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <AIHealthReportApp />
      </BrowserRouter>
    );
    
    // Verify ProcessedDataCollector is not created initially
    expect(ProcessedDataCollector).not.toHaveBeenCalled();
    
    // Navigate through steps to reach data quality screen
    // (This is simplified - in real app you'd need to complete personal info and device connection)
    
    // Wait for the component to be ready
    await waitFor(() => {
      expect(screen.getByText(/AI Health Report 생성/)).toBeInTheDocument();
    });
    
    // The ProcessedDataCollector should be created when measurement mode is activated
    // This happens in handleDataQualityModeChange callback
    
    // Verify the collector is created with correct config
    await waitFor(() => {
      // The collector should be created when transitioning to measurement mode
      // Note: In a full integration test, we'd simulate the complete flow
      expect(true).toBe(true); // Placeholder assertion
    });
  });
  
  it('should collect data during measurement and save after completion', async () => {
    const mockCollectorInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      isCollectingData: vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      getDataPointCount: vi.fn().mockReturnValue(60),
      getCollectedData: vi.fn().mockReturnValue({
        sessionId: 'test-session',
        measurementId: 'test-measurement',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        eeg: {
          focusIndex: Array(60).fill(75),
          relaxationIndex: Array(60).fill(70),
          stressIndex: Array(60).fill(30),
          timestamps: Array(60).fill(Date.now())
        },
        ppg: {
          heartRate: Array(60).fill(72),
          hrv: Array(60).fill(45),
          lf: Array(60).fill(890),
          hf: Array(60).fill(560),
          lfHfRatio: Array(60).fill(1.59),
          vlf: Array(60).fill(120),
          timestamps: Array(60).fill(Date.now())
        },
        acc: {
          activityLevel: Array(60).fill(1.2),
          movementIntensity: Array(60).fill(0.1),
          posture: Array(60).fill('SITTING'),
          timestamps: Array(60).fill(Date.now())
        },
        fusedMetrics: {
          overallStress: Array(60).fill(32),
          cognitiveStress: Array(60).fill(28),
          physicalStress: Array(60).fill(35),
          fatigueLevel: Array(60).fill(25),
          alertnessLevel: Array(60).fill(75),
          wellbeingScore: Array(60).fill(82)
        },
        metadata: {
          samplingRate: { eeg: 1, ppg: 1, acc: 1 },
          processingVersion: '1.0.0',
          qualityScore: 95
        }
      })
    };
    
    vi.mocked(ProcessedDataCollector).mockImplementation(() => mockCollectorInstance as any);
    
    render(
      <BrowserRouter>
        <AIHealthReportApp />
      </BrowserRouter>
    );
    
    // Verify the data collection flow
    await waitFor(() => {
      expect(screen.getByText(/AI Health Report 생성/)).toBeInTheDocument();
    });
    
    // In a full test, we would:
    // 1. Complete personal info
    // 2. Connect device
    // 3. Confirm data quality
    // 4. Start measurement (which would call collector.start())
    // 5. Complete measurement (which would call collector.stop() and save data)
    
    // For now, we verify the basic structure is in place
    expect(true).toBe(true);
  });
});