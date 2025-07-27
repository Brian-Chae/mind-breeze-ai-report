/**
 * 원시 측정 데이터 저장 서비스
 * 1분 전체 센서 데이터의 효율적인 저장과 관리를 담당
 */

import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { BaseService } from '../../../core/services/BaseService';
import { storage } from '../../../core/services/firebase';

export interface RawMeasurementData {
  eeg: Float32Array | number[];
  ppg: Float32Array | number[];
  acc: Float32Array | number[];
  timestamps: {
    eeg: Float32Array | number[];
    ppg: Float32Array | number[];
    acc: Float32Array | number[];
  };
}

export interface RawDataStorageOptions {
  compressionEnabled?: boolean;
  storageType?: 'firestore' | 'storage' | 'hybrid';
  includeTimestamps?: boolean;
}

export interface RawDataMetadata {
  measurementId: string;
  storageUrl?: string;
  storageType: string;
  compressed: boolean;
  dataSize: number;
  sampleCounts: {
    eeg: number;
    ppg: number;
    acc: number;
  };
  createdAt: Date;
}

export class RawDataStorageService extends BaseService {
  private static readonly RAW_DATA_COLLECTION = 'rawMeasurementData';
  private static readonly SAMPLES_COLLECTION = 'measurementDataSamples';
  
  /**
   * 전체 원시 데이터 저장
   */
  async saveRawData(
    measurementId: string,
    rawData: RawMeasurementData,
    options: RawDataStorageOptions = {}
  ): Promise<RawDataMetadata> {
    const { 
      compressionEnabled = true, 
      storageType = 'hybrid',
      includeTimestamps = true 
    } = options;
    
    try {
      const metadata: RawDataMetadata = {
        measurementId,
        storageType,
        compressed: compressionEnabled,
        dataSize: this.calculateDataSize(rawData),
        sampleCounts: {
          eeg: rawData.eeg.length,
          ppg: rawData.ppg.length,
          acc: rawData.acc.length
        },
        createdAt: new Date()
      };

      if (storageType === 'firestore') {
        // Firestore 직접 저장 (1MB 제한 주의)
        await this.saveToFirestore(measurementId, rawData, compressionEnabled);
        
      } else if (storageType === 'storage') {
        // Firebase Storage 저장 (대용량 데이터 권장)
        const storageUrl = await this.saveToStorage(measurementId, rawData, compressionEnabled);
        metadata.storageUrl = storageUrl;
        
        // Firestore에 메타데이터 저장
        await this.saveMetadata(measurementId, metadata);
        
      } else {
        // Hybrid: Storage + Firestore 샘플
        const storageUrl = await this.saveToStorage(measurementId, rawData, compressionEnabled);
        metadata.storageUrl = storageUrl;
        
        await this.saveMetadata(measurementId, metadata);
        await this.saveSamples(measurementId, rawData);
      }
      
      return metadata;
      
    } catch (error) {
      console.error('Failed to save raw data:', error);
      throw error;
    }
  }
  
  /**
   * 원시 데이터 로드
   */
  async loadRawData(
    measurementId: string,
    storageUrl?: string
  ): Promise<RawMeasurementData | null> {
    try {
      if (storageUrl) {
        // Storage에서 로드
        return await this.loadFromStorage(storageUrl);
      } else {
        // Firestore에서 로드
        return await this.loadFromFirestore(measurementId);
      }
    } catch (error) {
      console.error('Failed to load raw data:', error);
      return null;
    }
  }
  
  /**
   * Firestore에 저장
   */
  private async saveToFirestore(
    measurementId: string,
    rawData: RawMeasurementData,
    compress: boolean
  ): Promise<void> {
    const data = compress ? await this.compressData(rawData) : rawData;
    
    await setDoc(
      doc(this.db, RawDataStorageService.RAW_DATA_COLLECTION, measurementId),
      {
        measurementId,
        eegData: Array.from(data.eeg),
        ppgData: Array.from(data.ppg),
        accData: Array.from(data.acc),
        eegTimestamps: data.timestamps ? Array.from(data.timestamps.eeg) : null,
        ppgTimestamps: data.timestamps ? Array.from(data.timestamps.ppg) : null,
        accTimestamps: data.timestamps ? Array.from(data.timestamps.acc) : null,
        compressed: compress,
        createdAt: Timestamp.now()
      }
    );
  }
  
  /**
   * Firebase Storage에 저장
   */
  private async saveToStorage(
    measurementId: string,
    rawData: RawMeasurementData,
    compress: boolean
  ): Promise<string> {
    // 바이너리 형식으로 변환
    const binaryData = this.convertToBinary(rawData);
    
    // 압축 (선택적)
    const dataToUpload = compress 
      ? await this.compressBuffer(binaryData)
      : binaryData;
    
    // Storage에 업로드
    const storageRef = ref(storage, `measurements/${measurementId}/raw-data.bin`);
    const snapshot = await uploadBytes(storageRef, dataToUpload, {
      contentType: compress ? 'application/gzip' : 'application/octet-stream',
      customMetadata: {
        measurementId,
        compressed: compress.toString(),
        eegSamples: rawData.eeg.length.toString(),
        ppgSamples: rawData.ppg.length.toString(),
        accSamples: rawData.acc.length.toString(),
        version: '1.0'
      }
    });
    
    return await getDownloadURL(snapshot.ref);
  }
  
  /**
   * 샘플 데이터 저장 (미리보기용)
   */
  private async saveSamples(
    measurementId: string,
    rawData: RawMeasurementData,
    sampleRate: number = 100
  ): Promise<void> {
    await setDoc(
      doc(this.db, RawDataStorageService.SAMPLES_COLLECTION, measurementId),
      {
        measurementId,
        eegSamples: this.sampleArray(rawData.eeg, sampleRate),
        ppgSamples: this.sampleArray(rawData.ppg, sampleRate),
        accSamples: this.sampleArray(rawData.acc, sampleRate),
        sampleRate,
        totalSamples: {
          eeg: rawData.eeg.length,
          ppg: rawData.ppg.length,
          acc: rawData.acc.length
        },
        createdAt: Timestamp.now()
      }
    );
  }
  
  /**
   * 메타데이터 저장
   */
  private async saveMetadata(
    measurementId: string,
    metadata: RawDataMetadata
  ): Promise<void> {
    await updateDoc(
      doc(this.db, 'measurementData', measurementId),
      {
        rawDataMetadata: {
          ...metadata,
          createdAt: Timestamp.fromDate(metadata.createdAt)
        },
        hasRawData: true,
        updatedAt: Timestamp.now()
      }
    );
  }
  
  /**
   * Storage에서 로드
   */
  private async loadFromStorage(storageUrl: string): Promise<RawMeasurementData> {
    const response = await fetch(storageUrl);
    const buffer = await response.arrayBuffer();
    
    // 압축 여부 확인
    const isCompressed = response.headers.get('content-type') === 'application/gzip';
    const data = isCompressed 
      ? await this.decompressBuffer(buffer)
      : buffer;
    
    return this.parseBinaryData(data);
  }
  
  /**
   * Firestore에서 로드
   */
  private async loadFromFirestore(measurementId: string): Promise<RawMeasurementData | null> {
    const docSnap = await getDoc(
      doc(this.db, RawDataStorageService.RAW_DATA_COLLECTION, measurementId)
    );
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      eeg: new Float32Array(data.eegData),
      ppg: new Float32Array(data.ppgData),
      acc: new Float32Array(data.accData),
      timestamps: data.eegTimestamps ? {
        eeg: new Float32Array(data.eegTimestamps),
        ppg: new Float32Array(data.ppgTimestamps),
        acc: new Float32Array(data.accTimestamps)
      } : {
        eeg: new Float32Array(0),
        ppg: new Float32Array(0),
        acc: new Float32Array(0)
      }
    };
  }
  
  /**
   * 바이너리 변환
   */
  private convertToBinary(data: RawMeasurementData): ArrayBuffer {
    const eegArray = new Float32Array(data.eeg);
    const ppgArray = new Float32Array(data.ppg);
    const accArray = new Float32Array(data.acc);
    
    // 헤더 크기: 버전(4) + 타임스탬프 플래그(4) + 각 배열 길이(12)
    const headerSize = 20;
    const dataSize = eegArray.byteLength + ppgArray.byteLength + accArray.byteLength;
    
    let timestampSize = 0;
    let eegTimestamps: Float32Array | null = null;
    let ppgTimestamps: Float32Array | null = null;
    let accTimestamps: Float32Array | null = null;
    
    if (data.timestamps) {
      eegTimestamps = new Float32Array(data.timestamps.eeg);
      ppgTimestamps = new Float32Array(data.timestamps.ppg);
      accTimestamps = new Float32Array(data.timestamps.acc);
      timestampSize = eegTimestamps.byteLength + ppgTimestamps.byteLength + accTimestamps.byteLength;
    }
    
    const totalSize = headerSize + dataSize + timestampSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // 헤더 작성
    let offset = 0;
    view.setUint32(offset, 1, true); // 버전
    offset += 4;
    
    view.setUint32(offset, data.timestamps ? 1 : 0, true); // 타임스탬프 포함 여부
    offset += 4;
    
    view.setUint32(offset, eegArray.length, true);
    offset += 4;
    
    view.setUint32(offset, ppgArray.length, true);
    offset += 4;
    
    view.setUint32(offset, accArray.length, true);
    offset += 4;
    
    // 데이터 복사
    new Uint8Array(buffer, offset).set(new Uint8Array(eegArray.buffer));
    offset += eegArray.byteLength;
    
    new Uint8Array(buffer, offset).set(new Uint8Array(ppgArray.buffer));
    offset += ppgArray.byteLength;
    
    new Uint8Array(buffer, offset).set(new Uint8Array(accArray.buffer));
    offset += accArray.byteLength;
    
    // 타임스탬프 복사 (있는 경우)
    if (eegTimestamps && ppgTimestamps && accTimestamps) {
      new Uint8Array(buffer, offset).set(new Uint8Array(eegTimestamps.buffer));
      offset += eegTimestamps.byteLength;
      
      new Uint8Array(buffer, offset).set(new Uint8Array(ppgTimestamps.buffer));
      offset += ppgTimestamps.byteLength;
      
      new Uint8Array(buffer, offset).set(new Uint8Array(accTimestamps.buffer));
    }
    
    return buffer;
  }
  
  /**
   * 바이너리 파싱
   */
  private parseBinaryData(buffer: ArrayBuffer): RawMeasurementData {
    const view = new DataView(buffer);
    let offset = 0;
    
    // 헤더 읽기
    const version = view.getUint32(offset, true);
    offset += 4;
    
    const hasTimestamps = view.getUint32(offset, true) === 1;
    offset += 4;
    
    const eegLength = view.getUint32(offset, true);
    offset += 4;
    
    const ppgLength = view.getUint32(offset, true);
    offset += 4;
    
    const accLength = view.getUint32(offset, true);
    offset += 4;
    
    // 데이터 추출
    const eeg = new Float32Array(buffer, offset, eegLength);
    offset += eegLength * 4;
    
    const ppg = new Float32Array(buffer, offset, ppgLength);
    offset += ppgLength * 4;
    
    const acc = new Float32Array(buffer, offset, accLength);
    offset += accLength * 4;
    
    // 타임스탬프 추출
    const timestamps = {
      eeg: new Float32Array(0),
      ppg: new Float32Array(0),
      acc: new Float32Array(0)
    };
    
    if (hasTimestamps) {
      timestamps.eeg = new Float32Array(buffer, offset, eegLength);
      offset += eegLength * 4;
      
      timestamps.ppg = new Float32Array(buffer, offset, ppgLength);
      offset += ppgLength * 4;
      
      timestamps.acc = new Float32Array(buffer, offset, accLength);
    }
    
    return { eeg, ppg, acc, timestamps };
  }
  
  /**
   * 압축 (브라우저 환경)
   */
  private async compressBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    // CompressionStream API 사용 (최신 브라우저)
    if ('CompressionStream' in window) {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(buffer);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      const reader = cs.readable.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // 청크 합치기
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
    
    // 폴백: 압축 없이 반환
    console.warn('CompressionStream not supported, saving uncompressed');
    return buffer;
  }
  
  /**
   * 압축 해제
   */
  private async decompressBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    if ('DecompressionStream' in window) {
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(buffer);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
    
    return buffer;
  }
  
  /**
   * 데이터 압축 (간단한 방식)
   */
  private async compressData(data: RawMeasurementData): Promise<RawMeasurementData> {
    // Delta encoding 등 적용 가능
    // 현재는 그대로 반환
    return data;
  }
  
  /**
   * 배열 샘플링
   */
  private sampleArray(arr: Float32Array | number[], rate: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < arr.length; i += rate) {
      result.push(Number(arr[i]));
    }
    return result;
  }
  
  /**
   * 데이터 크기 계산
   */
  private calculateDataSize(data: RawMeasurementData): number {
    const dataSize = (data.eeg.length + data.ppg.length + data.acc.length) * 4;
    const timestampSize = data.timestamps 
      ? (data.timestamps.eeg.length + data.timestamps.ppg.length + data.timestamps.acc.length) * 4
      : 0;
    return dataSize + timestampSize;
  }
  
  /**
   * 원시 데이터 삭제
   */
  async deleteRawData(measurementId: string, storageUrl?: string): Promise<void> {
    try {
      // Storage에서 삭제
      if (storageUrl) {
        const storageRef = ref(storage, `measurements/${measurementId}/raw-data.bin`);
        await deleteObject(storageRef);
      }
      
      // Firestore에서 삭제
      await deleteDoc(doc(this.db, RawDataStorageService.RAW_DATA_COLLECTION, measurementId));
      await deleteDoc(doc(this.db, RawDataStorageService.SAMPLES_COLLECTION, measurementId));
      
    } catch (error) {
      console.error('Failed to delete raw data:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const rawDataStorageService = new RawDataStorageService();