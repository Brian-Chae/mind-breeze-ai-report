import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  Timestamp,
  writeBatch,
  getDocs 
} from 'firebase/firestore';
import { db } from '@core/services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@core/services/firebase';

/**
 * 테스트 데이터 초기화 클래스
 * 실제 운영 환경에서 시스템이 동작할 수 있도록 샘플 데이터를 생성합니다.
 */
export class TestDataInitializer {
  
  /**
   * 모든 테스트 데이터 생성
   */
  static async initializeAllTestData(): Promise<void> {
    console.log('🚀 테스트 데이터 초기화 시작...');
    
    try {
      // 기존 데이터 확인
      const existingOrgs = await getDocs(collection(db, 'organizations'));
      if (existingOrgs.docs.length > 0) {
        console.log('⚠️ 기존 데이터가 존재합니다. 초기화를 건너뜁니다.');
        return;
      }

      await this.createSystemAdmin();
      await this.createOrganizations();
      await this.createUsers();
      await this.createMembershipData();
      await this.createMeasurementData(); 
      await this.createAIReportData();
      await this.createCreditTransactions();
      await this.createDeviceData();
      await this.createSystemActivities();
      
      console.log('✅ 모든 테스트 데이터 생성 완료!');
      
    } catch (error) {
      console.error('❌ 테스트 데이터 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 시스템 관리자 계정 생성
   */
  private static async createSystemAdmin(): Promise<void> {
    console.log('👤 시스템 관리자 계정 생성 중...');
    
    try {
      // 시스템 관리자 인증 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        'admin@mindbreeze.ai',
        'admin123456!'
      );
      
      // 시스템 관리자 사용자 문서 생성
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: 'admin@mindbreeze.ai',
        displayName: '시스템 관리자',
        userType: 'SYSTEM_ADMIN',
        isActive: true,
        permissions: ['*'], // 모든 권한
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });
      
      console.log('✅ 시스템 관리자 계정 생성 완료');
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️ 시스템 관리자 계정이 이미 존재합니다.');
      } else {
        throw error;
      }
    }
  }

  /**
   * 조직 데이터 생성
   */
  private static async createOrganizations(): Promise<string[]> {
    console.log('🏢 조직 데이터 생성 중...');
    
    const organizations = [
      {
        name: 'ABC 헬스케어',
        businessNumber: '123-45-67890',
        contactEmail: 'contact@abc-health.com',
        contactPhone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        industry: 'healthcare',
        size: 'LARGE',
        employeeCount: 150,
        status: 'ACTIVE',
        isTrialActive: false,
        creditBalance: 25000,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) // 2개월 전
      },
      {
        name: 'XYZ 웰니스',
        businessNumber: '234-56-78901',
        contactEmail: 'info@xyz-wellness.com',
        contactPhone: '031-2345-6789',
        address: '경기도 성남시 분당구 정자로 456',
        industry: 'wellness',
        size: 'MEDIUM',
        employeeCount: 89,
        status: 'TRIAL',
        isTrialActive: true,
        trialStartDate: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15일 전
        trialEndDate: Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // 15일 후
        creditBalance: 18500,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 1개월 전
      },
      {
        name: 'DEF 메디컬',
        businessNumber: '345-67-89012',
        contactEmail: 'admin@def-medical.com',
        contactPhone: '051-3456-7890',
        address: '부산시 해운대구 센텀로 789',
        industry: 'medical',
        size: 'LARGE',
        employeeCount: 200,
        status: 'ACTIVE',
        isTrialActive: false,
        creditBalance: 45000,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // 3개월 전
      },
      {
        name: 'GHI 피트니스',
        businessNumber: '456-78-90123',
        contactEmail: 'support@ghi-fitness.com',
        contactPhone: '032-4567-8901',
        address: '인천시 연수구 송도대로 321',
        industry: 'fitness',
        size: 'SMALL',
        employeeCount: 45,
        status: 'TRIAL',
        isTrialActive: true,
        trialStartDate: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5일 전
        trialEndDate: Timestamp.fromDate(new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)), // 25일 후
        creditBalance: 5000,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)) // 10일 전
      },
      {
        name: 'JKL 리서치',
        businessNumber: '567-89-01234',
        contactEmail: 'research@jkl-lab.com',
        contactPhone: '042-5678-9012',
        address: '대전시 유성구 대학로 654',
        industry: 'research',
        size: 'MEDIUM',
        employeeCount: 78,
        status: 'ACTIVE',
        isTrialActive: false,
        creditBalance: 32000,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)) // 1.5개월 전
      }
    ];

    const orgIds: string[] = [];
    const batch = writeBatch(db);

    for (const orgData of organizations) {
      const orgRef = doc(collection(db, 'organizations'));
      batch.set(orgRef, {
        ...orgData,
        updatedAt: Timestamp.now()
      });
      orgIds.push(orgRef.id);
    }

    await batch.commit();
    console.log(`✅ ${organizations.length}개 조직 생성 완료`);
    return orgIds;
  }

  /**
   * 사용자 데이터 생성
   */
  private static async createUsers(): Promise<void> {
    console.log('👥 사용자 데이터 생성 중...');
    
    // 조직 목록 가져오기
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const organizations = orgsSnapshot.docs;

    const batch = writeBatch(db);
    let userCount = 0;

    for (const orgDoc of organizations) {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;
      
      // 조직 관리자 생성
      const adminRef = doc(collection(db, 'users'));
      batch.set(adminRef, {
        email: `admin@${orgData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        displayName: `${orgData.name} 관리자`,
        userType: 'ORGANIZATION_ADMIN',
        organizationId: orgId,
        isActive: true,
        position: '관리자',
        department: '운영팀',
        permissions: ['admin_all'],
        createdAt: orgData.createdAt,
        updatedAt: Timestamp.now(),
        lastLoginAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000))
      });
      userCount++;

      // 조직 멤버들 생성 (랜덤 수)
      const memberCount = Math.floor(Math.random() * 20) + 10; // 10-30명
      for (let i = 0; i < memberCount; i++) {
        const memberRef = doc(collection(db, 'users'));
        batch.set(memberRef, {
          email: `user${i + 1}@${orgData.name.toLowerCase().replace(/\s+/g, '')}.com`,
          displayName: `사용자 ${i + 1}`,
          userType: 'ORGANIZATION_MEMBER',
          organizationId: orgId,
          isActive: Math.random() > 0.1, // 90% 활성
          position: ['팀장', '선임', '주임', '사원'][Math.floor(Math.random() * 4)],
          department: ['개발팀', '영업팀', '마케팅팀', 'HR팀'][Math.floor(Math.random() * 4)],
          permissions: ['measurement.create', 'report.view'],
          createdAt: Timestamp.fromDate(new Date(orgData.createdAt.toDate().getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)),
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000))
        });
        userCount++;
      }
    }

    await batch.commit();
    console.log(`✅ ${userCount}명 사용자 생성 완료`);
  }

  /**
   * 측정 사용자 데이터 생성
   */
  private static async createMeasurementData(): Promise<void> {
    console.log('🧠 측정 데이터 생성 중...');
    
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const batch = writeBatch(db);
    let sessionCount = 0;

    // 측정 사용자 생성
    for (const userDoc of usersSnapshot.docs.slice(0, 100)) { // 처음 100명만
      const userData = userDoc.data();
      if (userData.userType !== 'ORGANIZATION_MEMBER') continue;

      const measurementUserRef = doc(collection(db, 'measurementUsers'));
      batch.set(measurementUserRef, {
        email: userData.email,
        displayName: userData.displayName,
        organizationId: userData.organizationId,
        isActive: userData.isActive,
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        birthYear: 1980 + Math.floor(Math.random() * 30),
        consentStatus: 'CONSENTED',
        lastMeasurementDate: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
        totalMeasurements: Math.floor(Math.random() * 20) + 1,
        createdAt: userData.createdAt,
        updatedAt: Timestamp.now()
      });

      // 각 사용자당 여러 측정 세션 생성
      const sessionNum = Math.floor(Math.random() * 15) + 1; // 1-15개 세션
      for (let i = 0; i < sessionNum; i++) {
        const sessionRef = doc(collection(db, 'measurementSessions'));
        const sessionDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
        
        batch.set(sessionRef, {
          userId: userDoc.id,
          organizationId: userData.organizationId,
          sessionDate: Timestamp.fromDate(sessionDate),
          startTime: Timestamp.fromDate(sessionDate),
          endTime: Timestamp.fromDate(new Date(sessionDate.getTime() + (Math.random() * 20 + 5) * 60 * 1000)), // 5-25분
          duration: Math.floor(Math.random() * 20 + 5), // 분 단위
          status: Math.random() > 0.05 ? 'completed' : 'failed', // 95% 성공
          qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100
          dataSize: Math.floor(Math.random() * 5 + 1), // 1-6MB
          deviceId: `device_${Math.floor(Math.random() * 50) + 1}`,
          createdAt: Timestamp.fromDate(sessionDate),
          updatedAt: Timestamp.fromDate(sessionDate)
        });
        sessionCount++;
      }
    }

    await batch.commit();
    console.log(`✅ ${sessionCount}개 측정 세션 생성 완료`);
  }

  /**
   * AI 리포트 데이터 생성
   */
  private static async createAIReportData(): Promise<void> {
    console.log('📊 AI 리포트 데이터 생성 중...');
    
    const sessionsSnapshot = await getDocs(collection(db, 'measurementSessions'));
    const sessions = sessionsSnapshot.docs.filter(doc => doc.data().status === 'completed');
    
    const batch = writeBatch(db);
    let reportCount = 0;

    // 80% 세션에 대해 리포트 생성
    const reportsToCreate = Math.floor(sessions.length * 0.8);
    
    for (let i = 0; i < reportsToCreate; i++) {
      const session = sessions[i].data();
      const reportRef = doc(collection(db, 'aiReports'));
      
      const engines = ['BasicGeminiV1', 'AdvancedGeminiV2', 'CustomAI'];
      const statuses = ['completed', 'processing', 'failed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      batch.set(reportRef, {
        sessionId: sessions[i].id,
        userId: session.userId,
        organizationId: session.organizationId,
        engineUsed: engines[Math.floor(Math.random() * engines.length)],
        status,
        qualityScore: status === 'completed' ? Math.floor(Math.random() * 30) + 70 : null,
        processingTime: status === 'completed' ? Math.random() * 9000 + 1000 : null, // 1-10초 (1000-10000ms)
        creditsCost: Math.floor(Math.random() * 20) + 10, // 10-30 크레딧
        downloadCount: status === 'completed' ? Math.floor(Math.random() * 3) : 0,
        reportData: status === 'completed' ? {
          overallScore: Math.floor(Math.random() * 30) + 70,
          mentalHealthScore: Math.floor(Math.random() * 30) + 70,
          physicalHealthScore: Math.floor(Math.random() * 30) + 70,
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        } : null,
        createdAt: session.sessionDate || Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      reportCount++;
    }

    await batch.commit();
    console.log(`✅ ${reportCount}개 AI 리포트 생성 완료`);
  }

  /**
   * 크레딧 거래 데이터 생성
   */
  private static async createCreditTransactions(): Promise<void> {
    console.log('💳 크레딧 거래 데이터 생성 중...');
    
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const reportsSnapshot = await getDocs(collection(db, 'aiReports'));
    
    const batch = writeBatch(db);
    let transactionCount = 0;

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;

      // 초기 크레딧 지급
      const initialCreditRef = doc(collection(db, 'creditTransactions'));
      batch.set(initialCreditRef, {
        organizationId: orgId,
        amount: orgData.creditBalance + 50000, // 현재 잔액 + 사용된 크레딧
        type: 'PURCHASE',
        description: '초기 크레딧 지급',
        purchaseType: 'INITIAL',
        createdAt: orgData.createdAt,
        updatedAt: orgData.createdAt
      });
      transactionCount++;

      // 리포트 생성에 따른 크레딧 사용
      const orgReports = reportsSnapshot.docs.filter(doc => 
        doc.data().organizationId === orgId && doc.data().status === 'completed'
      );

      for (const reportDoc of orgReports) {
        const reportData = reportDoc.data();
        const usageRef = doc(collection(db, 'creditTransactions'));
        
        batch.set(usageRef, {
          organizationId: orgId,
          amount: -(reportData.creditsCost || 15), // 음수로 저장 (사용)
          type: 'USAGE',
          description: 'AI 리포트 생성',
          reportId: reportDoc.id,
          engineUsed: reportData.engineUsed,
          createdAt: reportData.createdAt,
          updatedAt: reportData.createdAt
        });
        transactionCount++;
      }

      // 추가 크레딧 구매 (랜덤)
      if (Math.random() > 0.5) {
        const additionalCreditRef = doc(collection(db, 'creditTransactions'));
        const purchaseDate = new Date(orgData.createdAt.toDate().getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        batch.set(additionalCreditRef, {
          organizationId: orgId,
          amount: Math.floor(Math.random() * 30000) + 10000, // 10,000-40,000 크레딧
          type: 'PURCHASE',
          description: '크레딧 추가 구매',
          purchaseType: 'STANDARD',
          paymentMethod: 'CREDIT_CARD',
          createdAt: Timestamp.fromDate(purchaseDate),
          updatedAt: Timestamp.fromDate(purchaseDate)
        });
        transactionCount++;
      }
    }

    await batch.commit();
    console.log(`✅ ${transactionCount}개 크레딧 거래 생성 완료`);
  }

  /**
   * 디바이스 데이터 생성
   */
  private static async createDeviceData(): Promise<void> {
    console.log('📱 디바이스 데이터 생성 중...');
    
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    
    const batch = writeBatch(db);
    let deviceCount = 0;

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;
      
      // 조직당 5-15개 디바이스 생성
      const numDevices = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < numDevices; i++) {
        const deviceRef = doc(collection(db, 'devices'));
        const statuses = ['online', 'offline', 'maintenance', 'error'];
        const types = ['EEG', 'PPG', 'MULTI_SENSOR', 'WEARABLE'];
        
        batch.set(deviceRef, {
          organizationId: orgId,
          serialNumber: `LB-${orgId.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          name: `Link Band ${i + 1}`,
          model: 'LinkBand Pro v2',
          type: types[Math.floor(Math.random() * types.length)],
          manufacturer: 'LOOXID LABS',
          firmwareVersion: '2.1.3',
          batteryLevel: Math.floor(Math.random() * 100),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          isActive: Math.random() > 0.1, // 90% 활성
          isPaired: Math.random() > 0.2, // 80% 페어링됨
          isCalibrated: Math.random() > 0.15, // 85% 교정됨
          assignedLocation: ['개발팀', '영업팀', '마케팅팀', 'HR팀'][Math.floor(Math.random() * 4)],
          lastSyncAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
          pairedAt: Timestamp.fromDate(new Date(orgData.createdAt.toDate().getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)),
          createdAt: orgData.createdAt,
          updatedAt: Timestamp.now()
        });
        deviceCount++;
      }
    }

    await batch.commit();
    console.log(`✅ ${deviceCount}개 디바이스 생성 완료`);
  }

  /**
   * 시스템 활동 로그 생성
   */
  private static async createSystemActivities(): Promise<void> {
    console.log('📝 시스템 활동 로그 생성 중...');
    
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const reportsSnapshot = await getDocs(collection(db, 'aiReports'));
    
    const batch = writeBatch(db);
    let activityCount = 0;

    // 최근 50개 시스템 활동 생성
    for (let i = 0; i < 50; i++) {
      const activityRef = doc(collection(db, 'systemActivities'));
      const orgDoc = orgsSnapshot.docs[Math.floor(Math.random() * orgsSnapshot.docs.length)];
      const orgData = orgDoc.data();
      
      const activityTypes = [
        'user_login',
        'report_generated', 
        'measurement_completed',
        'device_connected',
        'system_event',
        'credit_used',
        'error_occurred'
      ];
      
      const descriptions = {
        'user_login': '사용자가 로그인했습니다.',
        'report_generated': 'AI 리포트가 생성되었습니다.',
        'measurement_completed': '새로운 EEG 측정이 완료되었습니다.',
        'device_connected': '디바이스가 연결되었습니다.',
        'system_event': '시스템 백업이 완료되었습니다.',
        'credit_used': '크레딧이 사용되었습니다.',
        'error_occurred': '일시적인 시스템 오류가 발생했습니다.'
      };
      
      const severities = ['info', 'warning', 'error'];
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      batch.set(activityRef, {
        organizationId: orgDoc.id,
        organizationName: orgData.name,
        type,
        description: descriptions[type as keyof typeof descriptions],
        severity: severities[Math.floor(Math.random() * severities.length)],
        timestamp: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)), // 최근 1주일
        metadata: {
          source: 'system',
          version: '1.0.0'
        }
      });
      activityCount++;
    }

    await batch.commit();
    console.log(`✅ ${activityCount}개 시스템 활동 생성 완료`);
  }

  /**
   * 멤버십 데이터 생성 (organizationMembers 컬렉션)
   */
  private static async createMembershipData(): Promise<void> {
    console.log('👥 멤버십 데이터 생성 중...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const orgUsers = usersSnapshot.docs.filter(doc => 
      doc.data().organizationId && doc.data().userType !== 'SYSTEM_ADMIN'
    );

    const batch = writeBatch(db);
    let memberCount = 0;

    for (const userDoc of orgUsers) {
      const userData = userDoc.data();
      const memberRef = doc(collection(db, 'organizationMembers'));
      
      batch.set(memberRef, {
        userId: userDoc.id,
        organizationId: userData.organizationId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.userType === 'ORGANIZATION_ADMIN' ? 'ORGANIZATION_ADMIN' : 'ORGANIZATION_MEMBER',
        status: userData.isActive ? 'ACTIVE' : 'INACTIVE',
        department: userData.department,
        position: userData.position,
        joinedAt: userData.createdAt,
        lastActivity: userData.lastLoginAt,
        permissions: userData.permissions || [],
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: Timestamp.now()
      });
      memberCount++;
    }

    await batch.commit();
    console.log(`✅ ${memberCount}개 멤버십 데이터 생성 완료`);
  }
} 