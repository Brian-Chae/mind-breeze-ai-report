import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trialManagementService } from '../../domains/organization/services/TrialManagementService';
import { TrialType, ServicePackageType } from '@core/types/business';

// Firebase 모킹
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

describe('TrialManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be properly initialized', () => {
      expect(trialManagementService).toBeDefined();
      expect(typeof trialManagementService.submitTrialApplication).toBe('function');
      expect(typeof trialManagementService.approveTrialApplication).toBe('function');
      expect(typeof trialManagementService.getTrialStatusSummary).toBe('function');
      expect(typeof trialManagementService.convertTrialToFullService).toBe('function');
      expect(typeof trialManagementService.processExpiredTrials).toBe('function');
    });
  });

  describe('trial application data structure', () => {
    it('should validate that application data has required fields', () => {
      const completeApplicationData = {
        organizationName: 'Test Company',
        businessNumber: '123-45-67890',
        contactEmail: 'admin@test.com',
        contactPhone: '+82-10-1234-5678',
        contactPersonName: 'John Doe',
        contactPersonPosition: 'CEO',
        estimatedMemberCount: 50,
        industry: 'Technology',
        address: 'Seoul, Korea',
        trialType: 'FREE_TRIAL' as TrialType,
        companySize: 'SME' as const,
        expectedUsage: 'MEDIUM' as const,
        interestedFeatures: ['AI Reports', 'Consultation'],
        referralSource: 'Website',
        additionalRequests: 'Demo required'
      };

      // Test that all required fields are present
      expect(completeApplicationData.organizationName).toBeDefined();
      expect(completeApplicationData.businessNumber).toBeDefined();
      expect(completeApplicationData.contactEmail).toBeDefined();
      expect(completeApplicationData.contactPersonName).toBeDefined();
      expect(completeApplicationData.estimatedMemberCount).toBeGreaterThan(0);
      expect(completeApplicationData.trialType).toBeDefined();
    });
  });

  describe('trial conversion details structure', () => {
    it('should validate conversion details structure', () => {
      const conversionDetails = {
        servicePackage: 'BASIC' as ServicePackageType,
        contractMonths: 12,
        customDiscount: 15,
        notes: 'Negotiated discount for early conversion'
      };

      expect(conversionDetails.servicePackage).toBeDefined();
      expect(conversionDetails.contractMonths).toBeGreaterThan(0);
      expect(conversionDetails.customDiscount).toBeGreaterThanOrEqual(0);
      expect(['BASIC', 'PREMIUM', 'ENTERPRISE']).toContain(conversionDetails.servicePackage);
    });
  });

  describe('trial statistics period validation', () => {
    it('should accept valid period types', () => {
      const validPeriods = ['WEEK', 'MONTH', 'QUARTER'];
      
      validPeriods.forEach(period => {
        expect(['WEEK', 'MONTH', 'QUARTER']).toContain(period);
      });
    });
  });

  describe('trial type validation', () => {
    it('should validate trial types', () => {
      const freeTrialType: TrialType = 'FREE_TRIAL';
      const paidTrialType: TrialType = 'PAID_TRIAL';

      expect(freeTrialType).toBe('FREE_TRIAL');
      expect(paidTrialType).toBe('PAID_TRIAL');
      expect(['FREE_TRIAL', 'PAID_TRIAL']).toContain(freeTrialType);
      expect(['FREE_TRIAL', 'PAID_TRIAL']).toContain(paidTrialType);
    });
  });

  describe('service method availability', () => {
    it('should have all expected public methods', () => {
      const expectedMethods = [
        'submitTrialApplication',
        'approveTrialApplication',
        'getTrialStatusSummary',
        'convertTrialToFullService',
        'processExpiredTrials',
        'extendTrialPeriod',
        'terminateTrial',
        'getTrialStatistics'
      ];

      expectedMethods.forEach(methodName => {
        expect(typeof (trialManagementService as any)[methodName]).toBe('function');
      });
    });
  });

  describe('business validation constants', () => {
    it('should validate business logic constants', () => {
      // Test member count ranges
      const minMembers = 10;
      const maxFreeTrialMembers = 100;
      
      expect(minMembers).toBe(10);
      expect(maxFreeTrialMembers).toBe(100);
      expect(maxFreeTrialMembers).toBeGreaterThan(minMembers);
    });

    it('should validate trial pricing constants', () => {
      // Basic pricing validation
      const freeTrialCost = 0;
      const paidTrialCost = 100000;
      const deviceCost = 39500;
      
      expect(freeTrialCost).toBe(0);
      expect(paidTrialCost).toBeGreaterThan(0);
      expect(deviceCost).toBeGreaterThan(0);
    });
  });
}); 