/**
 * 저장소 권한 영구 저장 유틸리티
 * File System Access API의 디렉토리 핸들을 IndexedDB에 저장하여
 * 페이지 새로고침 후에도 권한을 유지합니다.
 */


const DB_NAME = 'LinkBandStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'directoryHandles';
const STORAGE_KEY = 'mainStorageDirectory';

interface StorageRecord {
  key: string;
  handle: FileSystemDirectoryHandle;
  name: string;
  timestamp: number;
}

class StoragePersistence {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * IndexedDB 초기화
   */
  private async initDB(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB 데이터베이스 열기 오류:', {
          metadata: { operation: 'openDatabase', dbName: DB_NAME, dbVersion: DB_VERSION }
        });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
    
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 기존 스토어가 있으면 삭제
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        // 새 스토어 생성
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        

      };
    });

    await this.initPromise;
  }

  /**
   * 디렉토리 핸들 저장
   */
  async saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      await this.initDB();
      
      if (!this.db) {
        throw new Error('IndexedDB가 초기화되지 않았습니다');
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record: StorageRecord = {
        key: STORAGE_KEY,
        handle: handle,
        name: handle.name,
        timestamp: Date.now()
      };

      const request = store.put(record);
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
    
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 디렉토리 핸들 복원
   */
  async restoreDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      await this.initDB();
      
      if (!this.db) {
        return null;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);
      
      const record = await new Promise<StorageRecord | undefined>((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });

      if (!record) {
  
        return null;
      }

             // 핸들의 권한 확인
       const handle = record.handle;
       try {
         // 직접 디렉토리 접근을 시도하여 권한 확인
         // 이 방법이 queryPermission/requestPermission보다 호환성이 좋음
 
         
         // 디렉토리 내용을 읽어보려고 시도
         const iterator = (handle as any).entries();
         await iterator.next(); // 첫 번째 항목만 확인
         
         
         return handle;
         
       } catch (error) {
         
         // 권한이 없거나 핸들이 무효한 경우
         if (error instanceof DOMException) {
           if (error.name === 'NotAllowedError') {
   
             // 브라우저에서 권한 요청 프롬프트가 자동으로 표시될 수 있음
             // 사용자가 거부하면 null 반환
             return null;
           } else if (error.name === 'NotFoundError') {
             
             // 핸들이 무효하므로 삭제
             await this.removeDirectoryHandle();
             return null;
           }
         }
         
         // 기타 오류의 경우 핸들 삭제
         await this.removeDirectoryHandle();
         return null;
       }

    } catch (error) {
      return null;
    }
  }

  /**
   * 저장된 디렉토리 핸들 정보 조회 (권한 확인 없이)
   */
  async getStoredDirectoryInfo(): Promise<{ name: string; timestamp: number } | null> {
    try {
      await this.initDB();
      
      if (!this.db) {
        return null;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);
      
      const record = await new Promise<StorageRecord | undefined>((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });

      if (!record) {
        return null;
      }

      return {
        name: record.name,
        timestamp: record.timestamp
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * 디렉토리 핸들 삭제
   */
  async removeDirectoryHandle(): Promise<void> {
    try {
      await this.initDB();
      
      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STORAGE_KEY);
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
    
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 모든 저장된 핸들 정리 (개발/디버그용)
   */
  async clearAll(): Promise<void> {
    try {
      await this.initDB();
      
      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
    
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * File System Access API 지원 여부 확인
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window && 'indexedDB' in window;
  }
}

// 싱글톤 인스턴스
export const storagePersistence = new StoragePersistence();

/**
 * 편의 함수들
 */
export const saveStorageDirectory = (handle: FileSystemDirectoryHandle) => {
  return storagePersistence.saveDirectoryHandle(handle);
};

export const restoreStorageDirectory = () => {
  return storagePersistence.restoreDirectoryHandle();
};

export const getStoredDirectoryInfo = () => {
  return storagePersistence.getStoredDirectoryInfo();
};

export const removeStorageDirectory = () => {
  return storagePersistence.removeDirectoryHandle();
};

export const clearAllStorageData = () => {
  return storagePersistence.clearAll();
};

export const isStoragePersistenceSupported = () => {
  return storagePersistence.isSupported();
}; 