import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  FolderOpen, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  HardDrive,
  Shield,
  Zap,
  Monitor,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { detectOS, getRecommendedStoragePaths, getOSDisplayName } from '../../utils/pathUtils';

interface StorageSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageSetupModal({ open, onOpenChange }: StorageSetupModalProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [setupStep, setSetupStep] = useState<'intro' | 'selecting' | 'success'>('intro');
  
  const { 
    selectStorageDirectory,
    storageDirectoryPath,
    isInitialized: storageInitialized 
  } = useStorageStore();

  const handleSelectStorage = async () => {
    setIsSelecting(true);
    setSetupStep('selecting');
    
    try {
      const success = await selectStorageDirectory();
      if (success) {
        setSetupStep('success');
        // 2초 후 모달 닫기
        setTimeout(() => {
          onOpenChange(false);
          setSetupStep('intro');
        }, 2000);
      } else {
        setSetupStep('intro');
      }
    } catch (error) {
      console.error('Storage selection failed:', error);
      setSetupStep('intro');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSkip = () => {
    // 스킵은 허용하지 않음 - 저장소 선택이 필수
    alert('데이터 센터를 사용하려면 저장소 디렉토리 선택이 필요합니다.');
  };

  const handleClose = () => {
    // 저장소 설정이 필수임을 알리고 닫기 허용
    const shouldClose = confirm(
      '저장소 설정을 완료하지 않으면 데이터 센터를 사용할 수 없습니다.\n' +
      '정말로 닫으시겠습니까?'
    );
    
    if (shouldClose) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[800px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            저장소 설정
          </DialogTitle>
          <DialogDescription>
            데이터 센터를 사용하기 위해 저장소 디렉토리를 선택해주세요
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {setupStep === 'intro' && (
            <>
              {/* 스크롤 가능한 콘텐츠 영역 */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* 소개 섹션 */}
                <Card className="border-blue-200 bg-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      로컬 저장소 설정
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Link-Band SDK는 모든 데이터를 사용자의 로컬 컴퓨터에 안전하게 저장합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-sm">완전한 개인정보 보호</h4>
                          <p className="text-xs text-muted-foreground">
                            모든 데이터가 사용자 기기에만 저장됩니다
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <HardDrive className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-sm">사용자 제어</h4>
                          <p className="text-xs text-muted-foreground">
                            저장 위치를 직접 선택하고 관리할 수 있습니다
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Zap className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-sm">오프라인 우선</h4>
                          <p className="text-xs text-muted-foreground">
                            인터넷 연결 없이도 모든 기능 사용 가능
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              {/* 플랫폼별 추천 경로 */}
              <Card className="bg-neutral-700">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const os = detectOS();
                      switch (os) {
                        case 'windows':
                          return <><Monitor className="w-5 h-5 text-blue-500" />{getOSDisplayName()} 추천 경로</>;
                        case 'macos':
                          return <><Laptop className="w-5 h-5 text-gray-400" />{getOSDisplayName()} 추천 경로</>;
                        case 'linux':
                          return <><Monitor className="w-5 h-5 text-orange-500" />{getOSDisplayName()} 추천 경로</>;
                        case 'android':
                          return <><Smartphone className="w-5 h-5 text-green-500" />{getOSDisplayName()} 추천 경로</>;
                        default:
                          return <><FolderOpen className="w-5 h-5 text-gray-500" />추천 경로</>;
                      }
                    })()}
                  </CardTitle>
                  <CardDescription>
                    현재 운영체제에 적합한 저장소 위치를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getRecommendedStoragePaths().map((path, index) => (
                      <div key={index} className="bg-neutral-800 text-blue-300 p-3 rounded-lg font-mono text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    💡 <strong>팁:</strong> "[사용자명]" 부분을 실제 사용자 이름으로 바꿔서 해당 위치에 폴더를 만들어 선택하세요.
                  </div>
                </CardContent>
              </Card>

              {/* 저장소 구조 설명 */}
              <Card className="bg-neutral-700">
                <CardHeader>
                  <CardTitle className="text-base">저장소 구조</CardTitle>
                  <CardDescription>
                    선택한 폴더에 다음과 같은 구조로 데이터가 저장됩니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-neutral-800 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <div>📁 LinkBand-Data/</div>
                    <div className="ml-4">📁 config/ <span className="text-gray-400"># 설정 파일</span></div>
                    <div className="ml-4">📁 sessions/ <span className="text-gray-400"># 세션 데이터</span></div>
                    <div className="ml-8">📁 2024/01/ <span className="text-gray-400"># 날짜별 분류</span></div>
                    <div className="ml-4">📁 exports/ <span className="text-gray-400"># 내보내기 파일</span></div>
                    <div className="ml-4">📁 backups/ <span className="text-gray-400"># 백업 파일</span></div>
                  </div>
                </CardContent>
              </Card>

                {/* 주의사항 */}
                <Card className="border-yellow-200 bg-neutral-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-sm text-yellow-300">권장사항</h4>
                        <ul className="text-xs text-yellow-200 mt-2 space-y-1">
                          <li>• 충분한 여유 공간이 있는 폴더를 선택하세요 (최소 1GB 권장)</li>
                          <li>• 정기적으로 백업되는 위치를 선택하는 것이 좋습니다</li>
                          <li>• 네트워크 드라이브보다는 로컬 드라이브를 권장합니다</li>
                          {(() => {
                            const os = detectOS();
                            switch (os) {
                              case 'windows':
                                return (
                                  <>
                                    <li>• C: 드라이브 또는 별도의 데이터 드라이브(D:, E: 등)를 사용하세요</li>
                                    <li>• OneDrive나 Google Drive 동기화 폴더는 피하세요</li>
                                  </>
                                );
                              case 'macos':
                                return (
                                  <>
                                    <li>• iCloud Drive 동기화 폴더는 피하세요</li>
                                    <li>• 외장 드라이브 사용 시 macOS 권한 설정을 확인하세요</li>
                                  </>
                                );
                              case 'linux':
                                return (
                                  <>
                                    <li>• 홈 디렉토리 또는 별도 마운트된 드라이브를 사용하세요</li>
                                    <li>• 쓰기 권한이 있는 위치인지 확인하세요</li>
                                  </>
                                );
                              case 'android':
                                return (
                                  <>
                                    <li>• 내부 저장소 또는 SD카드를 사용할 수 있습니다</li>
                                    <li>• 앱 권한에서 저장소 접근을 허용해야 합니다</li>
                                  </>
                                );
                              default:
                                return null;
                            }
                          })()}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-between flex-shrink-0 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  나중에 설정
                </Button>
                <Button 
                  onClick={handleSelectStorage}
                  disabled={isSelecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {isSelecting ? '선택 중...' : '저장소 폴더 선택'}
                </Button>
              </div>
            </>
          )}

          {setupStep === 'selecting' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">폴더 선택 중...</h3>
                <p className="text-muted-foreground">
                  브라우저의 폴더 선택 다이얼로그에서 저장소로 사용할 폴더를 선택해주세요.
                </p>
              </div>
            </div>
          )}

          {setupStep === 'success' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">저장소 설정 완료!</h3>
                <p className="text-muted-foreground mb-4">
                  저장소가 성공적으로 설정되었습니다.
                </p>
                <div className="bg-neutral-700 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-300 font-mono">
                    {storageDirectoryPath}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  잠시 후 데이터 센터로 이동합니다...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 