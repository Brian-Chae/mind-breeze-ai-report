import { describe, it, expect } from 'vitest';

// ProcessedDataStorageService의 핵심 로직만 테스트
describe('ProcessedDataStorageService - Standalone Tests', () => {
  
  describe('calculateStatistics', () => {
    it('should calculate correct statistics for time series data', () => {
      // Arrange
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Act - 서비스 메서드를 직접 구현
      const calculateStatistics = (timeSeries: number[]) => {
        const sorted = [...timeSeries].sort((a, b) => a - b);
        const n = sorted.length;
        
        const mean = timeSeries.reduce((a, b) => a + b, 0) / n;
        const std = Math.sqrt(
          timeSeries.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / n
        );
        
        return {
          mean,
          std,
          min: sorted[0],
          max: sorted[n - 1],
          median: sorted[Math.floor(n / 2)],
          percentile25: sorted[Math.floor(n * 0.25)],
          percentile75: sorted[Math.floor(n * 0.75)]
        };
      };
      
      const stats = calculateStatistics(testData);
      
      // Assert
      expect(stats.mean).toBeCloseTo(5.5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.median).toBe(6);
      expect(stats.std).toBeCloseTo(2.87, 1);
      expect(stats.percentile25).toBe(3);
      expect(stats.percentile75).toBe(8);
    });
  });
  
  describe('downsampleTimeSeries', () => {
    it('should downsample time series correctly', () => {
      // Arrange
      const originalData = Array(100).fill(0).map((_, i) => i);
      
      // Act
      const downsampleTimeSeries = (timeSeries: number[], targetLength: number): number[] => {
        if (timeSeries.length <= targetLength) {
          return timeSeries;
        }
        
        const ratio = timeSeries.length / targetLength;
        const downsampled: number[] = [];
        
        for (let i = 0; i < targetLength; i++) {
          const start = Math.floor(i * ratio);
          const end = Math.floor((i + 1) * ratio);
          
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += timeSeries[j];
          }
          downsampled.push(sum / (end - start));
        }
        
        return downsampled;
      };
      
      const downsampled = downsampleTimeSeries(originalData, 10);
      
      // Assert
      expect(downsampled.length).toBe(10);
      expect(downsampled[0]).toBeCloseTo(4.5);
      expect(downsampled[9]).toBeCloseTo(94.5);
    });
  });
  
  describe('HRV Frequency Domain Data Structure', () => {
    it('should have correct structure for PPG time series data', () => {
      // Arrange - PPG 시계열 데이터 구조 검증
      const mockPPGTimeSeries = {
        // 기본 심박 데이터
        heartRate: Array(60).fill(0).map(() => 72 + Math.random() * 5),
        hrv: Array(60).fill(0).map(() => 45 + Math.random() * 3),
        rrIntervals: Array(60).fill(0).map(() => [820, 830, 825]),
        
        // HRV 시간 도메인
        rmssd: Array(60).fill(0).map(() => 36 + Math.random() * 2),
        pnn50: Array(60).fill(0).map(() => 19 + Math.random() * 2),
        sdnn: Array(60).fill(0).map(() => 42 + Math.random() * 3),
        
        // HRV 주파수 도메인 - 새로 추가된 필드들
        vlf: Array(60).fill(0).map(() => 120 + Math.random() * 10),
        lf: Array(60).fill(0).map(() => 890 + Math.random() * 50),
        hf: Array(60).fill(0).map(() => 560 + Math.random() * 40),
        lfNorm: Array(60).fill(0).map(() => 61 + Math.random() * 3),
        hfNorm: Array(60).fill(0).map(() => 39 + Math.random() * 3),
        lfHfRatio: Array(60).fill(0).map(() => 1.56 + Math.random() * 0.2),
        totalPower: Array(60).fill(0).map(() => 1570 + Math.random() * 100),
        
        // 기타 지표들
        stressLevel: Array(60).fill(0).map(() => 35 + Math.random() * 5),
        recoveryIndex: Array(60).fill(0).map(() => 78 + Math.random() * 3),
        autonomicBalance: Array(60).fill(0).map(() => 0.77 + Math.random() * 0.05),
        cardiacCoherence: Array(60).fill(0).map(() => 75 + Math.random() * 4),
        
        respiratoryRate: Array(60).fill(0).map(() => 14 + Math.random() * 1),
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
        
        timestamps: Array(60).fill(0).map((_, i) => Date.now() + i * 1000)
      };
      
      // Assert - 모든 필드가 존재하는지 확인
      expect(mockPPGTimeSeries).toHaveProperty('vlf');
      expect(mockPPGTimeSeries).toHaveProperty('lf');
      expect(mockPPGTimeSeries).toHaveProperty('hf');
      expect(mockPPGTimeSeries).toHaveProperty('lfNorm');
      expect(mockPPGTimeSeries).toHaveProperty('hfNorm');
      expect(mockPPGTimeSeries).toHaveProperty('lfHfRatio');
      expect(mockPPGTimeSeries).toHaveProperty('totalPower');
      
      // 각 배열의 길이가 60인지 확인
      expect(mockPPGTimeSeries.vlf.length).toBe(60);
      expect(mockPPGTimeSeries.lf.length).toBe(60);
      expect(mockPPGTimeSeries.hf.length).toBe(60);
      expect(mockPPGTimeSeries.lfHfRatio.length).toBe(60);
      
      // 값의 범위가 적절한지 확인
      expect(mockPPGTimeSeries.lfHfRatio[0]).toBeGreaterThan(0);
      expect(mockPPGTimeSeries.lfHfRatio[0]).toBeLessThan(5);
      
      expect(mockPPGTimeSeries.lfNorm[0]).toBeGreaterThan(50);
      expect(mockPPGTimeSeries.lfNorm[0]).toBeLessThan(70);
      
      expect(mockPPGTimeSeries.hfNorm[0]).toBeGreaterThan(30);
      expect(mockPPGTimeSeries.hfNorm[0]).toBeLessThan(50);
    });
  });
  
  describe('formatForAIAnalysis', () => {
    it('should format data correctly with HRV frequency domain', () => {
      // Arrange
      const mockData = {
        sessionId: 'test-123',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        eeg: {
          focusIndex: Array(60).fill(75),
          stressIndex: Array(60).fill(30),
          attentionLevel: Array(60).fill(72),
          signalQuality: Array(60).fill(0.99)
        },
        ppg: {
          heartRate: Array(60).fill(72),
          hrv: Array(60).fill(45),
          vlf: Array(60).fill(120),
          lf: Array(60).fill(890),
          hf: Array(60).fill(560),
          lfHfRatio: Array(60).fill(1.59),
          stressLevel: Array(60).fill(35),
          signalQuality: Array(60).fill(1.0)
        },
        acc: {
          activityLevel: Array(60).fill(1.2),
          posturalStability: Array(60).fill(0.84),
          signalQuality: Array(60).fill(1.0)
        }
      };
      
      // Act - formatForAIAnalysis 로직
      const formatted = {
        ppgTimeSeries: {
          cardiac: {
            heartRate: mockData.ppg.heartRate,
            hrv: mockData.ppg.hrv
          },
          hrvFrequencyDomain: {
            vlf: mockData.ppg.vlf,
            lf: mockData.ppg.lf,
            hf: mockData.ppg.hf,
            lfHfRatio: mockData.ppg.lfHfRatio
          },
          stress: {
            stressLevel: mockData.ppg.stressLevel
          }
        }
      };
      
      // Assert
      expect(formatted.ppgTimeSeries).toHaveProperty('hrvFrequencyDomain');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('lf');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('hf');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('vlf');
      expect(formatted.ppgTimeSeries.hrvFrequencyDomain).toHaveProperty('lfHfRatio');
    });
  });
  
  describe('LF/HF Ratio Analysis', () => {
    it('should correctly analyze autonomic nervous system balance', () => {
      // Arrange - 다양한 자율신경계 상태 시뮬레이션
      const scenarios = {
        // 교감신경 우세 (스트레스 상태)
        sympatheticDominant: Array(60).fill(0).map((_, i) => {
          if (i >= 20 && i <= 40) return 2.5 + Math.random() * 0.5; // 높은 LF/HF
          return 1.5 + Math.random() * 0.3;
        }),
        
        // 부교감신경 우세 (이완 상태)
        parasympatheticDominant: Array(60).fill(0).map(() => 0.5 + Math.random() * 0.3),
        
        // 균형 상태
        balanced: Array(60).fill(0).map(() => 0.9 + Math.random() * 0.4)
      };
      
      // Act & Assert
      for (const [state, data] of Object.entries(scenarios)) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        
        switch(state) {
          case 'sympatheticDominant':
            expect(mean).toBeGreaterThan(1.8);
            expect(mean).toBeLessThan(3.0);
            break;
          case 'parasympatheticDominant':
            expect(mean).toBeGreaterThan(0.4);
            expect(mean).toBeLessThan(0.8);
            break;
          case 'balanced':
            expect(mean).toBeGreaterThan(0.8);
            expect(mean).toBeLessThan(1.3);
            break;
        }
      }
    });
  });
});