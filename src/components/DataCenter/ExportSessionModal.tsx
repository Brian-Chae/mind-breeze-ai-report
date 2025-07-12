import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Download, 
  FileText, 
  Database, 
  Archive, 
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Package
} from 'lucide-react';
import { SessionInfo } from '../../stores/storageStore';

interface ExportSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo | null;
  onExport: (sessionId: string, format: string, dirHandle?: FileSystemDirectoryHandle) => Promise<void>;
}

type ExportFormat = 'zip' | 'csv' | 'json' | 'jsonl' | 'binary' | 'all';
type ExportStep = 'format' | 'location' | 'progress' | 'success' | 'error';

interface ExportOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  fileExtension: string;
  estimatedSize: string;
  recommended?: boolean;
}

export function ExportSessionModal({ open, onOpenChange, session, onExport }: ExportSessionModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('zip');
  const [currentStep, setCurrentStep] = useState<ExportStep>('format');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const exportOptions: ExportOption[] = [
    {
      id: 'zip',
      name: '전체 세션 (폴더)',
      description: '모든 파일과 메타데이터를 폴더 형태로 내보내기',
      icon: <Package className="w-5 h-5" />,
      fileExtension: 'folder',
      estimatedSize: session?.size || '0 B',
      recommended: true
    },
    {
      id: 'csv',
      name: 'CSV 파일만',
      description: '스프레드시트에서 열 수 있는 CSV 형식',
      icon: <FileText className="w-5 h-5" />,
      fileExtension: '.csv',
      estimatedSize: '~50% 압축'
    },
    {
      id: 'json',
      name: 'JSON 파일만',
      description: '구조화된 JSON 형식',
      icon: <Database className="w-5 h-5" />,
      fileExtension: '.json',
      estimatedSize: '~70% 원본'
    },
    {
      id: 'jsonl',
      name: 'JSON Lines 파일만',
      description: '스트리밍에 최적화된 JSONL 형식',
      icon: <File className="w-5 h-5" />,
      fileExtension: '.jsonl',
      estimatedSize: '~65% 원본'
    },
    {
      id: 'binary',
      name: 'Binary 파일만',
      description: '가장 압축된 바이너리 형식',
      icon: <Archive className="w-5 h-5" />,
      fileExtension: '.bin',
      estimatedSize: '~30% 압축'
    },
    {
      id: 'all',
      name: '모든 파일 (개별)',
      description: '모든 형식의 파일을 개별적으로 내보내기',
      icon: <Download className="w-5 h-5" />,
      fileExtension: 'multiple',
      estimatedSize: session?.size || '0 B'
    }
  ];

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format);
  };

  const handleStartExport = async () => {
    if (!session) return;

    setCurrentStep('location');
    
    try {
      // 사용자에게 저장 위치 선택 요청 (기본 폴더 제한 없음)
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      setCurrentStep('progress');
      setProgress(0);

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // 실제 내보내기 실행 (디렉토리 핸들 전달)
      await onExport(session.id, selectedFormat, dirHandle);

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setCurrentStep('success');
      }, 500);

    } catch (error) {
      console.error('내보내기 실패:', error);
      setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      setCurrentStep('error');
    }
  };

  const handleClose = () => {
    // 상태 초기화를 지연시켜 부드러운 전환 보장
    setTimeout(() => {
      setCurrentStep('format');
      setProgress(0);
      setErrorMessage('');
      setSelectedFormat('zip');
    }, 200);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setCurrentStep('format');
    setProgress(0);
    setErrorMessage('');
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[800px] bg-neutral-700 text-white flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Download className="w-5 h-5" />
            세션 내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* 세션 정보 */}
          <Card className="bg-neutral-600 border-neutral-500 flex-shrink-0">
            <CardContent className="pt-3 pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm">{session.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-300 mt-1">
                    <span>📅 {session.date}</span>
                    <span>⏰ {session.time}</span>
                    <span>⏱️ {session.duration}</span>
                    <span>📱 {session.deviceName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-300">파일 크기</div>
                  <div className="font-medium text-white text-sm">{session.size}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {session.formats.map(format => (
                  <Badge key={format} variant="secondary" className="text-xs px-2 py-0">
                    {format}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 단계별 콘텐츠 */}
          {currentStep === 'format' && (
            <>
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-lg font-medium mb-3 text-white flex-shrink-0">내보내기 형식 선택</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {exportOptions.map((option) => (
                    <Card 
                      key={option.id}
                      className={`cursor-pointer transition-all hover:shadow-md border-neutral-500 ${
                        selectedFormat === option.id 
                          ? 'ring-2 ring-blue-500 bg-blue-900 border-blue-500' 
                          : 'bg-neutral-600 hover:bg-neutral-550'
                      }`}
                      onClick={() => handleFormatSelect(option.id)}
                    >
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            selectedFormat === option.id 
                              ? 'bg-blue-800 text-blue-300' 
                              : 'bg-neutral-500 text-neutral-300'
                          }`}>
                            {option.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white text-sm">{option.name}</h4>
                              {option.recommended && (
                                <Badge variant="default" className="text-xs bg-green-600 text-green-100 px-1.5 py-0">
                                  권장
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-300 mt-0.5">{option.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                              <span>📁 {option.fileExtension}</span>
                              <span>📊 {option.estimatedSize}</span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            selectedFormat === option.id 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-neutral-400'
                          }`}>
                            {selectedFormat === option.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 flex-shrink-0 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  취소
                </Button>
                <Button onClick={handleStartExport}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  저장 위치 선택
                </Button>
              </div>
            </>
          )}

          {currentStep === 'location' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-white">저장 위치 선택 중...</h3>
                <p className="text-neutral-300">
                  브라우저에서 파일을 저장할 폴더를 선택해주세요.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'progress' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium mb-2 text-white">내보내기 진행 중...</h3>
                  <p className="text-neutral-300 text-sm">
                    {selectedFormat === 'zip' ? '폴더를 생성하고 파일을 복사하고 있습니다.' :
                     selectedFormat === 'all' ? '모든 파일을 개별적으로 내보내고 있습니다.' :
                     `${selectedFormat.toUpperCase()} 파일을 내보내고 있습니다.`}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>진행률</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-white">내보내기 완료!</h3>
                <p className="text-neutral-300 mb-6">
                  세션 데이터가 성공적으로 내보내졌습니다.
                </p>
                <Button 
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  완료
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'error' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-white">내보내기 실패</h3>
                <p className="text-neutral-300 mb-6">
                  {errorMessage}
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    취소
                  </Button>
                  <Button onClick={handleRetry}>
                    다시 시도
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 