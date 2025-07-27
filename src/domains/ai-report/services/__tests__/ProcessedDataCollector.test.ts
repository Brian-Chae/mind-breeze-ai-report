import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessedDataCollector } from '../ProcessedDataCollector';
import { useProcessedDataStore } from '../../../../stores/processedDataStore';
import { AnalysisMetricsService } from '../AnalysisMetricsService';

// Mock the stores and services
vi.mock('../../../../stores/processedDataStore');
vi.mock('../AnalysisMetricsService');

describe('ProcessedDataCollector', () => {
  let collector: ProcessedDataCollector;
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup mock store state
    vi.mocked(useProcessedDataStore.getState).mockReturnValue({
      eegAnalysis: {
        bandPowers: {
          delta: 0.30,
          theta: 0.31,
          alpha: 0.43,
          beta: 0.49,
          gamma: 0.16
        },
        indices: {
          focusIndex: 75,
          relaxationIndex: 70,
          stressIndex: 30,
          attentionIndex: 72,
          meditationIndex: 68,
          hemisphericBalance: 0.95,
          cognitiveLoad: 55,
          emotionalStability: 90
        }
      },
      ppgAnalysis: {
        indices: {
          heartRate: 72,
          rmssd: 45,
          sdnn: 42,
          pnn50: 19,
          lfPower: 890,
          hfPower: 560,
          lfHfRatio: 1.59,
          stressIndex: 35,
          spo2: 97
        }
      },
      accAnalysis: {
        indices: {
          activity: 1.2,
          intensity: 0.1,
          activityState: 'sitting',
          stability: 84,
          balance: 78
        }
      },
      signalQuality: {
        eegQuality: 99,
        ppgQuality: 100,
        artifactDetection: {
          eyeBlink: false,
          movement: false
        }
      }
    } as any);
    
    // Setup mock AnalysisMetricsService
    const mockAnalysisMetrics = {
      getCurrentHRV: vi.fn().mockReturnValue(45),
      getCurrentRMSSD: vi.fn().mockReturnValue(36),
      getCurrentPNN50: vi.fn().mockReturnValue(19),
      getCurrentSDNN: vi.fn().mockReturnValue(42),
      getCurrentVlfPower: vi.fn().mockReturnValue(120),
      getCurrentLfPower: vi.fn().mockReturnValue(890),
      getCurrentHfPower: vi.fn().mockReturnValue(560),
      getCurrentLfNorm: vi.fn().mockReturnValue(61),
      getCurrentHfNorm: vi.fn().mockReturnValue(39),
      getCurrentLfHfRatio: vi.fn().mockReturnValue(1.59),
      getCurrentTotalPower: vi.fn().mockReturnValue(1570),
      getCurrentStressIndex: vi.fn().mockReturnValue(35),
      getCurrentRecoveryIndex: vi.fn().mockReturnValue(78),
      getCurrentAutonomicBalance: vi.fn().mockReturnValue(0.77),
      getCurrentCardiacCoherence: vi.fn().mockReturnValue(75),
      getCurrentRespiratoryRate: vi.fn().mockReturnValue(14),
      getCurrentPerfusionIndex: vi.fn().mockReturnValue(2.5),
      getCurrentVascularTone: vi.fn().mockReturnValue(83),
      getCurrentSystolicBP: vi.fn().mockReturnValue(120),
      getCurrentDiastolicBP: vi.fn().mockReturnValue(80),
      getCurrentCardiacEfficiency: vi.fn().mockReturnValue(85),
      getCurrentMetabolicRate: vi.fn().mockReturnValue(1870)
    };
    
    vi.mocked(AnalysisMetricsService.getInstance).mockReturnValue(mockAnalysisMetrics as any);
    
    // Create collector instance
    collector = new ProcessedDataCollector({
      sessionId: 'test-session-123',
      measurementId: 'test-measurement-456',
      userId: 'test-user-789',
      samplingInterval: 100 // 100ms for faster testing
    });
  });
  
  describe('initialization', () => {
    it('should initialize with correct config', () => {
      expect(collector).toBeDefined();
      expect(collector.isCollectingData()).toBe(false);
      expect(collector.getDataPointCount()).toBe(0);
    });
  });
  
  describe('data collection from ProcessedDataStore', () => {
    it('should collect data from ProcessedDataStore when started', async () => {
      // Setup data collection callback
      const dataPoints: any[] = [];
      collector.onDataPointCollected((metrics, index) => {
        dataPoints.push({ metrics, index });
      });
      
      // Start collection
      collector.start();
      expect(collector.isCollectingData()).toBe(true);
      
      // Wait for a few data points
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // Stop collection
      collector.stop();
      expect(collector.isCollectingData()).toBe(false);
      
      // Verify data was collected
      expect(dataPoints.length).toBeGreaterThanOrEqual(3);
      
      // Check first data point
      const firstPoint = dataPoints[0];
      expect(firstPoint.index).toBe(0);
      expect(firstPoint.metrics.eeg.focusIndex).toBe(75);
      expect(firstPoint.metrics.ppg.heartRate).toBe(72);
      expect(firstPoint.metrics.acc.activityLevel).toBeCloseTo(1.2, 1);
    });
  });
  
  describe('time series data structure', () => {
    it('should build correct time series data', async () => {
      let collectedData: any = null;
      
      // Setup completion callback
      collector.onCollectionComplete((data) => {
        collectedData = data;
      });
      
      // Start collection
      collector.start();
      
      // Collect for 600ms (6 data points at 100ms interval)
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Get collected data
      const data = collector.getCollectedData();
      
      expect(data).toBeDefined();
      expect(data?.eeg.focusIndex.length).toBeGreaterThanOrEqual(5);
      expect(data?.ppg.heartRate.length).toBeGreaterThanOrEqual(5);
      expect(data?.ppg.lf.length).toBeGreaterThanOrEqual(5);
      expect(data?.ppg.hf.length).toBeGreaterThanOrEqual(5);
      expect(data?.ppg.lfHfRatio.length).toBeGreaterThanOrEqual(5);
      expect(data?.acc.activityLevel.length).toBeGreaterThanOrEqual(5);
      
      // Verify HRV frequency domain data
      expect(data?.ppg.vlf).toBeDefined();
      expect(data?.ppg.lf).toBeDefined();
      expect(data?.ppg.hf).toBeDefined();
      expect(data?.ppg.lfNorm).toBeDefined();
      expect(data?.ppg.hfNorm).toBeDefined();
      expect(data?.ppg.lfHfRatio).toBeDefined();
      expect(data?.ppg.totalPower).toBeDefined();
      
      collector.stop();
    });
  });
  
  describe('fusion metrics calculation', () => {
    it('should calculate fusion metrics correctly', async () => {
      // Start collection
      collector.start();
      
      // Collect for a short time
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get collected data
      const data = collector.getCollectedData();
      
      expect(data).toBeDefined();
      expect(data?.fusedMetrics).toBeDefined();
      expect(data?.fusedMetrics.overallStress.length).toBeGreaterThan(0);
      expect(data?.fusedMetrics.cognitiveStress.length).toBeGreaterThan(0);
      expect(data?.fusedMetrics.physicalStress.length).toBeGreaterThan(0);
      expect(data?.fusedMetrics.fatigueLevel.length).toBeGreaterThan(0);
      expect(data?.fusedMetrics.alertnessLevel.length).toBeGreaterThan(0);
      expect(data?.fusedMetrics.wellbeingScore.length).toBeGreaterThan(0);
      
      // Verify fusion calculation logic
      const firstOverallStress = data?.fusedMetrics.overallStress[0];
      expect(firstOverallStress).toBeGreaterThan(0);
      expect(firstOverallStress).toBeLessThan(100);
      
      collector.stop();
    });
  });
});