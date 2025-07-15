import { EEGDataPoint, PPGDataPoint, ACCDataPoint } from '../utils/SimpleCircularBuffer';
import { ProcessedEEGData } from '../types/eeg';
import { ProcessedPPGData, ProcessedACCData } from './StreamingStorageService';

/**
 * 다중 형식 데이터 Writer 클래스들
 * 스트리밍 방식으로 메모리 효율적인 파일 저장 제공
 */

export interface DataWriter {
  initialize(fileHandle: FileSystemWritableFileStream): Promise<void>;
  writeChunk(data: any[]): Promise<void>;
  finalize(): Promise<void>;
  getEstimatedSize(): number;
}

/**
 * JSON Lines Writer
 * 각 데이터를 한 줄씩 JSON으로 저장 (메모리 효율적)
 */
export class JSONLinesWriter implements DataWriter {
  private writer: WritableStreamDefaultWriter<any> | null = null;
  private bytesWritten = 0;
  private isFirstWrite = true;

  async initialize(fileHandle: FileSystemWritableFileStream): Promise<void> {
    this.writer = fileHandle.getWriter();
    this.bytesWritten = 0;
    this.isFirstWrite = true;
  }

  async writeChunk(data: any[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');

    for (const item of data) {
      const jsonLine = JSON.stringify(item) + '\n';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(jsonLine);
      
      await this.writer.write(bytes);
      this.bytesWritten += bytes.length;
    }
  }

  async finalize(): Promise<void> {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
  }

  getEstimatedSize(): number {
    return this.bytesWritten;
  }
}

/**
 * CSV Writer
 * 헤더와 데이터를 CSV 형식으로 저장
 */
export class CSVWriter implements DataWriter {
  private writer: WritableStreamDefaultWriter<any> | null = null;
  private bytesWritten = 0;
  private headerWritten = false;
  private columns: string[] = [];

  async initialize(fileHandle: FileSystemWritableFileStream): Promise<void> {
    this.writer = fileHandle.getWriter();
    this.bytesWritten = 0;
    this.headerWritten = false;
  }

  async writeChunk(data: any[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');
    if (data.length === 0) return;

    const encoder = new TextEncoder();

    // 헤더 작성 (첫 번째 청크에서만)
    if (!this.headerWritten) {
      this.columns = Object.keys(data[0]);
      const headerLine = this.columns.join(',') + '\n';
      const headerBytes = encoder.encode(headerLine);
      await this.writer.write(headerBytes);
      this.bytesWritten += headerBytes.length;
      this.headerWritten = true;
    }

    // 데이터 행 작성
    for (const item of data) {
      const values = this.columns.map(col => {
        const value = item[col];
        // CSV 이스케이프 처리
        if (typeof value === 'string' && (value.includes(',') || value.includes('\"') || value.includes('\n'))) {
          return `\"${value.replace(/\"/g, '\"\"')}\"`;
        }
        return value !== null && value !== undefined ? value.toString() : '';
      });
      
      const csvLine = values.join(',') + '\n';
      const bytes = encoder.encode(csvLine);
      await this.writer.write(bytes);
      this.bytesWritten += bytes.length;
    }
  }

  async finalize(): Promise<void> {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
  }

  getEstimatedSize(): number {
    return this.bytesWritten;
  }
}

/**
 * Binary Writer
 * 고성능 바이너리 형식으로 저장 (가장 작은 크기)
 */
export class BinaryWriter implements DataWriter {
  private writer: WritableStreamDefaultWriter<any> | null = null;
  private bytesWritten = 0;
  private dataType: 'eeg' | 'ppg' | 'acc' | 'processed' = 'eeg';

  constructor(dataType: 'eeg' | 'ppg' | 'acc' | 'processed' = 'eeg') {
    this.dataType = dataType;
  }

  async initialize(fileHandle: FileSystemWritableFileStream): Promise<void> {
    this.writer = fileHandle.getWriter();
    this.bytesWritten = 0;

    // 바이너리 헤더 작성
    const header = this.createBinaryHeader();
    await this.writer.write(header);
    this.bytesWritten += header.length;
  }

  private createBinaryHeader(): Uint8Array {
    const encoder = new TextEncoder();
    const magic = encoder.encode('LNKB'); // 매직 넘버
    const version = new Uint8Array([1, 0]); // 버전 1.0
    const dataTypeBytes = encoder.encode(this.dataType.padEnd(8, '\0'));
    const timestamp = new ArrayBuffer(8);
    new DataView(timestamp).setBigUint64(0, BigInt(Date.now()), true);
    
    const header = new Uint8Array(magic.length + version.length + dataTypeBytes.length + timestamp.byteLength);
    let offset = 0;
    
    header.set(magic, offset);
    offset += magic.length;
    header.set(version, offset);
    offset += version.length;
    header.set(dataTypeBytes, offset);
    offset += dataTypeBytes.length;
    header.set(new Uint8Array(timestamp), offset);
    
    return header;
  }

  async writeChunk(data: any[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');

    for (const item of data) {
      const binaryData = this.serializeToBinary(item);
      await this.writer.write(binaryData);
      this.bytesWritten += binaryData.length;
    }
  }

  private serializeToBinary(item: any): Uint8Array {
    switch (this.dataType) {
      case 'eeg':
        return this.serializeEEGData(item as EEGDataPoint);
      case 'ppg':
        return this.serializePPGData(item as PPGDataPoint);
      case 'acc':
        return this.serializeACCData(item as ACCDataPoint);
      case 'processed':
        return this.serializeProcessedData(item);
      default:
        throw new Error(`Unsupported data type: ${this.dataType}`);
    }
  }

  private serializeEEGData(data: EEGDataPoint): Uint8Array {
    // EEG 데이터: timestamp(8) + fp1(4) + fp2(4) + signalQuality(4) = 20 bytes
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    
    view.setBigUint64(0, BigInt(data.timestamp), true);
    view.setFloat32(8, data.fp1, true);
    view.setFloat32(12, data.fp2, true);
    view.setFloat32(16, data.signalQuality || 0, true);
    
    return new Uint8Array(buffer);
  }

  private serializePPGData(data: PPGDataPoint): Uint8Array {
    // PPG 데이터: timestamp(8) + red(4) + ir(4) = 16 bytes
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    
    view.setBigUint64(0, BigInt(data.timestamp), true);
    view.setFloat32(8, data.red, true);
    view.setFloat32(12, data.ir, true);
    
    return new Uint8Array(buffer);
  }

  private serializeACCData(data: ACCDataPoint): Uint8Array {
    // ACC 데이터: timestamp(8) + x(4) + y(4) + z(4) + magnitude(4) = 24 bytes
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    
    view.setBigUint64(0, BigInt(data.timestamp), true);
    view.setFloat32(8, data.x, true);
    view.setFloat32(12, data.y, true);
    view.setFloat32(16, data.z, true);
    view.setFloat32(20, data.magnitude, true);
    
    return new Uint8Array(buffer);
  }

  private serializeProcessedData(data: any): Uint8Array {
    // 처리된 데이터는 JSON을 압축하여 저장
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonString);
    
    // 길이 정보 + 데이터
    const buffer = new ArrayBuffer(4 + jsonBytes.length);
    const view = new DataView(buffer);
    
    view.setUint32(0, jsonBytes.length, true);
    new Uint8Array(buffer, 4).set(jsonBytes);
    
    return new Uint8Array(buffer);
  }

  async finalize(): Promise<void> {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
  }

  getEstimatedSize(): number {
    return this.bytesWritten;
  }
}

/**
 * 다중 형식 Writer 관리자
 * 여러 형식을 동시에 저장할 수 있도록 관리
 */
export class MultiFormatWriter {
  private writers: Map<string, DataWriter> = new Map();
  private fileHandles: Map<string, FileSystemWritableFileStream> = new Map();
  private sessionPath: string = '';

  constructor(sessionPath: string) {
    this.sessionPath = sessionPath;
  }

  async initializeWriters(formats: string[], dataType: 'eeg' | 'ppg' | 'acc' | 'processed'): Promise<void> {
    for (const format of formats) {
      let writer: DataWriter;
      let filename: string;

      switch (format) {
        case 'json':
          writer = new JSONLinesWriter();
          filename = `${dataType}_data.jsonl`;
          break;
        case 'csv':
          writer = new CSVWriter();
          filename = `${dataType}_data.csv`;
          break;
        case 'binary':
          writer = new BinaryWriter(dataType);
          filename = `${dataType}_data.bin`;
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // 파일 핸들 생성 (실제 구현에서는 세션 디렉토리에 생성)
      const fileHandle = await this.createFileHandle(filename);
      await writer.initialize(fileHandle);

      this.writers.set(format, writer);
      this.fileHandles.set(format, fileHandle);
    }
  }

  private async createFileHandle(filename: string): Promise<FileSystemWritableFileStream> {
    // 실제 구현에서는 세션 디렉토리에 파일 생성
    // 현재는 더미 구현
    return {} as FileSystemWritableFileStream;
  }

  async writeToAllFormats(data: any[]): Promise<void> {
    const writePromises = Array.from(this.writers.entries()).map(
      ([format, writer]) => writer.writeChunk(data)
    );

    await Promise.all(writePromises);
  }

  async finalizeAllWriters(): Promise<void> {
    const finalizePromises = Array.from(this.writers.values()).map(
      writer => writer.finalize()
    );

    await Promise.all(finalizePromises);
    
    // 정리
    this.writers.clear();
    this.fileHandles.clear();
  }

  getEstimatedSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    
    for (const [format, writer] of this.writers.entries()) {
      sizes[format] = writer.getEstimatedSize();
    }
    
    return sizes;
  }

  getTotalSize(): number {
    return Array.from(this.writers.values())
      .reduce((total, writer) => total + writer.getEstimatedSize(), 0);
  }
} 