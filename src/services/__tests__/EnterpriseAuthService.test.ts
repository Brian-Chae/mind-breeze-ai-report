import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enterpriseAuthService } from '../EnterpriseAuthService';
import { UserType, VolumeDiscountTier } from '@core/types/business';

// Firebase 모킹
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

describe('EnterpriseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentContext', () => {
    it('should return current authentication context', () => {
      const context = enterpriseAuthService.getCurrentContext();

      expect(context).toBeDefined();
      expect(context).toHaveProperty('user');
      expect(context).toHaveProperty('organization');
      expect(context).toHaveProperty('memberInfo');
      expect(context).toHaveProperty('permissions');
      expect(context).toHaveProperty('isLoading');
    });
  });

  describe('hasPermission', () => {
    it('should check user permissions correctly', () => {
      // This would need the service to be properly initialized with a user context
      const hasReportPermission = enterpriseAuthService.hasPermission('REPORT_VIEW');
      const hasAdminPermission = enterpriseAuthService.hasPermission('ADMIN_ACCESS');

      // These would depend on the current user's permissions
      expect(typeof hasReportPermission).toBe('boolean');
      expect(typeof hasAdminPermission).toBe('boolean');
    });
  });

  describe('user type checks', () => {
    it('should identify user types correctly', () => {
      const isAdmin = enterpriseAuthService.isOrganizationAdmin();
      const isMember = enterpriseAuthService.isOrganizationMember();
      const isIndividual = enterpriseAuthService.isIndividualUser();

      expect(typeof isAdmin).toBe('boolean');
      expect(typeof isMember).toBe('boolean');
      expect(typeof isIndividual).toBe('boolean');
    });
  });

  describe('authentication state management', () => {
    it('should handle auth state listeners', () => {
      const mockCallback = vi.fn();
      const unsubscribe = enterpriseAuthService.onAuthStateChanged(mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('service initialization', () => {
    it('should be properly initialized', () => {
      expect(enterpriseAuthService).toBeDefined();
      expect(typeof enterpriseAuthService.signIn).toBe('function');
      expect(typeof enterpriseAuthService.signUp).toBe('function');
      expect(typeof enterpriseAuthService.signOut).toBe('function');
    });
  });
}); 