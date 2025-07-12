/**
 * API 키 관리 서비스
 * - 안전한 API 키 저장 및 조회
 * - localStorage 기반 단순화된 방식
 * - 키 마스킹 및 유효성 검증
 * - 사용 기록 추적
 * - API 키 테스트 기능
 */

export interface APIKeyMetadata {
  id: string;
  name: string;
  service: string;
  createdAt: number;
  lastUsed: number | null;
  isActive: boolean;
  maskedKey: string;
  isVerified?: boolean; // 테스트 통과 여부
  lastTestedAt?: number; // 마지막 테스트 시간
}

export interface APIKeyData {
  id: string;
  value: string;
  timestamp: number;
  metadata: APIKeyMetadata;
}

export interface APIKeyTestResult {
  isValid: boolean;
  error?: string;
  responseTime?: number;
  testData?: any;
}

export class APIKeyManager {
  private static readonly STORAGE_KEY = 'ai-health-api-keys';
  private static readonly KEYS_STORAGE_KEY = 'ai-health-api-keys-data';

  /**
   * 간단한 Base64 인코딩
   */
  private static encodeKey(key: string): string {
    return btoa(key);
  }

  /**
   * 간단한 Base64 디코딩
   */
  private static decodeKey(encodedKey: string): string {
    try {
      return atob(encodedKey);
    } catch (error) {
      console.error('키 디코딩 실패:', error);
      return '';
    }
  }

  /**
   * localStorage에 API 키 저장
   */
  static async saveAPIKeyData(keyData: APIKeyData): Promise<void> {
    try {
      console.log(`💾 localStorage에 키 저장 시작: ${keyData.id}`);
      
      // 기존 키 데이터 가져오기
      const existingData = this.getAllAPIKeyData();
      
      // 새 키 데이터 추가/업데이트
      const encodedKeyData = {
        ...keyData,
        value: this.encodeKey(keyData.value)
      };
      
      existingData[keyData.id] = encodedKeyData;
      
      // localStorage에 저장
      localStorage.setItem(this.KEYS_STORAGE_KEY, JSON.stringify(existingData));
      
      console.log('✅ localStorage에 키 저장 완료');
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      throw error;
    }
  }

  /**
   * localStorage에서 API 키 조회
   */
  static async getAPIKeyData(keyId: string): Promise<APIKeyData | null> {
    try {
      console.log(`🔍 localStorage에서 키 조회 시작: ${keyId}`);
      
      const allData = this.getAllAPIKeyData();
      const keyData = allData[keyId];
      
      if (keyData) {
        // 키 디코딩
        const decodedKeyData = {
          ...keyData,
          value: this.decodeKey(keyData.value)
        };
        
        console.log(`📊 조회된 키 데이터: OK`);
        return decodedKeyData;
      }
      
      console.log(`📊 조회된 키 데이터: NULL`);
      return null;
    } catch (error) {
      console.error('API 키 조회 실패:', error);
      return null;
    }
  }

  /**
   * 모든 API 키 데이터 가져오기
   */
  private static getAllAPIKeyData(): { [keyId: string]: APIKeyData } {
    try {
      const data = localStorage.getItem(this.KEYS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('API 키 데이터 파싱 실패:', error);
      return {};
    }
  }

  /**
   * API 키 저장 (테스트 후 저장)
   */
  static async saveAPIKey(
    keyId: string, 
    keyValue: string, 
    metadata: Partial<APIKeyMetadata> = {},
    testBeforeSave: boolean = true
  ): Promise<APIKeyTestResult> {
    try {
      let testResult: APIKeyTestResult = { isValid: true };
      
      // 테스트 수행
      if (testBeforeSave) {
        if (metadata.service === 'gemini') {
          testResult = await this.testGeminiAPIKey(keyValue);
        }
        
        if (!testResult.isValid) {
          return testResult;
        }
      }
      
      // 메타데이터 생성
      const newMetadata: APIKeyMetadata = {
        id: keyId,
        name: metadata.name || keyId,
        service: metadata.service || 'unknown',
        createdAt: metadata.createdAt || Date.now(),
        lastUsed: null,
        isActive: true,
        maskedKey: this.maskAPIKey(keyValue),
        isVerified: testResult.isValid,
        lastTestedAt: Date.now()
      };
      
      // 메타데이터를 localStorage에 저장
      const metadataList = this.getAPIKeyMetadata();
      const existingIndex = metadataList.findIndex(item => item.id === keyId);
      
      if (existingIndex >= 0) {
        metadataList[existingIndex] = { ...metadataList[existingIndex], ...newMetadata };
      } else {
        metadataList.push(newMetadata);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadataList));
      
      // 실제 API 키 데이터 저장
      const keyData: APIKeyData = {
        id: keyId,
        value: keyValue,
        timestamp: Date.now(),
        metadata: newMetadata
      };
      
      await this.saveAPIKeyData(keyData);
      
      return testResult;
    } catch (error) {
      console.error('API 키 저장 중 오류:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Gemini API 키 테스트
   */
  static async testGeminiAPIKey(apiKey: string): Promise<APIKeyTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧪 Gemini API 키 테스트 시작...');
      
      // 간단한 테스트 요청
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, this is a test message. Please respond with 'OK'."
            }]
          }]
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini API 키 테스트 성공');
        return {
          isValid: true,
          responseTime,
          testData: data
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Gemini API 키 테스트 실패:', errorData);
        return {
          isValid: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Gemini API 키 테스트 중 네트워크 오류:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '네트워크 오류',
        responseTime
      };
    }
  }

  /**
   * API 키 조회
   */
  static async getAPIKey(keyId: string): Promise<string | null> {
    try {
      console.log(`🔍 localStorage에서 키 조회 시작: ${keyId}`);
      const keyData = await this.getAPIKeyData(keyId);
      console.log(`📊 조회된 키 데이터:`, keyData ? 'OK' : 'NULL');
      return keyData ? keyData.value : null;
    } catch (error) {
      console.error('API 키 조회 실패:', error);
      return null;
    }
  }

  /**
   * API 키 메타데이터 목록 조회
   */
  static getAPIKeyMetadata(): APIKeyMetadata[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('API 키 메타데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 API 키 메타데이터 조회
   */
  static getAPIKeyMetadataById(keyId: string): APIKeyMetadata | null {
    const metadata = this.getAPIKeyMetadata();
    return metadata.find(item => item.id === keyId) || null;
  }

  /**
   * API 키 삭제
   */
  static async deleteAPIKey(keyId: string): Promise<void> {
    try {
      // 메타데이터에서 제거
      const metadataList = this.getAPIKeyMetadata();
      const filteredMetadata = metadataList.filter(item => item.id !== keyId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMetadata));
      
      // 실제 키 데이터에서 제거
      const allData = this.getAllAPIKeyData();
      delete allData[keyId];
      localStorage.setItem(this.KEYS_STORAGE_KEY, JSON.stringify(allData));
      
      console.log(`🗑️ API 키 삭제 완료: ${keyId}`);
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * API 키 마스킹
   */
  static maskAPIKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  }

  /**
   * Gemini API 키 형식 검증
   */
  static validateGeminiAPIKey(key: string): boolean {
    return key.startsWith('AIza') && key.length === 39;
  }

  /**
   * 마지막 사용 시간 업데이트
   */
  static updateLastUsed(keyId: string): void {
    try {
      const metadataList = this.getAPIKeyMetadata();
      const index = metadataList.findIndex(item => item.id === keyId);
      
      if (index >= 0) {
        metadataList[index].lastUsed = Date.now();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadataList));
      }
    } catch (error) {
      console.error('마지막 사용 시간 업데이트 실패:', error);
    }
  }

  /**
   * API 키 활성화/비활성화
   */
  static toggleAPIKeyActive(keyId: string, isActive: boolean): void {
    try {
      const metadataList = this.getAPIKeyMetadata();
      const index = metadataList.findIndex(item => item.id === keyId);
      
      if (index >= 0) {
        metadataList[index].isActive = isActive;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadataList));
      }
    } catch (error) {
      console.error('API 키 활성화 상태 변경 실패:', error);
    }
  }

  /**
   * 모든 API 키 삭제
   */
  static async clearAllAPIKeys(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.KEYS_STORAGE_KEY);
      console.log('🗑️ 모든 API 키 삭제 완료');
    } catch (error) {
      console.error('API 키 전체 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * API 키 개수 조회
   */
  static getAPIKeyCount(): number {
    return this.getAPIKeyMetadata().length;
  }

  /**
   * 활성화된 API 키 개수 조회
   */
  static getActiveAPIKeyCount(): number {
    return this.getAPIKeyMetadata().filter(key => key.isActive).length;
  }

  /**
   * 서비스별 API 키 목록 조회
   */
  static getAPIKeysByService(service: string): APIKeyMetadata[] {
    return this.getAPIKeyMetadata().filter(key => key.service === service);
  }

  /**
   * 검증된 API 키 목록 조회
   */
  static getVerifiedAPIKeys(): APIKeyMetadata[] {
    return this.getAPIKeyMetadata().filter(key => key.isVerified);
  }

  /**
   * 활성화된 Gemini API 키 조회
   */
  static async getActiveGeminiAPIKey(): Promise<string | null> {
    console.log('🔍 활성화된 Gemini API 키 조회 시작');
    const geminiKeys = this.getAPIKeysByService('gemini');
    console.log('📋 Gemini 서비스 키 목록:', geminiKeys);
    
    const activeKey = geminiKeys.find(key => key.isActive && key.isVerified);
    console.log('🎯 활성화된 키:', activeKey);
    
    if (activeKey) {
      console.log(`🔑 활성 키 ID로 실제 키 조회: ${activeKey.id}`);
      const actualKey = await this.getAPIKey(activeKey.id);
      console.log('📊 실제 키 조회 결과:', actualKey ? 'OK' : 'NULL');
      return actualKey;
    }
    
    return null;
  }
} 