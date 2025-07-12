/**
 * AI Health Report 저장 및 관리 서비스
 * - 브라우저 로컬 스토리지 + IndexedDB 하이브리드 방식
 * - 최대 50개 리포트 저장 (FIFO 방식)
 * - 검색, 필터링, 내보내기 기능 지원
 */

import { AIAnalysisResult, PersonalInfo, MeasurementData } from '../types/index';

export interface StoredReport {
  id: string;
  timestamp: number;
  personalInfo: PersonalInfo;
  analysisResult: AIAnalysisResult;
  measurementData: MeasurementData;
  tags: string[];
  notes?: string;
  voiceFileId?: string; // 음성 파일 ID (추후 TTS 구현 시 사용)
}

export interface ReportSearchFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  stressLevel?: string;
  occupation?: string;
  keywords?: string;
  tags?: string[];
}

export interface ReportStats {
  totalReports: number;
  averageScore: number;
  latestReport?: StoredReport;
  oldestReport?: StoredReport;
  storageUsed: number; // bytes
}

export class ReportStorage {
  private static instance: ReportStorage;
  private readonly STORAGE_KEY = 'ai_health_reports';
  private readonly MAX_REPORTS = 50;
  private readonly DB_NAME = 'AIHealthReportDB';
  private readonly STORE_NAME = 'reports';
  
  private db: IDBDatabase | null = null;
  private dbInitialized: Promise<void> | null = null;
  private currentDBVersion: number = 1;

  private constructor() {
    this.dbInitialized = this.initializeDB();
  }

  public static getInstance(): ReportStorage {
    if (!ReportStorage.instance) {
      ReportStorage.instance = new ReportStorage();
    }
    return ReportStorage.instance;
  }

  /**
   * IndexedDB 초기화
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // IndexedDB 지원 여부 확인
      if (!window.indexedDB) {
        console.error('IndexedDB가 지원되지 않습니다.');
        reject(new Error('IndexedDB가 지원되지 않습니다.'));
        return;
      }

      const request = indexedDB.open(this.DB_NAME);
      
      request.onerror = () => {
        console.error('IndexedDB 초기화 실패:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.currentDBVersion = this.db.version;
        
        // 객체 스토어 존재 확인
        if (!this.db.objectStoreNames.contains(this.STORE_NAME)) {
          console.error('객체 스토어가 존재하지 않습니다. 데이터베이스 재생성 필요.');
          this.db.close();
          this.db = null;
          // 버전을 증가시켜 강제 업그레이드
          this.forceDBUpgrade().then(resolve).catch(reject);
          return;
        }
        
        console.log('✅ IndexedDB 초기화 완료');
        
        // 데이터베이스 연결 에러 핸들링
        this.db.onerror = (event) => {
          console.error('IndexedDB 연결 에러:', event);
        };
        
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        console.log('IndexedDB 업그레이드 중...');
        
        // 기존 스토어 삭제 (필요한 경우)
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
          console.log('기존 객체 스토어 삭제됨');
        }
        
        // reports 오브젝트 스토어 생성
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('overallScore', 'analysisResult.overallHealth.score', { unique: false });
        store.createIndex('occupation', 'personalInfo.occupation', { unique: false });
        
        console.log('✅ 오브젝트 스토어 생성 완료');
      };
      
      request.onblocked = () => {
        console.warn('IndexedDB 업그레이드가 차단되었습니다. 다른 탭을 닫아주세요.');
      };
    });
  }

  /**
   * 강제 데이터베이스 업그레이드
   */
  private async forceDBUpgrade(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 현재 버전 + 1로 강제 업그레이드
      const request = indexedDB.open(this.DB_NAME, this.currentDBVersion + 1);
      
      request.onerror = () => {
        console.error('강제 업그레이드 실패:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ 강제 업그레이드 완료');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 기존 스토어 삭제
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
        }
        
        // 새 스토어 생성
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('overallScore', 'analysisResult.overallHealth.score', { unique: false });
        store.createIndex('occupation', 'personalInfo.occupation', { unique: false });
        
        console.log('✅ 강제 업그레이드에서 스토어 재생성 완료');
      };
    });
  }

  /**
   * 데이터베이스 초기화 대기
   */
  private async ensureDBInitialized(): Promise<void> {
    if (this.dbInitialized) {
      await this.dbInitialized;
    }
    
    if (!this.db) {
      throw new Error('데이터베이스 초기화에 실패했습니다.');
    }
    
    // 객체 스토어 재확인
    if (!this.db.objectStoreNames.contains(this.STORE_NAME)) {
      console.error('객체 스토어가 존재하지 않습니다. 재초기화 시도...');
      this.db.close();
      this.db = null;
      this.dbInitialized = this.initializeDB();
      await this.dbInitialized;
    }
  }

  /**
   * 안전한 트랜잭션 생성
   */
  private createTransaction(mode: IDBTransactionMode): IDBTransaction {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }
    
    if (!this.db.objectStoreNames.contains(this.STORE_NAME)) {
      throw new Error(`객체 스토어 '${this.STORE_NAME}'가 존재하지 않습니다.`);
    }
    
    return this.db.transaction([this.STORE_NAME], mode);
  }

  /**
   * 데이터베이스 리셋 (개발/디버깅 용도)
   */
  public async resetDatabase(): Promise<void> {
    try {
      // 기존 연결 닫기
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      
      // 데이터베이스 삭제
      return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
        
        deleteRequest.onsuccess = () => {
          console.log('✅ 데이터베이스 삭제 완료');
          // 재초기화
          this.dbInitialized = this.initializeDB();
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.error('데이터베이스 삭제 실패:', deleteRequest.error);
          reject(deleteRequest.error);
        };
        
        deleteRequest.onblocked = () => {
          console.warn('데이터베이스 삭제가 차단되었습니다. 다른 탭을 닫아주세요.');
        };
      });
      
    } catch (error) {
      console.error('❌ 데이터베이스 리셋 실패:', error);
      throw error;
    }
  }

  /**
   * 새 리포트 저장
   */
  public async saveReport(
    personalInfo: PersonalInfo,
    analysisResult: AIAnalysisResult,
    measurementData: MeasurementData,
    tags: string[] = [],
    notes?: string
  ): Promise<string> {
    const reportId = this.generateReportId();
    
    const storedReport: StoredReport = {
      id: reportId,
      timestamp: Date.now(),
      personalInfo,
      analysisResult,
      measurementData,
      tags,
      notes
    };

    try {
      // IndexedDB에 저장
      await this.saveToIndexedDB(storedReport);
      
      // 로컬 스토리지에 메타데이터 저장 (빠른 조회용)
      await this.updateLocalStorageMetadata(storedReport);
      
      // 최대 개수 초과 시 오래된 리포트 삭제
      await this.enforceMaxReports();
      
      console.log(`✅ 리포트 저장 완료: ${reportId}`);
      return reportId;
      
    } catch (error) {
      console.error('❌ 리포트 저장 실패:', error);
      throw new Error('리포트 저장에 실패했습니다.');
    }
  }

  /**
   * 모든 리포트 조회
   */
  public async getAllReports(): Promise<StoredReport[]> {
    try {
      await this.ensureDBInitialized();
      
      console.log('🔍 리포트 조회 시작');
      console.log('DB 상태:', this.db ? '연결됨' : '연결 안됨');
      console.log('객체 스토어 목록:', this.db?.objectStoreNames ? Array.from(this.db.objectStoreNames) : '없음');

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.createTransaction('readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const index = store.index('timestamp');
          const request = index.getAll();

          request.onsuccess = () => {
            // 최신순으로 정렬
            const reports = request.result.sort((a, b) => b.timestamp - a.timestamp);
            console.log(`✅ ${reports.length}개 리포트 조회 완료`);
            resolve(reports);
          };

          request.onerror = () => {
            console.error('❌ 리포트 조회 요청 실패:', request.error);
            reject(request.error);
          };

          transaction.onerror = () => {
            console.error('❌ 트랜잭션 에러:', transaction.error);
            reject(transaction.error);
          };

          transaction.onabort = () => {
            console.error('❌ 트랜잭션 중단됨');
            reject(new Error('트랜잭션이 중단되었습니다.'));
          };
        } catch (transactionError) {
          console.error('❌ 트랜잭션 생성 실패:', transactionError);
          reject(transactionError);
        }
      });
      
    } catch (error) {
      console.error('❌ 리포트 조회 실패:', error);
      console.error('에러 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  /**
   * 특정 리포트 조회
   */
  public async getReport(reportId: string): Promise<StoredReport | null> {
    try {
      await this.ensureDBInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.createTransaction('readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(reportId);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.error('리포트 조회 실패:', request.error);
          reject(request.error);
        };
      });
      
    } catch (error) {
      console.error('❌ 리포트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 리포트 검색 및 필터링
   */
  public async searchReports(filter: ReportSearchFilter): Promise<StoredReport[]> {
    const allReports = await this.getAllReports();
    
    return allReports.filter(report => {
      // 날짜 범위 필터
      if (filter.dateRange) {
        const reportDate = new Date(report.timestamp);
        if (reportDate < filter.dateRange.start || reportDate > filter.dateRange.end) {
          return false;
        }
      }
      
      // 점수 범위 필터
      if (filter.scoreRange) {
        const score = report.analysisResult.overallHealth.score;
        if (score < filter.scoreRange.min || score > filter.scoreRange.max) {
          return false;
        }
      }
      
      // 스트레스 레벨 필터
      if (filter.stressLevel) {
        const stressLevel = report.analysisResult.detailedAnalysis.stressLevel.level;
        if (stressLevel !== filter.stressLevel) {
          return false;
        }
      }
      
      // 직업 필터
      if (filter.occupation) {
        if (report.personalInfo.occupation !== filter.occupation) {
          return false;
        }
      }
      
      // 키워드 검색
      if (filter.keywords) {
        const keywords = filter.keywords.toLowerCase();
        const searchText = [
          report.personalInfo.name,
          report.analysisResult.overallHealth.summary,
          report.analysisResult.detailedAnalysis.mentalHealth.analysis,
          report.analysisResult.detailedAnalysis.physicalHealth.analysis,
          report.notes || ''
        ].join(' ').toLowerCase();
        
        if (!searchText.includes(keywords)) {
          return false;
        }
      }
      
      // 태그 필터
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => 
          report.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 리포트 삭제
   */
  public async deleteReport(reportId: string): Promise<boolean> {
    try {
      await this.ensureDBInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.createTransaction('readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(reportId);

        request.onsuccess = () => {
          console.log(`✅ 리포트 삭제 완료: ${reportId}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('리포트 삭제 실패:', request.error);
          reject(request.error);
        };
      });
      
    } catch (error) {
      console.error('❌ 리포트 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 리포트 통계 조회
   */
  public async getReportStats(): Promise<ReportStats> {
    const reports = await this.getAllReports();
    
    if (reports.length === 0) {
      return {
        totalReports: 0,
        averageScore: 0,
        storageUsed: 0
      };
    }
    
    const totalScore = reports.reduce((sum, report) => 
      sum + report.analysisResult.overallHealth.score, 0
    );
    
    const storageUsed = this.calculateStorageSize(reports);
    
    return {
      totalReports: reports.length,
      averageScore: Math.round(totalScore / reports.length),
      latestReport: reports[0], // 이미 최신순 정렬됨
      oldestReport: reports[reports.length - 1],
      storageUsed
    };
  }

  /**
   * 모든 데이터 내보내기 (JSON)
   */
  public async exportAllReports(): Promise<string> {
    const reports = await this.getAllReports();
    const stats = await this.getReportStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      stats,
      reports
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 데이터 가져오기 (JSON)
   */
  public async importReports(jsonData: string): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      const reports = importData.reports as StoredReport[];
      
      let importedCount = 0;
      
      for (const report of reports) {
        // 중복 확인
        const existing = await this.getReport(report.id);
        if (!existing) {
          await this.saveToIndexedDB(report);
          importedCount++;
        }
      }
      
      console.log(`✅ ${importedCount}개 리포트 가져오기 완료`);
      return importedCount;
      
    } catch (error) {
      console.error('❌ 리포트 가져오기 실패:', error);
      throw new Error('리포트 가져오기에 실패했습니다.');
    }
  }

  // Private 헬퍼 메서드들

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveToIndexedDB(report: StoredReport): Promise<void> {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction('readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(report);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateLocalStorageMetadata(report: StoredReport): Promise<void> {
    try {
      const metadata = {
        id: report.id,
        timestamp: report.timestamp,
        name: report.personalInfo.name,
        score: report.analysisResult.overallHealth.score,
        grade: report.analysisResult.overallHealth.grade
      };
      
      const existingData = localStorage.getItem(this.STORAGE_KEY);
      const metadataList = existingData ? JSON.parse(existingData) : [];
      
      metadataList.unshift(metadata);
      
      // 최대 개수 제한
      if (metadataList.length > this.MAX_REPORTS) {
        metadataList.splice(this.MAX_REPORTS);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadataList));
      
    } catch (error) {
      console.warn('로컬 스토리지 메타데이터 업데이트 실패:', error);
    }
  }

  private async enforceMaxReports(): Promise<void> {
    const reports = await this.getAllReports();
    
    if (reports.length > this.MAX_REPORTS) {
      // 오래된 리포트들 삭제
      const reportsToDelete = reports.slice(this.MAX_REPORTS);
      
      for (const report of reportsToDelete) {
        await this.deleteReport(report.id);
      }
      
      console.log(`🗑️ ${reportsToDelete.length}개 오래된 리포트 삭제됨`);
    }
  }

  private calculateStorageSize(reports: StoredReport[]): number {
    const jsonString = JSON.stringify(reports);
    return new Blob([jsonString]).size;
  }
}

export default ReportStorage; 