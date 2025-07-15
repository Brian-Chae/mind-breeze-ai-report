/**
 * 고급 캐싱 시스템
 * 
 * 기능:
 * - 다양한 캐시 전략 (LRU, TTL, Size-based)
 * - 메모리, 브라우저 스토리지, IndexedDB 지원
 * - 캐시 무효화 및 패턴 매칭
 * - 캐시 통계 및 성능 메트릭
 * - 캐시 워밍 및 백그라운드 갱신
 * - 압축 및 직렬화
 */

import { logger, LogCategory } from './Logger';

// === 캐시 타입 정의 ===

export enum CacheStrategy {
  LRU = 'lru',           // Least Recently Used
  TTL = 'ttl',           // Time To Live
  SIZE = 'size',         // Size-based eviction
  FIFO = 'fifo',         // First In First Out
  LIFO = 'lifo'          // Last In First Out
}

export enum CacheStorage {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB'
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiry?: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  strategy: CacheStrategy;
  storage: CacheStorage;
  maxSize: number;        // 최대 엔트리 수
  maxMemory: number;      // 최대 메모리 사용량 (bytes)
  defaultTTL: number;     // 기본 TTL (ms)
  enableCompression: boolean;
  enableEncryption: boolean;
  namespace: string;
  enableStats: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // ms
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  memoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
  averageAccessTime: number;
  evictions: number;
  compressionSavings: number;
}

export interface CacheOperation {
  type: 'get' | 'set' | 'delete' | 'clear' | 'evict';
  key: string;
  timestamp: number;
  duration: number;
  hit?: boolean;
  size?: number;
}

// === 캐시 제공자 인터페이스 ===

interface CacheProvider<T = any> {
  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// === 메모리 캐시 제공자 ===

class MemoryCacheProvider<T = any> implements CacheProvider<T> {
  private cache = new Map<string, CacheEntry<T>>();

  async get(key: string): Promise<CacheEntry<T> | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

// === 로컬 스토리지 캐시 제공자 ===

class LocalStorageCacheProvider<T = any> implements CacheProvider<T> {
  constructor(private namespace: string) {}

  private getStorageKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.warn('LocalStorageCacheProvider', '캐시 항목 읽기 실패', { 
        metadata: { key, error } 
      }, LogCategory.SYSTEM);
      return null;
    }
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (error) {
      logger.error('LocalStorageCacheProvider', '캐시 항목 저장 실패', error as Error, { 
        metadata: { metadata: { key } } 
      }, LogCategory.SYSTEM);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(key);
      const existed = localStorage.getItem(storageKey) !== null;
      localStorage.removeItem(storageKey);
      return existed;
    } catch (error) {
      logger.error('LocalStorageCacheProvider', '캐시 항목 삭제 실패', error as Error, { metadata: { key } }, LogCategory.SYSTEM);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.namespace}:`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('LocalStorageCacheProvider', '캐시 전체 삭제 실패', error as Error, {}, LogCategory.SYSTEM);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.namespace}:`)) {
          keys.push(key.replace(`${this.namespace}:`, ''));
        }
      }
    } catch (error) {
      logger.error('LocalStorageCacheProvider', '캐시 키 목록 조회 실패', error as Error, {}, LogCategory.SYSTEM);
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

// === IndexedDB 캐시 제공자 ===

class IndexedDBCacheProvider<T = any> implements CacheProvider<T> {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private namespace: string) {}

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(`CacheDB_${this.namespace}`, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
      });
    }
    
    return this.dbPromise;
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDBCacheProvider', '캐시 항목 읽기 실패', error as Error, { metadata: { key } }, LogCategory.DATABASE);
      return null;
    }
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDBCacheProvider', '캐시 항목 저장 실패', error as Error, { metadata: { key } }, LogCategory.DATABASE);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDBCacheProvider', '캐시 항목 삭제 실패', error as Error, { metadata: { key } }, LogCategory.DATABASE);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDBCacheProvider', '캐시 전체 삭제 실패', error as Error, {}, LogCategory.DATABASE);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAllKeys();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDBCacheProvider', '캐시 키 목록 조회 실패', error as Error, {}, LogCategory.DATABASE);
      return [];
    }
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

// === 메인 캐시 클래스 ===

export class Cache<T = any> {
  private provider: CacheProvider<T>;
  private config: CacheConfig;
  private stats: CacheStats;
  private operations: CacheOperation[] = [];
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      strategy: CacheStrategy.LRU,
      storage: CacheStorage.MEMORY,
      maxSize: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000,   // 5분
      enableCompression: false,
      enableEncryption: false,
      namespace: 'default',
      enableStats: true,
      autoCleanup: true,
      cleanupInterval: 60 * 1000,   // 1분
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      memoryUsage: 0,
      averageAccessTime: 0,
      evictions: 0,
      compressionSavings: 0
    };

    // 캐시 제공자 초기화
    this.provider = this.createProvider();

    // 자동 정리 활성화
    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }

    logger.info('Cache', '캐시 시스템 초기화됨', {
      metadata: {
        strategy: this.config.strategy,
        storage: this.config.storage,
        namespace: this.config.namespace
      }
    }, LogCategory.SYSTEM);
  }

  // === 공개 메서드 ===

  /**
   * 캐시에서 값 조회
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  async get(key: string): Promise<T | null> {
    const startTime = Date.now();
    let hit = false;
    
    try {
      const entry = await this.provider.get(key);
      
      if (entry && this.isValidEntry(entry)) {
        // 캐시 히트
        hit = true;
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        await this.provider.set(key, entry);
        
        this.updateStats('get', key, startTime, true, entry.size);
        this.logOperation('get', key, startTime, true, entry.size);
        
        return entry.value;
      } else {
        // 캐시 미스 또는 만료된 엔트리
        if (entry) {
          await this.provider.delete(key);
        }
        
        this.updateStats('get', key, startTime, false);
        this.logOperation('get', key, startTime, false);
        
        return null;
      }
    } catch (error) {
      logger.error('Cache', '캐시 조회 실패', error as Error, { metadata: { key } }, LogCategory.SYSTEM);
      this.updateStats('get', key, startTime, false);
      return null;
    }
  }

  /**
   * 캐시에 값 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl TTL (milliseconds, 선택적)
   * @param tags 태그 (선택적)
   */
  async set(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: now,
        expiry: ttl ? now + ttl : (this.config.defaultTTL ? now + this.config.defaultTTL : undefined),
        accessCount: 0,
        lastAccessed: now,
        size: this.calculateSize(value),
        tags,
        metadata: {}
      };

      // 압축 적용 (필요시)
      if (this.config.enableCompression) {
        entry.value = await this.compress(value);
        entry.metadata!.compressed = true;
      }

      // 용량 확인 및 정리
      await this.ensureCapacity(entry.size);

      // 저장
      await this.provider.set(key, entry);
      
      this.updateStats('set', key, startTime, true, entry.size);
      this.logOperation('set', key, startTime, true, entry.size);
      
      logger.debug('Cache', '캐시 저장 완료', { 
        metadata: { key, size: entry.size, ttl } 
      }, LogCategory.SYSTEM);
      
    } catch (error) {
      logger.error('Cache', '캐시 저장 실패', error as Error, { metadata: { key } }, LogCategory.SYSTEM);
      throw error;
    }
  }

  /**
   * 캐시에서 키 삭제
   * @param key 캐시 키
   * @returns 삭제 성공 여부
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const deleted = await this.provider.delete(key);
      
      this.updateStats('delete', key, startTime, deleted);
      this.logOperation('delete', key, startTime, deleted);
      
      return deleted;
    } catch (error) {
      logger.error('Cache', '캐시 삭제 실패', error as Error, { metadata: { key } }, LogCategory.SYSTEM);
      return false;
    }
  }

  /**
   * 전체 캐시 삭제
   */
  async clear(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.provider.clear();
      
      this.resetStats();
      this.logOperation('clear', '*', startTime, true);
      
      logger.info('Cache', '전체 캐시 삭제 완료', {}, LogCategory.SYSTEM);
    } catch (error) {
      logger.error('Cache', '전체 캐시 삭제 실패', error as Error, {}, LogCategory.SYSTEM);
      throw error;
    }
  }

  /**
   * 패턴으로 캐시 키 삭제
   * @param pattern 정규식 패턴
   * @returns 삭제된 키 수
   */
  async deleteByPattern(pattern: RegExp): Promise<number> {
    try {
      const keys = await this.provider.keys();
      const matchingKeys = keys.filter(key => pattern.test(key));
      
      let deletedCount = 0;
      for (const key of matchingKeys) {
        if (await this.delete(key)) {
          deletedCount++;
        }
      }
      
      logger.info('Cache', '패턴 기반 캐시 삭제 완료', { 
        metadata: {
          pattern: pattern.source, 
          deleted: deletedCount 
        }
      }, LogCategory.SYSTEM);
      
      return deletedCount;
    } catch (error) {
      logger.error('Cache', '패턴 기반 캐시 삭제 실패', error as Error, { 
        metadata: {
          pattern: pattern.source 
        }
      }, LogCategory.SYSTEM);
      return 0;
    }
  }

  /**
   * 태그로 캐시 키 삭제
   * @param tag 태그
   * @returns 삭제된 키 수
   */
  async deleteByTag(tag: string): Promise<number> {
    try {
      const keys = await this.provider.keys();
      let deletedCount = 0;
      
      for (const key of keys) {
        const entry = await this.provider.get(key);
        if (entry && entry.tags && entry.tags.includes(tag)) {
          if (await this.delete(key)) {
            deletedCount++;
          }
        }
      }
      
      logger.info('Cache', '태그 기반 캐시 삭제 완료', { metadata: { tag, deleted: deletedCount } }, LogCategory.SYSTEM);
      return deletedCount;
    } catch (error) {
      logger.error('Cache', '태그 기반 캐시 삭제 실패', error as Error, { metadata: { tag } }, LogCategory.SYSTEM);
      return 0;
    }
  }

  /**
   * 캐시 키 존재 여부 확인
   * @param key 캐시 키
   * @returns 존재 여부
   */
  async has(key: string): Promise<boolean> {
    try {
      const entry = await this.provider.get(key);
      return entry !== null && this.isValidEntry(entry);
    } catch (error) {
      logger.error('Cache', '캐시 존재 확인 실패', error as Error, { metadata: { key } }, LogCategory.SYSTEM);
      return false;
    }
  }

  /**
   * 캐시 크기 조회
   * @returns 캐시 엔트리 수
   */
  async size(): Promise<number> {
    try {
      return await this.provider.size();
    } catch (error) {
      logger.error('Cache', '캐시 크기 조회 실패', error as Error, {}, LogCategory.SYSTEM);
      return 0;
    }
  }

  /**
   * 캐시 키 목록 조회
   * @returns 캐시 키 배열
   */
  async keys(): Promise<string[]> {
    try {
      return await this.provider.keys();
    } catch (error) {
      logger.error('Cache', '캐시 키 목록 조회 실패', error as Error, {}, LogCategory.SYSTEM);
      return [];
    }
  }

  // === 통계 및 모니터링 ===

  /**
   * 캐시 통계 조회
   * @returns 캐시 통계
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 최근 작업 내역 조회
   * @param limit 조회할 작업 수
   * @returns 작업 내역 배열
   */
  getRecentOperations(limit: number = 100): CacheOperation[] {
    return this.operations.slice(-limit);
  }

  /**
   * 캐시 상태 정보 조회
   */
  async getStatus(): Promise<{
    config: CacheConfig;
    stats: CacheStats;
    size: number;
    keys: string[];
  }> {
    return {
      config: this.config,
      stats: this.getStats(),
      size: await this.size(),
      keys: await this.keys()
    };
  }

  // === 유틸리티 메서드 ===

  /**
   * 만료된 엔트리 정리
   */
  async cleanup(): Promise<number> {
    try {
      const keys = await this.provider.keys();
      let cleanedCount = 0;
      
      for (const key of keys) {
        const entry = await this.provider.get(key);
        if (entry && !this.isValidEntry(entry)) {
          await this.provider.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        logger.info('Cache', '만료된 엔트리 정리 완료', { metadata: { cleaned: cleanedCount } }, LogCategory.SYSTEM);
      }
      
      return cleanedCount;
    } catch (error) {
      logger.error('Cache', '캐시 정리 실패', error as Error, {}, LogCategory.SYSTEM);
      return 0;
    }
  }

  /**
   * 캐시 제공자 생성
   */
  private createProvider(): CacheProvider<T> {
    switch (this.config.storage) {
      case CacheStorage.MEMORY:
        return new MemoryCacheProvider<T>();
      case CacheStorage.LOCAL_STORAGE:
        return new LocalStorageCacheProvider<T>(this.config.namespace);
      case CacheStorage.SESSION_STORAGE:
        // SessionStorage는 LocalStorage와 유사하게 구현 (생략)
        return new LocalStorageCacheProvider<T>(this.config.namespace);
      case CacheStorage.INDEXED_DB:
        return new IndexedDBCacheProvider<T>(this.config.namespace);
      default:
        return new MemoryCacheProvider<T>();
    }
  }

  /**
   * 엔트리 유효성 검증
   */
  private isValidEntry(entry: CacheEntry<T>): boolean {
    if (entry.expiry && Date.now() > entry.expiry) {
      return false;
    }
    return true;
  }

  /**
   * 값의 크기 계산 (대략적)
   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16 기준
    } catch {
      return 1000; // 기본값
    }
  }

  /**
   * 용량 확보
   */
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = await this.size();
    
    if (currentSize >= this.config.maxSize) {
      await this.evictEntries(1);
    }
    
    // TODO: 메모리 사용량 기반 정리도 구현
  }

  /**
   * 엔트리 축출
   */
  private async evictEntries(count: number): Promise<void> {
    const keys = await this.provider.keys();
    const entries: Array<{ key: string; entry: CacheEntry<T> }> = [];
    
    // 모든 엔트리 로드
    for (const key of keys) {
      const entry = await this.provider.get(key);
      if (entry) {
        entries.push({ key, entry });
      }
    }
    
    // 전략에 따라 정렬
    this.sortEntriesForEviction(entries);
    
    // 지정된 수만큼 삭제
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      await this.provider.delete(entries[i].key);
      this.stats.evictions++;
    }
  }

  /**
   * 축출을 위한 엔트리 정렬
   */
  private sortEntriesForEviction(entries: Array<{ key: string; entry: CacheEntry<T> }>): void {
    switch (this.config.strategy) {
      case CacheStrategy.LRU:
        entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
        break;
      case CacheStrategy.FIFO:
        entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        break;
      case CacheStrategy.LIFO:
        entries.sort((a, b) => b.entry.timestamp - a.entry.timestamp);
        break;
      case CacheStrategy.TTL:
        entries.sort((a, b) => (a.entry.expiry || 0) - (b.entry.expiry || 0));
        break;
      case CacheStrategy.SIZE:
        entries.sort((a, b) => b.entry.size - a.entry.size);
        break;
    }
  }

  /**
   * 압축 (구현 예정)
   */
  private async compress(value: T): Promise<T> {
    // TODO: 압축 로직 구현
    return value;
  }

  /**
   * 통계 업데이트
   */
  private updateStats(
    operation: string, 
    key: string, 
    startTime: number, 
    success: boolean, 
    size?: number
  ): void {
    if (!this.config.enableStats) return;
    
    const duration = Date.now() - startTime;
    
    if (operation === 'get') {
      if (success) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }
      this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    }
    
    if (size) {
      this.stats.totalSize += size;
    }
    
    // 평균 접근 시간 업데이트
    const totalOperations = this.operations.length;
    this.stats.averageAccessTime = 
      (this.stats.averageAccessTime * totalOperations + duration) / (totalOperations + 1);
  }

  /**
   * 작업 로깅
   */
  private logOperation(
    type: CacheOperation['type'], 
    key: string, 
    startTime: number, 
    hit?: boolean, 
    size?: number
  ): void {
    const operation: CacheOperation = {
      type,
      key,
      timestamp: startTime,
      duration: Date.now() - startTime,
      hit,
      size
    };
    
    this.operations.push(operation);
    
    // 최대 1000개 작업만 보관
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }
  }

  /**
   * 통계 초기화
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      memoryUsage: 0,
      averageAccessTime: 0,
      evictions: 0,
      compressionSavings: 0
    };
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('Cache', '자동 정리 실패', error, {}, LogCategory.SYSTEM);
      });
    }, this.config.cleanupInterval);
  }

  /**
   * 캐시 종료
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    logger.info('Cache', '캐시 시스템 종료됨', { metadata: { namespace: this.config.namespace } }, LogCategory.SYSTEM);
  }
}

// === 캐시 매니저 (여러 캐시 인스턴스 관리) ===

export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, Cache>();

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 캐시 인스턴스 생성 또는 조회
   * @param name 캐시 이름
   * @param config 캐시 설정
   * @returns 캐시 인스턴스
   */
  getCache<T = any>(name: string, config?: Partial<CacheConfig>): Cache<T> {
    if (!this.caches.has(name)) {
      const cacheConfig = {
        namespace: name,
        ...config
      };
      this.caches.set(name, new Cache<T>(cacheConfig));
    }
    return this.caches.get(name) as Cache<T>;
  }

  /**
   * 캐시 인스턴스 삭제
   * @param name 캐시 이름
   */
  destroyCache(name: string): void {
    const cache = this.caches.get(name);
    if (cache) {
      cache.destroy();
      this.caches.delete(name);
    }
  }

  /**
   * 모든 캐시 통계 조회
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * 모든 캐시 정리
   */
  async cleanupAll(): Promise<void> {
    const promises = Array.from(this.caches.values()).map(cache => cache.cleanup());
    await Promise.all(promises);
  }

  /**
   * 모든 캐시 종료
   */
  destroyAll(): void {
    for (const [name] of this.caches) {
      this.destroyCache(name);
    }
  }
}

// === 편의 함수 및 데코레이터 ===

/**
 * 기본 캐시 매니저 인스턴스
 */
export const cacheManager = CacheManager.getInstance();

/**
 * 기본 캐시 인스턴스 (메모리 기반)
 */
export const defaultCache = cacheManager.getCache('default');

/**
 * 메서드 결과 캐싱 데코레이터
 * @param ttl TTL (milliseconds)
 * @param cacheName 캐시 이름
 */
export function cached(ttl: number = 300000, cacheName: string = 'default') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = cacheManager.getCache(cacheName);
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      
      // 캐시에서 조회
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // 원본 메서드 실행
      const result = await originalMethod.apply(this, args);
      
      // 결과 캐싱
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * 캐시 무효화 데코레이터
 * @param pattern 무효화할 패턴
 * @param cacheName 캐시 이름
 */
export function invalidateCache(pattern: string | RegExp, cacheName: string = 'default') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = cacheManager.getCache(cacheName);
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // 캐시 무효화
      if (typeof pattern === 'string') {
        await cache.delete(pattern);
      } else {
        await cache.deleteByPattern(pattern);
      }
      
      return result;
    };
    
    return descriptor;
  };
} 