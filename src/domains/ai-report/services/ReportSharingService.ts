import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';

export interface ShareableReport {
  shareToken: string;
  reportId: string;
  organizationId: string;
  createdByUserId: string;
  createdByUserName: string;
  subjectName: string;
  subjectBirthDate: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccessCount: number;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface ShareLinkAuth {
  birthDate: string; // YYYY-MM-DD 형식
}

class ReportSharingService {
  private readonly COLLECTION_NAME = 'shared_reports';
  private readonly TOKEN_LENGTH = 32;
  private readonly DEFAULT_EXPIRY_DAYS = 30;
  private readonly DEFAULT_MAX_ACCESS = 100;

  /**
   * 공유 가능한 리포트 링크 생성
   */
  async createShareableLink(
    reportId: string,
    organizationId: string,
    createdByUserId: string,
    createdByUserName: string,
    subjectName: string,
    subjectBirthDate: Date,
    options: {
      expiryDays?: number;
      maxAccessCount?: number;
    } = {}
  ): Promise<ShareableReport> {
    const shareToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (options.expiryDays || this.DEFAULT_EXPIRY_DAYS));

    const shareableReport: ShareableReport = {
      shareToken,
      reportId,
      organizationId,
      createdByUserId,
      createdByUserName,
      subjectName,
      subjectBirthDate,
      expiresAt,
      accessCount: 0,
      maxAccessCount: options.maxAccessCount || this.DEFAULT_MAX_ACCESS,
      isActive: true,
      createdAt: new Date(),
    };

    // Firestore에 저장
    const docRef = doc(db, this.COLLECTION_NAME, shareToken);
    await setDoc(docRef, {
      ...shareableReport,
      subjectBirthDate: Timestamp.fromDate(subjectBirthDate),
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.fromDate(shareableReport.createdAt),
    });

    console.log('✅ 공유 링크 생성:', shareToken);
    return shareableReport;
  }

  /**
   * 공유 토큰으로 리포트 정보 조회
   */
  async getShareableReport(shareToken: string): Promise<ShareableReport | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, shareToken);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn('공유 링크를 찾을 수 없음:', shareToken);
        return null;
      }

      const data = docSnap.data();
      
      // Timestamp를 Date로 변환
      return {
        ...data,
        subjectBirthDate: data.subjectBirthDate.toDate(),
        expiresAt: data.expiresAt.toDate(),
        createdAt: data.createdAt.toDate(),
        lastAccessedAt: data.lastAccessedAt?.toDate(),
      } as ShareableReport;
    } catch (error) {
      console.error('공유 리포트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 생년월일 인증 및 리포트 접근
   */
  async authenticateAndAccess(
    shareToken: string, 
    auth: ShareLinkAuth
  ): Promise<{ success: boolean; reportId?: string; errorMessage?: string }> {
    const shareableReport = await this.getShareableReport(shareToken);

    if (!shareableReport) {
      return { success: false, errorMessage: '유효하지 않은 링크입니다.' };
    }

    // 만료 확인
    if (new Date() > shareableReport.expiresAt) {
      return { success: false, errorMessage: '링크가 만료되었습니다.' };
    }

    // 활성 상태 확인
    if (!shareableReport.isActive) {
      return { success: false, errorMessage: '비활성화된 링크입니다.' };
    }

    // 접근 횟수 확인
    if (shareableReport.accessCount >= shareableReport.maxAccessCount) {
      return { success: false, errorMessage: '최대 접근 횟수를 초과했습니다.' };
    }

    // 생년월일 인증 - 더 안전한 날짜 파싱
    let providedDate: Date;
    try {
      // YYYY-MM-DD 형식의 문자열을 직접 파싱
      const [year, month, day] = auth.birthDate.split('-').map(Number);
      providedDate = new Date(year, month - 1, day); // month는 0-based
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return { success: false, errorMessage: '올바른 날짜 형식을 입력해주세요.' };
    }
    
    const expectedDate = shareableReport.subjectBirthDate;
    
    // 🔍 디버깅 로그 추가
    console.log('🔍 생년월일 인증 디버깅:');
    console.log('- 입력받은 birthDate:', auth.birthDate);
    console.log('- 변환된 providedDate:', providedDate);
    console.log('- 저장된 expectedDate:', expectedDate);
    console.log('- providedDate 정보:', {
      year: providedDate.getFullYear(),
      month: providedDate.getMonth() + 1, // 0-based이므로 +1
      date: providedDate.getDate()
    });
    console.log('- expectedDate 정보:', {
      year: expectedDate.getFullYear(),
      month: expectedDate.getMonth() + 1, // 0-based이므로 +1
      date: expectedDate.getDate()
    });
    
    // 더 안전한 날짜 비교 (시간 정보 제거하고 비교)
    const providedYear = providedDate.getFullYear();
    const providedMonth = providedDate.getMonth();
    const providedDay = providedDate.getDate();
    
    const expectedYear = expectedDate.getFullYear();
    const expectedMonth = expectedDate.getMonth();
    const expectedDay = expectedDate.getDate();
    
    console.log('- 비교 결과:', {
      yearMatch: providedYear === expectedYear,
      monthMatch: providedMonth === expectedMonth,
      dayMatch: providedDay === expectedDay
    });
    
    if (
      providedYear !== expectedYear ||
      providedMonth !== expectedMonth ||
      providedDay !== expectedDay
    ) {
      console.warn('❌ 생년월일 불일치:', {
        provided: `${providedYear}-${(providedMonth + 1).toString().padStart(2, '0')}-${providedDay.toString().padStart(2, '0')}`,
        expected: `${expectedYear}-${(expectedMonth + 1).toString().padStart(2, '0')}-${expectedDay.toString().padStart(2, '0')}`
      });
      return { success: false, errorMessage: '생년월일이 일치하지 않습니다.' };
    }
    
    console.log('✅ 생년월일 인증 성공!');

    // 접근 횟수 증가
    await this.incrementAccessCount(shareToken);

    return { success: true, reportId: shareableReport.reportId };
  }

  /**
   * 접근 횟수 증가
   */
  private async incrementAccessCount(shareToken: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, shareToken);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        await setDoc(docRef, {
          ...data,
          accessCount: (data.accessCount || 0) + 1,
          lastAccessedAt: Timestamp.fromDate(new Date()),
        });
      }
    } catch (error) {
      console.error('접근 횟수 업데이트 실패:', error);
    }
  }

  /**
   * 조직의 공유 링크 목록 조회
   */
  async getOrganizationSharedReports(organizationId: string): Promise<ShareableReport[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports: ShareableReport[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          ...data,
          subjectBirthDate: data.subjectBirthDate.toDate(),
          expiresAt: data.expiresAt.toDate(),
          createdAt: data.createdAt.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate(),
        } as ShareableReport);
      });
      
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('조직 공유 리포트 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 공유 링크 비활성화
   */
  async deactivateShareLink(shareToken: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, shareToken);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await setDoc(docRef, {
          ...docSnap.data(),
          isActive: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('공유 링크 비활성화 실패:', error);
      return false;
    }
  }

  /**
   * 공유 링크 삭제
   */
  async deleteShareLink(shareToken: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, shareToken);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('공유 링크 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 보안 토큰 생성
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 공유 링크 URL 생성
   */
  generateShareUrl(shareToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-report/${shareToken}`;
  }
}

export const reportSharingService = new ReportSharingService();
export default reportSharingService; 