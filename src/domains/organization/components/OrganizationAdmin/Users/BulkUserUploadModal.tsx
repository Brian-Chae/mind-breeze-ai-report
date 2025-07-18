import React, { useState, useRef } from 'react'
import { 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  X, 
  FileText, 
  Users, 
  Loader2, 
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import measurementUserManagementService, { 
  BulkCreateResult, 
  CSVValidationResult 
} from '@domains/individual/services/MeasurementUserManagementService'

interface BulkUserUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BulkCreateResult) => void;
}

export default function BulkUserUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: BulkUserUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'result'>('upload')
  const [csvData, setCsvData] = useState<string>('')
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null)
  const [uploadResult, setUploadResult] = useState<BulkCreateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모달이 닫힐 때 상태 초기화
  const handleClose = () => {
    setStep('upload')
    setCsvData('')
    setValidationResult(null)
    setUploadResult(null)
    setLoading(false)
    setError(null)
    onClose()
  }

  // CSV 템플릿 다운로드
  const handleDownloadTemplate = () => {
    const template = measurementUserManagementService.generateCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'measurement_users_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvData(content)
        handleValidateCSV(content)
      }
      reader.readAsText(file, 'utf-8')
    }
  }

  // CSV 데이터 검증
  const handleValidateCSV = async (data: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await measurementUserManagementService.validateCSVData(data)
      setValidationResult(result)
      
      if (result.isValid) {
        setStep('preview')
      } else {
        setStep('preview') // 에러가 있어도 미리보기에서 확인할 수 있도록
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 대량 등록 실행
  const handleBulkUpload = async () => {
    if (!csvData) return

    try {
      setLoading(true)
      setError(null)
      setStep('processing')

      const result = await measurementUserManagementService.bulkCreateMeasurementUsers(csvData)
      setUploadResult(result)
      setStep('result')

      if (result.success) {
        onSuccess(result)
      }
    } catch (err) {
      setError((err as Error).message)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  // 다시 시작
  const handleRestart = () => {
    setStep('upload')
    setCsvData('')
    setValidationResult(null)
    setUploadResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">사용자 대량 등록</h2>
              <p className="text-sm text-gray-600">CSV 파일을 이용해 여러 사용자를 한 번에 등록하세요</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 단계 표시 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600' : step === 'preview' || step === 'processing' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'upload' ? 'bg-blue-100 text-blue-600' : step === 'preview' || step === 'processing' || step === 'result' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                1
              </div>
              <span className="text-sm font-medium">파일 업로드</span>
            </div>
            
            <div className={`w-12 h-px ${step === 'preview' || step === 'processing' || step === 'result' ? 'bg-green-200' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : step === 'processing' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'preview' ? 'bg-blue-100 text-blue-600' : step === 'processing' || step === 'result' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
              <span className="text-sm font-medium">데이터 검토</span>
            </div>
            
            <div className={`w-12 h-px ${step === 'processing' || step === 'result' ? 'bg-green-200' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-blue-600' : step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'processing' ? 'bg-blue-100 text-blue-600' : step === 'result' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                3
              </div>
              <span className="text-sm font-medium">등록 처리</span>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 에러 표시 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">오류 발생</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* 1단계: 파일 업로드 */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* 템플릿 다운로드 */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl flex-shrink-0">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">1. 먼저 템플릿을 다운로드하세요</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      올바른 형식의 CSV 템플릿을 다운로드하여 사용자 정보를 입력하세요.
                    </p>
                    <Button 
                      onClick={handleDownloadTemplate}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      템플릿 다운로드
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 파일 업로드 */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">2. CSV 파일을 업로드하세요</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    작성된 CSV 파일을 선택하여 사용자 데이터를 업로드하세요.
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        파일 처리 중...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        CSV 파일 선택
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* 파일 형식 안내 */}
              <Card className="p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-2">CSV 파일 형식 안내</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>필수 컬럼:</strong> displayName, email, phone</p>
                  <p><strong>선택 컬럼:</strong> age, gender, notes, nextScheduledDate</p>
                  <p><strong>성별 형식:</strong> MALE, FEMALE, OTHER</p>
                  <p><strong>날짜 형식:</strong> YYYY-MM-DD (예: 2024-02-01)</p>
                </div>
              </Card>
            </div>
          )}

          {/* 2단계: 데이터 미리보기 */}
          {step === 'preview' && validationResult && (
            <div className="space-y-6">
              {/* 검증 결과 요약 */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{validationResult.totalRows}</p>
                      <p className="text-sm text-gray-600">총 행 수</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{validationResult.validRows.length}</p>
                      <p className="text-sm text-gray-600">유효한 행</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{validationResult.errors.length}</p>
                      <p className="text-sm text-gray-600">오류 행</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 오류 목록 */}
              {validationResult.errors.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    오류 목록 ({validationResult.errors.length}개)
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                        <span className="font-medium">행 {error.row}</span>
                        {error.field && <span className="text-red-600"> - {error.field}</span>}
                        : {error.message}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 유효한 데이터 미리보기 */}
              {validationResult.validRows.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    유효한 데이터 미리보기 ({validationResult.validRows.length}개)
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left">행</th>
                          <th className="px-2 py-1 text-left">이름</th>
                          <th className="px-2 py-1 text-left">이메일</th>
                          <th className="px-2 py-1 text-left">전화번호</th>
                          <th className="px-2 py-1 text-left">나이</th>
                          <th className="px-2 py-1 text-left">성별</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {validationResult.validRows.slice(0, 10).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 py-1">{row.row}</td>
                            <td className="px-2 py-1">{row.displayName}</td>
                            <td className="px-2 py-1">{row.email}</td>
                            <td className="px-2 py-1">{row.phone}</td>
                            <td className="px-2 py-1">{row.age || '-'}</td>
                            <td className="px-2 py-1">{row.gender || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validationResult.validRows.length > 10 && (
                      <p className="text-center text-gray-500 text-xs mt-2">
                        ... 외 {validationResult.validRows.length - 10}개 더
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* 3단계: 처리 중 */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">사용자 등록 중...</h3>
              <p className="text-sm text-gray-600">잠시만 기다려주세요. 등록 작업이 진행중입니다.</p>
            </div>
          )}

          {/* 4단계: 결과 */}
          {step === 'result' && uploadResult && (
            <div className="space-y-6">
              {/* 결과 요약 */}
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${uploadResult.success ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {uploadResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {uploadResult.success ? '등록 완료!' : '부분 완료'}
                </h3>
                <p className="text-sm text-gray-600">
                  총 {uploadResult.totalRows}개 중 {uploadResult.successfulRows.length}개 성공, {uploadResult.failedRows.length}개 실패
                </p>
              </div>

              {/* 결과 상세 */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">성공한 등록</h4>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.successfulRows.length}개</p>
                </Card>
                
                <Card className="p-4 bg-red-50 border-red-200">
                  <h4 className="text-sm font-medium text-red-900 mb-2">실패한 등록</h4>
                  <p className="text-2xl font-bold text-red-600">{uploadResult.failedRows.length}개</p>
                </Card>
              </div>

              {/* 실패 목록 */}
              {uploadResult.failedRows.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-3">실패 상세</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {uploadResult.failedRows.map((failed, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                        <span className="font-medium">행 {failed.row}</span>: {failed.error}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {step !== 'upload' && (
              <Button
                onClick={handleRestart}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시작
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={handleClose} variant="outline">
              {step === 'result' ? '닫기' : '취소'}
            </Button>
            
                         {step === 'preview' && validationResult && validationResult.validRows.length > 0 && (
               <Button
                 onClick={handleBulkUpload}
                 disabled={loading || validationResult.validRows.length === 0}
                 className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                 {loading ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     등록 중...
                   </>
                 ) : (
                   <>
                     <Users className="w-4 h-4 mr-2" />
                     {validationResult.validRows.length}명 등록하기
                   </>
                 )}
               </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  )
} 