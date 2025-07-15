import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Switch } from '@ui/switch'
import { Separator } from '@ui/separator'
import { Bluetooth, Monitor, Volume2, Settings as SettingsIcon, Wifi, Bell, Shield, Palette, Database, Activity, CircleDot, Loader2 } from 'lucide-react'
import { useSensorDataStore } from '../stores/sensorDataStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useStorageStore } from '../stores/storageStore'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { APIKeyManager, APIKeyMetadata, APIKeyTestResult } from '@core/services/APIKeyManager'

export function Settings() {
  const { timezone, setTimezone } = useSettingsStore();

  const {
    config,
    updateConfig,
    requestStorageDirectory,
    isStorageReady,
    storageDirectoryPath,
    changeStorageDirectory,
  } = useStorageStore();

  // 자동 등록 설정 상태
  const [autoRegistrationEnabled, setAutoRegistrationEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRegistrationEnabled');
    return saved ? JSON.parse(saved) : true;
  })

  // 자동 연결 설정 상태
  const [autoConnectionEnabled, setAutoConnectionEnabled] = useState(() => {
    const saved = localStorage.getItem('autoConnectionEnabled');
    return saved ? JSON.parse(saved) : true;
  })

  // API 키 관리 상태
  const [apiKeys, setApiKeys] = useState<APIKeyMetadata[]>([]);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [showGeminiKeyInput, setShowGeminiKeyInput] = useState(false);
  const [isValidGeminiKey, setIsValidGeminiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<APIKeyTestResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // 자동 등록 설정 저장
  useEffect(() => {
    localStorage.setItem('autoRegistrationEnabled', JSON.stringify(autoRegistrationEnabled));
  }, [autoRegistrationEnabled])

  // 자동 연결 설정 저장
  useEffect(() => {
    localStorage.setItem('autoConnectionEnabled', JSON.stringify(autoConnectionEnabled));
  }, [autoConnectionEnabled])

  // API 키 목록 로드
  useEffect(() => {
    loadAPIKeys();
  }, []);

  // Gemini API 키 유효성 검증
  useEffect(() => {
    setIsValidGeminiKey(APIKeyManager.validateGeminiAPIKey(newGeminiKey));
    setTestResult(null);
    setSaveMessage(null);
  }, [newGeminiKey]);

  const loadAPIKeys = () => {
    const keys = APIKeyManager.getAPIKeyMetadata();
    setApiKeys(keys);
  };

  const handleSaveGeminiKey = async () => {
    if (!isValidGeminiKey) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const result = await APIKeyManager.saveAPIKey('gemini-api', newGeminiKey, {
        name: 'Google Gemini API',
        service: 'gemini'
      }, true); // 테스트 후 저장
      
      setTestResult(result);
      
      if (result.isValid) {
        setNewGeminiKey('');
        setShowGeminiKeyInput(false);
        loadAPIKeys();
        setSaveMessage({
          type: 'success',
          message: `Gemini API 키가 성공적으로 저장되었습니다. (응답시간: ${result.responseTime}ms)`
        });
      } else {
        setSaveMessage({
          type: 'error',
          message: `API 키 테스트 실패: ${result.error}`
        });
      }
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      setSaveMessage({
        type: 'error',
        message: '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    if (!confirm('정말로 이 API 키를 삭제하시겠습니까?')) return;
    
    try {
      await APIKeyManager.deleteAPIKey(keyId);
      loadAPIKeys();
      setSaveMessage({
        type: 'success',
        message: 'API 키가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      setSaveMessage({
        type: 'error',
        message: 'API 키 삭제에 실패했습니다.'
      });
    }
  };

  const handleStorageDirectorySelect = async () => {
    try {
      if (storageDirectoryPath) {
        // 기존 저장소가 있는 경우 변경
        await changeStorageDirectory();
      } else {
        // 처음 설정하는 경우
        await requestStorageDirectory();
      }
    } catch (error) {
      console.error('Failed to select storage directory:', error);
    }
  };

  // 메시지 자동 숨김
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">애플리케이션 설정을 관리합니다</p>
          </div>
        </div>

        {/* 저장 메시지 */}
        {saveMessage && (
          <div className={`p-4 rounded-lg border ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{saveMessage.message}</span>
            </div>
          </div>
        )}

        {/* API Keys Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <CardTitle>API Keys Management</CardTitle>
            </div>
            <CardDescription>
              AI Health Report 및 기타 서비스용 API 키 관리
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 보안 안내 */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">🔒 보안 정보</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• API 키는 IndexedDB에 암호화되어 저장됩니다</li>
                  <li>• 브라우저 로컬 환경에서만 사용되며 외부로 전송되지 않습니다</li>
                  <li>• 키 정보는 마스킹되어 표시됩니다</li>
                  <li>• 저장 전 자동으로 API 키 유효성을 테스트합니다</li>
                </ul>
              </div>
            </div>

            {/* 저장된 API 키 목록 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">저장된 API 키</h4>
              {apiKeys.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-gray-300 rounded-lg">
                  저장된 API 키가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-neutral-700 border border-neutral-600 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-gray-300" />
                        <div>
                          <p className="text-sm font-medium text-white">{key.name}</p>
                          <p className="text-xs text-gray-300">
                            {key.maskedKey} • {key.lastUsed ? `마지막 사용: ${new Date(key.lastUsed).toLocaleDateString()}` : '미사용'}
                          </p>
                          {key.isVerified && key.lastTestedAt && (
                            <p className="text-xs text-green-400">
                              ✓ 검증됨 ({new Date(key.lastTestedAt).toLocaleDateString()})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "활성" : "비활성"}
                        </Badge>
                        {key.isVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            검증됨
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAPIKey(key.id)}
                          className="text-red-400 hover:text-red-300 border-red-400 hover:border-red-300"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Gemini API 키 추가 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Google Gemini API 키</h4>
                  <p className="text-xs text-muted-foreground">AI Health Report 기능을 위한 Gemini API 키</p>
                </div>
                {!showGeminiKeyInput && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGeminiKeyInput(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    키 추가
                  </Button>
                )}
              </div>

              {showGeminiKeyInput && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveGeminiKey();
                  }}
                  className="space-y-3 p-4 bg-neutral-700 border border-neutral-600 rounded-lg"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Gemini API 키</label>
                    <Input
                      type="password"
                      value={newGeminiKey}
                      onChange={(e) => setNewGeminiKey(e.target.value)}
                      placeholder="AIza로 시작하는 39자리 키를 입력하세요"
                      className={`bg-neutral-800 border-neutral-500 text-white placeholder-gray-400 ${
                        isValidGeminiKey ? 'border-green-500' : 
                        newGeminiKey ? 'border-red-500' : ''
                      }`}
                      disabled={isSaving}
                      autoComplete="off"
                    />
                    {newGeminiKey && !isValidGeminiKey && (
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <Shield className="w-3 h-3" />
                        올바른 Gemini API 키 형식이 아닙니다 (AIza로 시작하는 39자리)
                      </div>
                    )}
                    {isValidGeminiKey && !isSaving && (
                      <div className="flex items-center gap-2 text-green-400 text-xs">
                        <Shield className="w-3 h-3" />
                        유효한 API 키 형식입니다
                      </div>
                    )}
                    {isSaving && (
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        API 키를 테스트하고 저장하는 중...
                      </div>
                    )}
                    {testResult && !testResult.isValid && (
                      <div className="flex items-start gap-2 text-red-400 text-xs">
                        <Shield className="w-3 h-3 mt-0.5" />
                        <div>
                          <p className="font-medium">테스트 실패</p>
                          <p>{testResult.error}</p>
                          {testResult.responseTime && (
                            <p>응답시간: {testResult.responseTime}ms</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!isValidGeminiKey || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          테스트 중...
                        </>
                      ) : (
                        '테스트 후 저장'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowGeminiKeyInput(false);
                        setNewGeminiKey('');
                        setTestResult(null);
                        setSaveMessage(null);
                      }}
                      disabled={isSaving}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 API 키 관리 안내:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Gemini API:</strong> Google AI Studio에서 발급받은 API 키를 사용합니다</li>
                <li>• <strong>자동 테스트:</strong> 저장 전 API 키 유효성을 자동으로 검증합니다</li>
                <li>• <strong>보안:</strong> 모든 키는 브라우저 로컬 환경에서만 저장되고 사용됩니다</li>
                <li>• <strong>사용량:</strong> API 사용량은 Google AI Studio에서 확인할 수 있습니다</li>
                <li>• <strong>요금:</strong> Gemini API 사용 요금은 Google 정책에 따라 부과됩니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Device Manager Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bluetooth className="w-5 h-5 text-blue-600" />
              <CardTitle>Device Manager</CardTitle>
            </div>
            <CardDescription>
              디바이스 연결 및 관리 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">자동 연결 기능</h4>
                <p className="text-sm text-muted-foreground">
                  스캔된 디바이스를 자동으로 연결합니다.
                </p>
              </div>
              <Switch
                checked={autoConnectionEnabled}
                onCheckedChange={setAutoConnectionEnabled}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">자동 등록 기능</h4>
                <p className="text-sm text-muted-foreground">
                  디바이스 연결 시 자동으로 등록하여 다음 연결을 더 빠르게 합니다.
                </p>
              </div>
              <Switch
                checked={autoRegistrationEnabled}
                onCheckedChange={setAutoRegistrationEnabled}
              />
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 디바이스 관리 기능 안내:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>자동 연결:</strong> 스캔된 디바이스를 자동으로 연결합니다</li>
                <li>• <strong>자동 등록:</strong> 연결된 디바이스를 자동으로 등록하여 다음 연결을 빠르게 합니다</li>
                <li>• 두 기능 모두 비활성화하면 완전 수동 모드로 작동합니다</li>
                <li>• 이미 등록된 디바이스는 중복 등록되지 않습니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Time Zone Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <CardTitle>Time Zone</CardTitle>
            </div>
            <CardDescription>
              시간 표시 기준 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                시간 표시 기준
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value as 'system' | 'korea' | 'utc')}
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="system">시스템 시간대</option>
                <option value="korea">한국 시간 (KST/GMT+9)</option>
                <option value="utc">국제 표준시 (UTC)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                세션 시작/종료 시간과 모든 시간 표시에 적용됩니다
              </p>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 시간대 설정 안내:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>시스템 시간대:</strong> 현재 컴퓨터의 시간대를 사용합니다</li>
                <li>• <strong>한국 시간:</strong> 항상 한국 시간(KST, UTC+9)으로 표시합니다</li>
                <li>• <strong>국제 표준시:</strong> UTC 시간으로 표시합니다</li>
                <li>• 설정 변경 후 새로 시작하는 세션부터 적용됩니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Visualizer Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>Visualizer</CardTitle>
            </div>
            <CardDescription>
              데이터 시각화 설정
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-4">
              시각화 설정은 준비 중입니다.
            </div>
          </CardContent>
        </Card>

        {/* Data Center Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              <CardTitle>Data Center</CardTitle>
            </div>
            <CardDescription>
              데이터 저장 및 관리 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 저장소 경로 설정 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">저장소 경로</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={storageDirectoryPath || '저장소를 선택해주세요'} 
                  readOnly 
                  className="flex-1 px-3 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-md"
                  placeholder="저장소를 선택해주세요"
                />
                <Button variant="outline" onClick={handleStorageDirectorySelect}>
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
              {storageDirectoryPath && (
                <p className="text-xs text-muted-foreground">
                  저장소를 변경하면 모든 설정이 초기화됩니다.
                </p>
              )}
            </div>

            {/* 저장할 데이터 포맷 기본값 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                저장할 데이터 포맷 기본값
              </label>
              <select
                value={config.defaultFormat}
                onChange={(e) => updateConfig({ defaultFormat: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="jsonl">JSON Lines (.jsonl)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="binary">Binary (.bin)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                새로운 녹화 세션에 사용할 기본 포맷
              </p>
            </div>

            {/* 저장할 데이터 타입 기본값 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                저장할 데이터 타입 기본값
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'eegRaw' as const, label: 'EEG Raw' },
                  { key: 'ppgRaw' as const, label: 'PPG Raw' },
                  { key: 'accRaw' as const, label: 'ACC Raw' },
                  { key: 'eegAnalysisMetrics' as const, label: 'EEG Analysis Metrics' },
                  { key: 'ppgAnalysisMetrics' as const, label: 'PPG Analysis Metrics' },
                  { key: 'accAnalysisMetrics' as const, label: 'ACC Analysis Metrics' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.defaultSaveOptions?.[key] || false}
                      onChange={(e) => updateConfig({
                        defaultSaveOptions: {
                          ...config.defaultSaveOptions,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                새로운 녹화 세션에서 기본적으로 저장할 데이터 타입
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
} 