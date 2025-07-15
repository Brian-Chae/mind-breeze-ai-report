import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creditManagementService } from '@domains/organization/services/CreditManagementService';
import { VolumeDiscountTier, CreditTransactionType } from '@core/types/business';

// Firebase 모킹
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  runTransaction: vi.fn(),
  increment: vi.fn((value) => ({ _increment: value })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

describe('CreditManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateVolumeDiscount', () => {
    it('should calculate correct pricing for different volume tiers', () => {
      const testCases = [
        {
          memberCount: 50,
          expectedTier: 'TIER_0' as VolumeDiscountTier,
          expectedDiscountPercent: 0,
        },
        {
          memberCount: 300,
          expectedTier: 'TIER_1' as VolumeDiscountTier,
          expectedDiscountPercent: 10,
        },
        {
          memberCount: 750,
          expectedTier: 'TIER_2' as VolumeDiscountTier,
          expectedDiscountPercent: 20,
        },
        {
          memberCount: 2500,
          expectedTier: 'TIER_3' as VolumeDiscountTier,
          expectedDiscountPercent: 25,
        },
        {
          memberCount: 10000,
          expectedTier: 'TIER_4' as VolumeDiscountTier,
          expectedDiscountPercent: 30,
        }
      ];

      testCases.forEach(({ memberCount, expectedTier, expectedDiscountPercent }) => {
        const result = creditManagementService.calculateVolumeDiscount(memberCount);
        
        expect(result.volumeTier).toBe(expectedTier);
        expect(result.discountPercent).toBe(expectedDiscountPercent);
        expect(result.memberCount).toBe(memberCount);
        expect(result.basePrice).toBe(7900);
      });
    });

    it('should calculate correct total costs', () => {
      const result = creditManagementService.calculateVolumeDiscount(1000);
      
      expect(result.memberCount).toBe(1000);
      expect(result.volumeTier).toBe('TIER_3');
      expect(result.discountPercent).toBe(25);
      expect(result.discountedPrice).toBe(5925); // 7900 * 0.75
      expect(result.totalServiceCost).toBe(5925000); // 5925 * 1000
    });
  });

  describe('credit cost calculations', () => {
    it('should return correct report costs', () => {
      expect(creditManagementService.getReportCreditCost('BASIC')).toBe(1);
      expect(creditManagementService.getReportCreditCost('DETAILED')).toBe(2);
      expect(creditManagementService.getReportCreditCost('COMPREHENSIVE')).toBe(3);
    });

    it('should return correct consultation costs', () => {
      expect(creditManagementService.getConsultationCreditCost('BASIC')).toBe(1);
      expect(creditManagementService.getConsultationCreditCost('PREMIUM')).toBe(2);
    });
  });

  describe('monthly cost estimation', () => {
    it('should calculate estimated monthly cost correctly', () => {
      const memberCount = 500;
      const usageRate = 0.8; // 80% usage rate
      
      const monthlyCost = creditManagementService.calculateEstimatedMonthlyCost(memberCount, usageRate);
      
      // Base calculation: 500 members * 1 credit/month * 6320 won (with 20% discount) * 0.8 usage rate
      const expectedCost = 500 * 6320 * 0.8;
      expect(monthlyCost).toBe(expectedCost);
    });
  });

  describe('service initialization', () => {
    it('should be properly initialized', () => {
      expect(creditManagementService).toBeDefined();
      expect(typeof creditManagementService.calculateVolumeDiscount).toBe('function');
      expect(typeof creditManagementService.getCreditBalance).toBe('function');
    });
  });
});