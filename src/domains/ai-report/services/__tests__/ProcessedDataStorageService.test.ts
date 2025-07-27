import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase 전체 모킹
vi.mock('../../../core/services/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => date)
  }
}));

// 모듈을 동적으로 가져오기 (모킹 후)
let ProcessedDataStorageService: any;
let ProcessedDataTimeSeries: any;

describe('ProcessedDataStorageService', () => {
  let service: any;
  let mockProcessedData: any;

  beforeAll(async () => {
    // 모킹 후 모듈 가져오기
    const module = await import('../ProcessedDataStorageService');
    ProcessedDataStorageService = module.ProcessedDataStorageService;
  });

  beforeEach(() => {
    service = new ProcessedDataStorageService();
    
    // 모의 데이터 생성
    mockProcessedData = {
      sessionId: 'test-session-123',
      measurementId: 'test-measurement-456',
      startTime: new Date('2025-01-26T10:00:00Z'),
      endTime: new Date('2025-01-26T10:01:00Z'),
      duration: 60,
      
      eeg: {
        // 60초 데이터 생성
        deltaPower: Array(60).fill(0).map((_, i) => 0.3 + Math.sin(i / 10) * 0.05),
        thetaPower: Array(60).fill(0).map((_, i) => 0.31 + Math.sin(i / 8) * 0.04),
        alphaPower: Array(60).fill(0).map((_, i) => 0.43 + Math.sin(i / 12) * 0.06),
        betaPower: Array(60).fill(0).map((_, i) => 0.49 + Math.sin(i / 15) * 0.05),
        gammaPower: Array(60).fill(0).map((_, i) => 0.16 + Math.sin(i / 20) * 0.03),
        
        focusIndex: Array(60).fill(0).map((_, i) => 75 + Math.sin(i / 10) * 5),
        relaxationIndex: Array(60).fill(0).map((_, i) => 70 + Math.sin(i / 12) * 4),
        stressIndex: Array(60).fill(0).map((_, i) => 30 + Math.sin(i / 8) * 3),
        attentionLevel: Array(60).fill(0).map((_, i) => 72 + Math.sin(i / 11) * 4),
        meditationLevel: Array(60).fill(0).map((_, i) => 68 + Math.sin(i / 13) * 5),
        
        hemisphericBalance: Array(60).fill(0).map(() => 0.95 + Math.random() * 0.1),
        cognitiveLoad: Array(60).fill(0).map(() => 55 + Math.random() * 10),
        emotionalStability: Array(60).fill(0).map(() => 90 + Math.random() * 5),
        
        signalQuality: Array(60).fill(0.99),
        artifactRatio: Array(60).fill(0.01),
        
        timestamps: Array(60).fill(0).map((_, i) => 1706266800000 + i * 1000)
      },
      
      ppg: {
        heartRate: Array(60).fill(0).map((_, i) => 72 + Math.sin(i / 5) * 3),
        hrv: Array(60).fill(0).map((_, i) => 45 + Math.sin(i / 7) * 2),
        rrIntervals: Array(60).fill(0).map(() => [820, 830, 825, 815]),
        
        // HRV 시간 도메인
        rmssd: Array(60).fill(0).map((_, i) => 36 + Math.sin(i / 6) * 2),
        pnn50: Array(60).fill(0).map((_, i) => 19 + Math.sin(i / 8) * 1.5),
        sdnn: Array(60).fill(0).map((_, i) => 42 + Math.sin(i / 9) * 3),
        
        // HRV 주파수 도메인
        vlf: Array(60).fill(0).map((_, i) => 120 + Math.sin(i / 10) * 10),
        lf: Array(60).fill(0).map((_, i) => 890 + Math.sin(i / 8) * 50),
        hf: Array(60).fill(0).map((_, i) => 560 + Math.sin(i / 6) * 40),
        lfNorm: Array(60).fill(0).map((_, i) => 61 + Math.sin(i / 7) * 2),
        hfNorm: Array(60).fill(0).map((_, i) => 39 + Math.sin(i / 7) * 2),
        lfHfRatio: Array(60).fill(0).map((_, i) => 1.56 + Math.sin(i / 8) * 0.1),
        totalPower: Array(60).fill(0).map((_, i) => 1570 + Math.sin(i / 9) * 100),
        
        stressLevel: Array(60).fill(0).map((_, i) => 35 + Math.sin(i / 10) * 5),
        recoveryIndex: Array(60).fill(0).map((_, i) => 78 + Math.sin(i / 12) * 3),
        autonomicBalance: Array(60).fill(0).map((_, i) => 0.77 + Math.sin(i / 15) * 0.05),
        cardiacCoherence: Array(60).fill(0).map((_, i) => 75 + Math.sin(i / 11) * 4),
        
        respiratoryRate: Array(60).fill(0).map((_, i) => 14 + Math.sin(i / 20) * 1),
        oxygenSaturation: Array(60).fill(0).map(() => 97 + Math.random() * 1),
        
        perfusionIndex: Array(60).fill(0).map(() => 2.5 + Math.random() * 0.2),
        vascularTone: Array(60).fill(0).map(() => 83 + Math.random() * 3),
        bloodPressureTrend: {
          systolic: Array(60).fill(0).map(() => 120 + Math.random() * 5),
          diastolic: Array(60).fill(0).map(() => 80 + Math.random() * 3)
        },
        
        cardiacEfficiency: Array(60).fill(0).map(() => 85 + Math.random() * 2),
        metabolicRate: Array(60).fill(0).map(() => 1870 + Math.random() * 50),
        
        signalQuality: Array(60).fill(1.0),
        motionArtifact: Array(60).fill(0),
        
        timestamps: Array(60).fill(0).map((_, i) => 1706266800000 + i * 1000)
      },
      
      acc: {
        activityLevel: Array(60).fill(0).map(() => 1 + Math.random() * 0.5),
        movementIntensity: Array(60).fill(0).map(() => 0.1 + Math.random() * 0.05),
        
        posture: Array(60).fill('SITTING'),
        posturalStability: Array(60).fill(0).map(() => 0.84 + Math.random() * 0.05),
        posturalTransitions: Array(60).fill(0),
        
        stepCount: Array(60).fill(0),
        stepRate: Array(60).fill(0),
        movementQuality: Array(60).fill(0).map(() => 0.78 + Math.random() * 0.05),
        energyExpenditure: Array(60).fill(0).map(() => 1.9 + Math.random() * 0.1),
        
        movementEvents: [],
        
        signalQuality: Array(60).fill(1.0),
        
        timestamps: Array(60).fill(0).map((_, i) => 1706266800000 + i * 1000)
      },
      
      fusedMetrics: {
        overallStress: Array(60).fill(0).map((_, i) => 32 + Math.sin(i / 10) * 4),
        cognitiveStress: Array(60).fill(0).map((_, i) => 28 + Math.sin(i / 12) * 3),
        physicalStress: Array(60).fill(0).map((_, i) => 35 + Math.sin(i / 8) * 5),
        fatigueLevel: Array(60).fill(0).map((_, i) => 25 + Math.sin(i / 15) * 4),
        alertnessLevel: Array(60).fill(0).map((_, i) => 75 + Math.sin(i / 10) * 5),
        wellbeingScore: Array(60).fill(0).map((_, i) => 82 + Math.sin(i / 20) * 3)
      },
      
      metadata: {
        samplingRate: {
          eeg: 1,
          ppg: 1,
          acc: 1
        },
        processingVersion: '1.0.0',
        qualityScore: 99.5
      }
    };
    
    // Mock 함수 초기화
    vi.clearAllMocks();
  });

  describe('saveProcessedTimeSeries', () => {
    it('should save processed time series data successfully', async () => {
      // Arrange
      const mockDocRef = { id: 'test-doc-id' };
      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      const result = await service.saveProcessedTimeSeries(mockProcessedData);

      // Assert
      expect(result).toBe('test-session-123_processed');
      
      // 메타데이터 저장 확인
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          sessionId: 'test-session-123',
          measurementId: 'test-measurement-456',
          duration: 60,
          hasEEGData: true,
          hasPPGData: true,
          hasACCData: true,
          hasFusedMetrics: true
        })
      );
      
      // 청크 데이터 저장 확인 (EEG, PPG, ACC, Fused 각각)
      expect(setDoc).toHaveBeenCalledTimes(5); // 메타데이터 + 4개 청크
    });

    it('should handle missing fused metrics', async () => {
      // Arrange
      const dataWithoutFused = { ...mockProcessedData, fusedMetrics: undefined };
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      await service.saveProcessedTimeSeries(dataWithoutFused);

      // Assert
      expect(setDoc).toHaveBeenCalledTimes(4); // 메타데이터 + 3개 청크 (fused 제외)
    });
  });

  describe('loadProcessedTimeSeries', () => {
    it('should load processed time series data successfully', async () => {
      // Arrange
      const mockMetaDoc = {
        exists: () => true,
        data: () => ({
          sessionId: 'test-session-123',
          measurementId: 'test-measurement-456',
          startTime: { toDate: () => new Date('2025-01-26T10:00:00Z') },
          endTime: { toDate: () => new Date('2025-01-26T10:01:00Z') },
          duration: 60,
          hasEEGData: true,
          hasPPGData: true,
          hasACCData: true,
          hasFusedMetrics: true,
          metadata: mockProcessedData.metadata
        })
      };

      const mockChunkDoc = {
        exists: () => true,
        data: () => ({ ...mockProcessedData.eeg, chunkType: 'eeg', createdAt: new Date() })
      };

      vi.mocked(getDoc).mockResolvedValueOnce(mockMetaDoc as any)
        .mockResolvedValueOnce(mockChunkDoc as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockProcessedData.ppg } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockProcessedData.acc } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockProcessedData.fusedMetrics } as any);

      // Act
      const result = await service.loadProcessedTimeSeries('test-session-123');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('test-session-123');
      expect(result?.measurementId).toBe('test-measurement-456');
      expect(result?.duration).toBe(60);
    });

    it('should return null for non-existent session', async () => {
      // Arrange
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      // Act
      const result = await service.loadProcessedTimeSeries('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate correct statistics for time series data', () => {
      // Arrange
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      // Act
      const stats = service.calculateStatistics(testData);

      // Assert
      expect(stats.mean).toBeCloseTo(5.5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.median).toBe(6); // 중간값
      expect(stats.std).toBeGreaterThan(0);
      expect(stats.percentile25).toBe(3);
      expect(stats.percentile75).toBe(8);
    });
  });

  describe('downsampleTimeSeries', () => {
    it('should downsample time series correctly', () => {
      // Arrange
      const originalData = Array(100).fill(0).map((_, i) => i);

      // Act
      const downsampled = service.downsampleTimeSeries(originalData, 10);

      // Assert
      expect(downsampled.length).toBe(10);
      expect(downsampled[0]).toBeCloseTo(4.5); // 평균 of 0-9
      expect(downsampled[9]).toBeCloseTo(94.5); // 평균 of 90-99
    });

    it('should return original data if already smaller than target', () => {
      // Arrange
      const originalData = [1, 2, 3, 4, 5];

      // Act
      const downsampled = service.downsampleTimeSeries(originalData, 10);

      // Assert
      expect(downsampled).toEqual(originalData);
    });
  });

  describe('formatForAIAnalysis', () => {
    it('should format data correctly for AI analysis', () => {
      // Act
      const formatted = service.formatForAIAnalysis(mockProcessedData);

      // Assert
      expect(formatted).toHaveProperty('sessionInfo');
      expect(formatted).toHaveProperty('eegTimeSeries');
      expect(formatted).toHaveProperty('ppgTimeSeries');
      expect(formatted).toHaveProperty('accTimeSeries');
      expect(formatted).toHaveProperty('fusedMetrics');
      expect(formatted).toHaveProperty('statistics');

      // EEG 시계열 확인
      expect(formatted.eegTimeSeries.bandPowers).toHaveProperty('delta');
      expect(formatted.eegTimeSeries.bandPowers.delta.length).toBe(60);

      // PPG 시계열 확인 - HRV 주파수 도메인 포함
      expect(formatted.ppgTimeSeries).toHaveProperty('hrvFrequencyDomain');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('lf');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('hf');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('lfHfRatio');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain.lf.length).toBe(60);

      // 통계 확인
      expect(formatted.statistics.ppg).toHaveProperty('heartRate');
      expect(formatted.statistics.ppg).toHaveProperty('lfHfRatio');
      expect(formatted.statistics.ppg.lfHfRatio).toHaveProperty('mean');
      expect(formatted.statistics.ppg.lfHfRatio).toHaveProperty('std');
    });
  });

  describe('HRV Frequency Domain Integration', () => {
    it('should save and load HRV frequency domain data correctly', async () => {
      // Arrange
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act - Save
      await service.saveProcessedTimeSeries(mockProcessedData);

      // Assert - PPG 청크에 HRV 주파수 도메인 데이터 포함 확인
      const ppgChunkCall = vi.mocked(setDoc).mock.calls.find(
        call => call[1].chunkType === 'ppg'
      );
      
      expect(ppgChunkCall).toBeDefined();
      expect(ppgChunkCall![1]).toHaveProperty('lf');
      expect(ppgChunkCall![1]).toHaveProperty('hf');
      expect(ppgChunkCall![1]).toHaveProperty('vlf');
      expect(ppgChunkCall![1]).toHaveProperty('lfHfRatio');
      expect(ppgChunkCall![1]).toHaveProperty('lfNorm');
      expect(ppgChunkCall![1]).toHaveProperty('hfNorm');
      expect(ppgChunkCall![1]).toHaveProperty('totalPower');
    });

    it('should calculate correct LF/HF ratio statistics', () => {
      // Arrange
      const lfHfData = mockProcessedData.ppg.lfHfRatio;

      // Act
      const stats = service.calculateStatistics(lfHfData);

      // Assert
      expect(stats.mean).toBeGreaterThan(0);
      expect(stats.mean).toBeLessThan(5); // 정상 범위
      expect(stats.min).toBeGreaterThan(0);
      expect(stats.max).toBeLessThan(10);
    });
  });
});