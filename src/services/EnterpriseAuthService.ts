import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  UserType, 
  EnterpriseUser, 
  Organization,
  OrganizationMember,
  VolumeDiscountTier,
  OrganizationStatus,
  ServicePackageType,
  DEFAULT_BASE_PRICE,
  VOLUME_DISCOUNT_TIERS
} from '../types/business';

export interface LoginCredentials {
  email?: string;           // 개인 사용자용
  employeeId?: string;      // 조직 구성원용
  organizationId?: string;  // 조직 구성원용
  password: string;
}

export interface RegistrationData {
  userType: UserType;
  email?: string;           // 개인 사용자 및 조직 관리자용
  employeeId?: string;      // 조직 구성원용
  organizationId?: string;  // 조직 구성원용
  displayName: string;
  password: string;
  
  // 개인 정보
  phone?: string;           // 전화번호
  address?: string;         // 주소
  
  // 조직 관련 (조직 사용자만)
  department?: string;
  position?: string;
  
  // 조직 생성 (조직 관리자만)
  organizationData?: {
    name: string;
    businessNumber: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    initialMemberCount: number;
    servicePackage: ServicePackageType;
  };
}

export interface AuthContext {
  user: EnterpriseUser | null;
  organization: Organization | null;
  memberInfo: OrganizationMember | null;
  permissions: string[];
  isLoading: boolean;
  isTokenAccess?: boolean;  // 토큰 기반 접속 여부
}

export interface MeasurementSubjectAccess {
  userId: string;
  organizationId: string;
  accessToken: string;
  expiresAt: Date;
  reportIds: string[];  // 접근 가능한 리포트 ID들
}

class EnterpriseAuthService {
  private authStateListeners: ((context: AuthContext) => void)[] = [];
  private currentContext: AuthContext = {
    user: null,
    organization: null,
    memberInfo: null,
    permissions: [],
    isLoading: true
  };

  constructor() {
    // Firebase Auth 상태 변경 감지
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.loadUserContext(firebaseUser);
      } else {
        this.updateContext({
          user: null,
          organization: null,
          memberInfo: null,
          permissions: [],
          isLoading: false
        });
      }
    });
  }

  // === 인증 메서드 ===

  async signIn(credentials: LoginCredentials): Promise<EnterpriseUser> {
    try {
      let email: string;

      if (credentials.email) {
        // 개인 사용자 또는 조직 관리자 로그인
        email = credentials.email;
      } else if (credentials.employeeId && credentials.organizationId) {
        // 조직 구성원 로그인 - 직원ID로 이메일 찾기
        email = await this.findEmailByEmployeeId(
          credentials.employeeId, 
          credentials.organizationId
        );
      } else {
        throw new Error('이메일 또는 직원ID와 조직ID를 입력해주세요.');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        credentials.password
      );
      
      let user = await this.loadUserProfile(userCredential.user.uid);
      
      // 프로필이 없거나 불완전하면 생성/업데이트
      if (!user || user.email === 'unknown@example.com' || !user.userType) {
        console.log('🔧 사용자 프로필 업데이트 중...');
        user = await this.createOrUpdateUserProfile(userCredential.user, credentials);
      }

      if (!user) {
        throw new Error('사용자 프로필 생성에 실패했습니다.');
      }

      // 로그인 시간 업데이트
      await this.updateLastLogin(user.id);

      console.log('✅ 로그인 성공:', user.displayName);
      return user;

    } catch (error: any) {
      console.error('❌ 로그인 실패:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signUp(data: RegistrationData): Promise<EnterpriseUser> {
    try {
      let email: string;

      if (data.userType === 'INDIVIDUAL_USER' || data.userType === 'ORGANIZATION_ADMIN') {
        if (!data.email) {
          throw new Error('이메일은 필수입니다.');
        }
        email = data.email;
      } else {
        // 조직 구성원의 경우 임시 이메일 생성
        if (!data.employeeId || !data.organizationId) {
          throw new Error('직원ID와 조직ID는 필수입니다.');
        }
        email = `${data.employeeId}@${data.organizationId}.mindbreeze.internal`;
      }

      // Firebase 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        data.password
      );

      // 조직 관리자인 경우 조직부터 생성
      let organizationId = data.organizationId;
      if (data.userType === 'ORGANIZATION_ADMIN' && data.organizationData) {
        organizationId = await this.createOrganization(
          userCredential.user.uid,
          data.organizationData
        );
      }

      // 사용자 프로필 생성
      const user = await this.createUserProfile(
        userCredential.user.uid,
        {
          ...data,
          organizationId
        }
      );

      // 조직 구성원인 경우 멤버십 생성
      if (organizationId && data.userType !== 'ORGANIZATION_ADMIN') {
        await this.createOrganizationMember(user.id, organizationId, data);
      }

      console.log('✅ 회원가입 성공:', user.displayName);
      return user;

    } catch (error: any) {
      console.error('❌ 회원가입 실패:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ 비밀번호 재설정 이메일 발송 완료');
    } catch (error: any) {
      console.error('❌ 비밀번호 재설정 실패:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // === 사용자 관리 ===

  private async loadUserContext(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const user = await this.loadUserProfile(firebaseUser.uid);
      if (!user) {
        console.warn('⚠️ 사용자 프로필을 찾을 수 없습니다. 기본 프로필을 생성합니다.');
        
        // 기본 사용자 프로필 생성
        const defaultUser: EnterpriseUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          userType: 'ORGANIZATION_ADMIN', // 기본값으로 조직 관리자 설정
          displayName: firebaseUser.displayName || '사용자',
          personalCreditBalance: 0,
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true
        };

        // Firestore에 기본 프로필 저장
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...defaultUser,
          permissions: JSON.stringify(defaultUser.permissions),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.now()
        });

        this.updateContext({
          user: defaultUser,
          organization: null,
          memberInfo: null,
          permissions: this.calculatePermissions(defaultUser, null),
          isLoading: false
        });
        return;
      }

      let organization: Organization | null = null;
      let memberInfo: OrganizationMember | null = null;

      // 조직 사용자인 경우 조직 정보 로드
      if (user.organizationId) {
        organization = await this.loadOrganization(user.organizationId);
        
        if (user.userType === 'ORGANIZATION_MEMBER') {
          memberInfo = await this.loadOrganizationMember(user.id, user.organizationId);
        }
      }

      const permissions = this.calculatePermissions(user, organization);

      this.updateContext({
        user,
        organization,
        memberInfo,
        permissions,
        isLoading: false
      });

    } catch (error) {
      console.error('❌ 사용자 컨텍스트 로드 실패:', error);
      this.updateContext({
        user: null,
        organization: null,
        memberInfo: null,
        permissions: [],
        isLoading: false
      });
    }
  }

  private async loadUserProfile(userId: string): Promise<EnterpriseUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        id: userDoc.id,
        email: data.email,
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        userType: data.userType,
        displayName: data.displayName,
        profileImage: data.profileImage,
        department: data.department,
        position: data.position,
        personalCreditBalance: data.personalCreditBalance,
        permissions: data.permissions ? JSON.parse(data.permissions) : [],
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
        isActive: data.isActive ?? true
      };
    } catch (error) {
      console.error('❌ 사용자 프로필 로드 실패:', error);
      return null;
    }
  }

  private async createOrUpdateUserProfile(
    firebaseUser: FirebaseUser,
    credentials: LoginCredentials
  ): Promise<EnterpriseUser> {
    const now = Timestamp.now();
    
    // 개인 사용자로 기본 설정 (이후 조직 정보가 있으면 업데이트)
    const userType: UserType = credentials.organizationId ? 'ORGANIZATION_MEMBER' : 'INDIVIDUAL_USER';
    
    // undefined 값을 제거하여 Firestore 에러 방지
    const userDoc: any = {
      email: firebaseUser.email,
      userType: userType,
      displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      permissions: JSON.stringify(this.getDefaultPermissions(userType)),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    // undefined가 아닌 경우에만 필드 추가
    if (credentials.employeeId !== undefined) {
      userDoc.employeeId = credentials.employeeId;
    }
    
    if (credentials.organizationId !== undefined) {
      userDoc.organizationId = credentials.organizationId;
    }
    
    // 개인 사용자의 경우에만 크레딧 잔액 추가
    if (userType === 'INDIVIDUAL_USER') {
      userDoc.personalCreditBalance = 0;
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

    console.log('✅ 사용자 프로필 생성/업데이트 완료:', userDoc.email);

    return {
      id: firebaseUser.uid,
      ...userDoc,
      permissions: JSON.parse(userDoc.permissions),
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
      lastLoginAt: now.toDate()
    } as EnterpriseUser;
  }

  private async createUserProfile(
    userId: string, 
    data: RegistrationData & { organizationId?: string }
  ): Promise<EnterpriseUser> {
    const now = Timestamp.now();
    const userDoc = {
      email: data.email,
      employeeId: data.employeeId,
      organizationId: data.organizationId,
      userType: data.userType,
      displayName: data.displayName,
      phone: data.phone,
      address: data.address,
      department: data.department,
      position: data.position,
      personalCreditBalance: data.userType === 'INDIVIDUAL_USER' ? 0 : undefined,
      permissions: JSON.stringify(this.getDefaultPermissions(data.userType)),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    return {
      id: userId,
      ...userDoc,
      permissions: JSON.parse(userDoc.permissions),
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
      lastLoginAt: now.toDate()
    } as EnterpriseUser;
  }

  // === 조직 관리 ===

  private async createOrganization(
    adminUserId: string,
    orgData: RegistrationData['organizationData']
  ): Promise<string> {
    if (!orgData) {
      throw new Error('조직 데이터가 필요합니다.');
    }

    const organizationId = doc(collection(db, 'organizations')).id;
    const volumeTier = this.calculateVolumeTier(orgData.initialMemberCount);
    const discountedPrice = this.calculateDiscountedPrice(
      DEFAULT_BASE_PRICE, 
      volumeTier
    );

    const organizationDoc = {
      name: orgData.name,
      businessNumber: orgData.businessNumber,
      contactEmail: orgData.contactEmail,
      contactPhone: orgData.contactPhone,
      address: orgData.address,
      creditBalance: 0,
      totalMemberCount: orgData.initialMemberCount,
      volumeTier,
      basePrice: DEFAULT_BASE_PRICE,
      discountedPrice,
      isTrialActive: false,
      trialCreditsUsed: 0,
      trialCreditsTotal: 0,
      servicePackage: orgData.servicePackage,
      status: 'ACTIVE' as OrganizationStatus,
      adminUserId,
      settings: JSON.stringify({
        autoRenew: false,
        notificationEnabled: true,
        reportLanguage: 'ko',
        measurementFrequency: 'MONTHLY'
      }),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, 'organizations', organizationId), organizationDoc);
    console.log('✅ 조직 생성 완료:', orgData.name);
    
    return organizationId;
  }

  private async loadOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      if (!orgDoc.exists()) {
        return null;
      }

      const data = orgDoc.data();
      return {
        id: orgDoc.id,
        name: data.name,
        businessNumber: data.businessNumber,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        creditBalance: data.creditBalance,
        totalMemberCount: data.totalMemberCount,
        volumeTier: data.volumeTier,
        basePrice: data.basePrice,
        discountedPrice: data.discountedPrice,
        isTrialActive: data.isTrialActive,
        trialType: data.trialType,
        trialStartDate: data.trialStartDate?.toDate(),
        trialEndDate: data.trialEndDate?.toDate(),
        trialCreditsUsed: data.trialCreditsUsed,
        trialCreditsTotal: data.trialCreditsTotal,
        contractStartDate: data.contractStartDate?.toDate(),
        contractEndDate: data.contractEndDate?.toDate(),
        servicePackage: data.servicePackage,
        status: data.status,
        adminUserId: data.adminUserId,
        settings: data.settings ? JSON.parse(data.settings) : {},
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    } catch (error) {
      console.error('❌ 조직 정보 로드 실패:', error);
      return null;
    }
  }

  private async createOrganizationMember(
    userId: string,
    organizationId: string,
    data: RegistrationData
  ): Promise<void> {
    const memberDoc = {
      userId,
      organizationId,
      employeeId: data.employeeId!,
      department: data.department,
      position: data.position,
      joinedAt: Timestamp.now(),
      isActive: true,
      reportsGenerated: 0,
      consultationsUsed: 0
    };

    const memberId = `${organizationId}_${userId}`;
    await setDoc(doc(db, 'organizationMembers', memberId), memberDoc);
  }

  private async loadOrganizationMember(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMember | null> {
    try {
      const memberId = `${organizationId}_${userId}`;
      const memberDoc = await getDoc(doc(db, 'organizationMembers', memberId));
      
      if (!memberDoc.exists()) {
        return null;
      }

      const data = memberDoc.data();
      return {
        userId: data.userId,
        organizationId: data.organizationId,
        employeeId: data.employeeId,
        department: data.department,
        position: data.position,
        joinedAt: data.joinedAt?.toDate(),
        isActive: data.isActive,
        reportsGenerated: data.reportsGenerated,
        consultationsUsed: data.consultationsUsed,
        lastActivityAt: data.lastActivityAt?.toDate()
      };
    } catch (error) {
      console.error('❌ 조직 멤버 정보 로드 실패:', error);
      return null;
    }
  }

  // === 헬퍼 메서드 ===

  private async findEmailByEmployeeId(
    employeeId: string,
    organizationId: string
  ): Promise<string> {
    const q = query(
      collection(db, 'users'),
      where('employeeId', '==', employeeId),
      where('organizationId', '==', organizationId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('직원ID를 찾을 수 없습니다.');
    }

    const userData = querySnapshot.docs[0].data();
    return userData.email || `${employeeId}@${organizationId}.mindbreeze.internal`;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      lastLoginAt: Timestamp.now()
    });
  }

  private calculateVolumeTier(memberCount: number): VolumeDiscountTier {
    for (const tier of VOLUME_DISCOUNT_TIERS) {
      if (memberCount >= tier.minMembers && 
          (!tier.maxMembers || memberCount <= tier.maxMembers)) {
        return tier.tier;
      }
    }
    return 'TIER_0';
  }

  private calculateDiscountedPrice(basePrice: number, tier: VolumeDiscountTier): number {
    const discountConfig = VOLUME_DISCOUNT_TIERS.find(t => t.tier === tier);
    if (!discountConfig) return basePrice;

    return Math.round(basePrice * (100 - discountConfig.discountPercent) / 100);
  }

  private getDefaultPermissions(userType: UserType): string[] {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return ['*'];
      case 'ORGANIZATION_ADMIN':
        return [
          // 조직 전체 관리 (총괄 운영자)
          'organization.manage',
          'organization.structure.edit',
          'members.manage',
          'credits.view',
          'credits.manage',
          
          // MEASUREMENT_USER 전체 관리
          'measurement_users.create',
          'measurement_users.view.all',      // 모든 측정 대상자 조회
          'measurement_users.edit.all',      // 모든 측정 대상자 편집
          'measurement_users.delete.all',    // 모든 측정 대상자 삭제
          'measurement_users.measure.all',   // 모든 측정 대상자 측정
          
          // 리포트 전체 관리
          'reports.view.all',               // 모든 리포트 조회
          'reports.generate.all',           // 모든 대상자용 리포트 생성
          'reports.send.all',               // 모든 리포트 전송
          
          // 메트릭스 및 분석
          'metrics.view.all',
          'analytics.organization'
        ];
      case 'ORGANIZATION_MEMBER':
        return [
          // MEASUREMENT_USER 개별 관리 (개별 운영자)
          'measurement_users.create',
          'measurement_users.view.own',      // 자신이 측정한 대상자만 조회
          'measurement_users.edit.own',      // 자신이 측정한 대상자만 편집
          'measurement_users.delete.own',    // 자신이 측정한 대상자만 삭제
          'measurement_users.measure.own',   // 자신이 측정한 대상자만 측정
          
          // 리포트 개별 관리
          'reports.view.own',               // 자신이 생성한 리포트만 조회
          'reports.generate.own',           // 자신의 대상자용 리포트만 생성
          'reports.send.own',               // 자신의 리포트만 전송
          
          // 개인 관리
          'profile.view',
          'profile.edit',
          'consultation.use',
          'metrics.view.own'
        ];
      case 'INDIVIDUAL_USER':
        return [
          'reports.generate',
          'consultation.use',
          'profile.view',
          'profile.edit',
          'credits.purchase'
        ];
      case 'MEASUREMENT_SUBJECT':
        return [
          'reports.view.assigned',          // 자신에게 할당된 리포트만 조회
          'consultation.receive'            // 상담 받기만 가능
        ];
      default:
        return [];
    }
  }

  private calculatePermissions(
    user: EnterpriseUser,
    organization: Organization | null
  ): string[] {
    let permissions = [...user.permissions];

    // 조직 관리자인 경우 추가 권한
    if (organization && user.id === organization.adminUserId) {
      permissions.push('organization.admin');
    }

    return [...new Set(permissions)]; // 중복 제거
  }

  private updateContext(context: AuthContext): void {
    this.currentContext = context;
    this.authStateListeners.forEach(listener => listener(context));
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return '사용자를 찾을 수 없습니다.';
      case 'auth/wrong-password':
        return '비밀번호가 올바르지 않습니다.';
      case 'auth/email-already-in-use':
        return '이미 사용 중인 이메일입니다.';
      case 'auth/weak-password':
        return '비밀번호가 너무 약합니다. (최소 6자)';
      case 'auth/invalid-email':
        return '유효하지 않은 이메일 형식입니다.';
      case 'auth/too-many-requests':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      default:
        return '인증 중 오류가 발생했습니다.';
    }
  }

  // === 공개 메서드 ===

  getCurrentContext(): AuthContext {
    return this.currentContext;
  }

  onAuthStateChanged(callback: (context: AuthContext) => void): () => void {
    this.authStateListeners.push(callback);
    
    // 현재 상태 즉시 콜백
    callback(this.currentContext);
    
    // 구독 해제 함수 반환
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  hasPermission(permission: string): boolean {
    if (this.currentContext.permissions.includes('*')) {
      return true; // 시스템 관리자
    }
    return this.currentContext.permissions.includes(permission);
  }

  isOrganizationAdmin(): boolean {
    const { user, organization } = this.currentContext;
    return !!(user && organization && user.id === organization.adminUserId);
  }

  isOrganizationMember(): boolean {
    return this.currentContext.user?.userType === 'ORGANIZATION_MEMBER';
  }

  isIndividualUser(): boolean {
    return this.currentContext.user?.userType === 'INDIVIDUAL_USER';
  }

  // 조직 관리자용 조직 생성 메서드
  async createOrganizationForAdmin(adminUserId: string, orgData: {
    name: string;
    description: string;
    industry: string;
    size: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
  }): Promise<string> {
    try {
      // 조직 생성
      const organizationId = await this.createOrganization(adminUserId, {
        name: orgData.name,
        businessNumber: '', // 필수 필드이므로 빈 문자열로 설정
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        address: orgData.address,
        initialMemberCount: 1,
        servicePackage: 'BASIC'
      });

      // 사용자 프로필 업데이트 (organizationId 추가)
      await updateDoc(doc(db, 'users', adminUserId), {
        organizationId: organizationId,
        updatedAt: Timestamp.now()
      });

      // 조직 추가 정보 저장
      await updateDoc(doc(db, 'organizations', organizationId), {
        description: orgData.description,
        industry: orgData.industry,
        size: orgData.size,
        updatedAt: Timestamp.now()
      });

      return organizationId;
    } catch (error) {
      console.error('❌ 조직 생성 실패:', error);
      throw new Error('조직 생성에 실패했습니다.');
    }
  }

  // MEASUREMENT_SUBJECT용 토큰 기반 접속
  async accessWithToken(token: string): Promise<MeasurementSubjectAccess> {
    try {
      console.log('[Auth] Accessing with token:', token);
      
      const usersCollection = collection(db, 'users');
      const q = query(
        usersCollection,
        where('accessToken', '==', token),
        where('userType', '==', 'MEASUREMENT_SUBJECT')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid or expired access token');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as EnterpriseUser;
      
      // 토큰 만료 확인
      const tokenExpiresAt = userData.tokenExpiresAt?.toDate();
      if (!tokenExpiresAt || new Date() > tokenExpiresAt) {
        throw new Error('Access token has expired');
      }
      
      // 접근 가능한 리포트 조회
      const reportIds = await this.getAccessibleReports(userData.id);
      
      const accessInfo: MeasurementSubjectAccess = {
        userId: userData.id,
        organizationId: userData.organizationId!,
        accessToken: token,
        expiresAt: tokenExpiresAt,
        reportIds
      };
      
      // 토큰 기반 컨텍스트 설정
      this.currentContext = {
        user: userData,
        organization: await this.loadOrganization(userData.organizationId!),
        memberInfo: null,
        permissions: ['report:view', 'consultation:access'],
        isLoading: false,
        isTokenAccess: true
      };
      
      this.updateContext(this.currentContext);
      
      return accessInfo;
    } catch (error) {
      console.error('[Auth] Token access failed:', error);
      throw error;
    }
  }

  // MEASUREMENT_SUBJECT 생성 (ORGANIZATION_ADMIN이 호출)
  async createMeasurementSubject(data: {
    email: string;
    displayName: string;
    organizationId: string;
    validityDays: number;
    reportIds?: string[];
  }): Promise<MeasurementSubjectAccess> {
    try {
      // 권한 확인
      if (!this.isOrganizationAdmin()) {
        throw new Error('Only organization administrators can create measurement subjects');
      }
      
      // 고유 토큰 생성
      const accessToken = this.generateAccessToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.validityDays);
      
      // 사용자 ID 생성
      const userId = `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const measurementSubject: EnterpriseUser = {
        id: userId,
        email: data.email,
        displayName: data.displayName,
        userType: 'MEASUREMENT_SUBJECT',
        organizationId: data.organizationId,
        permissions: ['report:view', 'consultation:access'],
        accessToken,
        tokenExpiresAt: Timestamp.fromDate(expiresAt),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Firestore에 저장
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...measurementSubject,
        createdAt: Timestamp.fromDate(measurementSubject.createdAt),
        updatedAt: Timestamp.fromDate(measurementSubject.updatedAt)
      });
      
      console.log('[Auth] Measurement subject created:', userId);
      
      return {
        userId,
        organizationId: data.organizationId,
        accessToken,
        expiresAt,
        reportIds: data.reportIds || []
      };
    } catch (error) {
      console.error('[Auth] Failed to create measurement subject:', error);
      throw error;
    }
  }

  // 접근 가능한 리포트 조회
  private async getAccessibleReports(userId: string): Promise<string[]> {
    try {
      // 리포트 컬렉션에서 해당 사용자가 접근 가능한 리포트들 조회
      const reportsCollection = collection(db, 'reports');
      const q = query(
        reportsCollection,
        where('measurementSubjectId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('[Auth] Failed to get accessible reports:', error);
      return [];
    }
  }

  // 이메일 링크 생성
  generateAccessLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/measurement-access?token=${token}`;
  }

  // 토큰 생성
  private generateAccessToken(): string {
    return `ms_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// 싱글톤 인스턴스
export const enterpriseAuthService = new EnterpriseAuthService();
export default enterpriseAuthService; 