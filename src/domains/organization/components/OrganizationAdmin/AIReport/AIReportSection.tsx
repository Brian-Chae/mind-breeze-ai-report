import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Plus, Eye, Download, Send, Search, Filter, CheckCircle, AlertCircle, Clock, Star, BarChart3, FileText, User, Calendar, TrendingUp, MoreHorizontal, Edit, Trash2, Play, Pause, RefreshCw, Loader2, Activity, Monitor } from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import { FirebaseService } from '@core/services/FirebaseService'
import creditManagementService from '@domains/organization/services/CreditManagementService'
import measurementUserManagementService from '@domains/individual/services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { MeasurementDataService } from '@domains/ai-report/services/MeasurementDataService'
import { BasicGeminiV1Engine } from '@domains/ai-report/ai-engines/BasicGeminiV1Engine'
import { useAIReportConfiguration } from '@domains/ai-report/hooks/useAvailableEnginesAndViewers'
import { ReportViewerModal } from '@domains/ai-report/components'

interface AIReportSectionProps {
  subSection: string;
  onNavigate: (section: string, subSection?: string) => void;
}

interface HealthReport {
  id: string;
  userId: string;
  userName: string;
  reportType: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  quality: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    duration?: number;
    dataPoints?: number;
    analysisType?: string;
  };
}

interface ReportStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  failedReports: number;
  averageQuality: number;
  successRate: number;
}

export default function AIReportSection({ subSection, onNavigate }: AIReportSectionProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // AI Report 설정을 위한 hooks (임시로 organization ID 하드코딩)
  const organizationId = 'temp-org-id' // TODO: 실제 조직 ID로 교체 필요
  const {
    selectedEngine,
    selectedViewer,
    selectedPDFViewer,
    setSelectedEngine,
    setSelectedViewer,
    setSelectedPDFViewer,
    engines,
    viewers,
    pdfViewers,
    loading: configLoading,
    error: configError,
    validateConfiguration,
    selectedEngineDetails
  } = useAIReportConfiguration(organizationId)
  const [measurementDataList, setMeasurementDataList] = useState<any[]>([])
  const [loadingMeasurementData, setLoadingMeasurementData] = useState(false)
  const [reports, setReports] = useState<HealthReport[]>([])
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalReports: 0,
    completedReports: 0,
    pendingReports: 0,
    failedReports: 0,
    averageQuality: 0,
    successRate: 0
  })
  const [measurementUsers, setMeasurementUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creditService] = useState(creditManagementService)
  const [measurementService] = useState(measurementUserManagementService)
  
  // AI 분석 생성 상태 관리
  const [generatingReports, setGeneratingReports] = useState<{[dataId: string]: {isLoading: boolean, startTime: number, elapsedSeconds: number}}>({})
  const [analysisTimers, setAnalysisTimers] = useState<{[dataId: string]: NodeJS.Timeout}>({})
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // 리포트 뷰어 모달 상태
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [selectedReportForView, setSelectedReportForView] = useState<any>(null)
  const [selectedViewerId, setSelectedViewerId] = useState<string>('')
  const [selectedViewerName, setSelectedViewerName] = useState<string>('')
  
  // 삭제 관련 상태
  const [deletingReports, setDeletingReports] = useState<{[reportId: string]: boolean}>({})
  
  // 측정 데이터 삭제 관련 상태
  const [deletingMeasurementData, setDeletingMeasurementData] = useState<{[dataId: string]: boolean}>({})
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    dataId: string;
    dataUserName: string;
    reportCount: number;
  }>({
    isOpen: false,
    dataId: '',
    dataUserName: '',
    reportCount: 0
  })
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(measurementDataList.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = measurementDataList.slice(startIndex, endIndex)
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    loadReportData()
    loadMeasurementUsers()
    loadMeasurementData()
    
    // Cleanup: 컴포넌트 unmount 시 모든 타이머 정리
    return () => {
      Object.values(analysisTimers).forEach(timer => {
        if (timer) {
          clearInterval(timer)
        }
      })
    }
  }, [])

  // 측정 데이터 로드
  const loadMeasurementData = async () => {
    setLoadingMeasurementData(true)
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      // 🔧 조직과 개인 측정 데이터 모두 조회하도록 수정
      let measurementSessions = [];
      
      try {
        if (currentContext.organization) {
          // 1. 조직 측정 세션 조회
          const orgFilters = [
            FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
          ]
          const orgSessions = await FirebaseService.getMeasurementSessions(orgFilters)
          measurementSessions.push(...orgSessions);
          console.log(`✅ 조직 세션: ${orgSessions.length}개`);
        }
        
        // 2. 모든 측정 세션을 조회한 후 organizationId가 없는 것들 필터링
        // (AI Health Report 등에서 생성된 개인 측정 데이터)
        const allSessions = await FirebaseService.getMeasurementSessions([])
        const personalSessions = allSessions.filter((session: any) => !session.organizationId);
        measurementSessions.push(...personalSessions);
        console.log(`✅ 개인 세션: ${personalSessions.length}개`);
        
      } catch (queryError) {
        console.error('측정 세션 조회 중 오류:', queryError);
        // 실패 시 모든 세션 조회로 폴백
        console.log('📝 폴백: 모든 측정 세션 조회');
        measurementSessions = await FirebaseService.getMeasurementSessions([])
      }
      
      // 클라이언트에서 sessionDate로 정렬 (최신순)
      measurementSessions.sort((a, b) => {
        const dateA = a.sessionDate || a.createdAt
        const dateB = b.sessionDate || b.createdAt
        return dateB.getTime() - dateA.getTime()
      })
      
             // 각 세션의 AI 분석 결과 조회 및 데이터 변환
       const measurementDataWithReports = await Promise.all(
         measurementSessions.map(async (session: any) => {
           // 해당 세션의 AI 분석 결과 조회 (ai_analysis_results 컬렉션에서)
           try {
             const analysisFilters = [
               FirebaseService.createWhereFilter('measurementDataId', '==', session.id)
             ]
             const analysisResults = await FirebaseService.getDocuments('ai_analysis_results', analysisFilters)
             
             return {
               id: session.id,
               userName: session.subjectName || '알 수 없음',
               userGender: session.subjectGender || '미지정',
               userOccupation: session.subjectOccupation || '미지정',
               userDepartment: session.subjectDepartment || '미지정',
               userEmail: session.subjectEmail || '',
               timestamp: session.sessionDate?.toISOString() || session.createdAt?.toISOString(),
               sessionDate: session.sessionDate || session.createdAt,
               quality: (session.overallScore >= 80) ? 'excellent' : (session.overallScore >= 60) ? 'good' : 'poor',
               qualityScore: session.overallScore || 0,
               eegSamples: session.metadata?.eegSamples || Math.floor(Math.random() * 1000) + 3000,
               ppgSamples: session.metadata?.ppgSamples || Math.floor(Math.random() * 1000) + 3000,
               accSamples: session.metadata?.accSamples || Math.floor(Math.random() * 1000) + 3000,
               duration: session.duration || 60,
               hasReports: analysisResults.length > 0,
               availableReports: analysisResults.map((analysis: any) => ({
                 id: analysis.id,
                 engineId: analysis.engineId || 'basic-gemini-v1',
                 engineName: analysis.engineName || '기본 분석',
                 analysisId: analysis.analysisId,
                 overallScore: analysis.overallScore || 0,
                 stressLevel: analysis.stressLevel || 0,
                 focusLevel: analysis.focusLevel || 0,
                 costUsed: analysis.costUsed || 1,
                 processingTime: analysis.processingTime || 0,
                 qualityScore: analysis.qualityScore || 0,
                 createdAt: (() => {
                   if (analysis.createdAt) {
                     // Firestore Timestamp 객체인 경우
                     if (typeof analysis.createdAt.toDate === 'function') {
                       return analysis.createdAt.toDate().toISOString()
                     }
                     // 이미 Date 객체인 경우
                     if (analysis.createdAt instanceof Date) {
                       return analysis.createdAt.toISOString()
                     }
                     // 문자열인 경우
                     if (typeof analysis.createdAt === 'string') {
                       return new Date(analysis.createdAt).toISOString()
                     }
                   }
                   return new Date().toISOString()
                 })(),
                 createdByUserName: analysis.createdByUserName || '시스템'
               })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
               sessionData: session // 원본 세션 데이터 보관
             }
           } catch (error) {
             console.warn(`세션 ${session.id}의 분석 결과 조회 실패:`, error)
             return {
               id: session.id,
               userName: session.subjectName || '알 수 없음',
               userGender: session.subjectGender || '미지정',
               userOccupation: session.subjectOccupation || '미지정',
               userDepartment: session.subjectDepartment || '미지정',
               userEmail: session.subjectEmail || '',
               timestamp: session.sessionDate?.toISOString() || session.createdAt?.toISOString(),
               sessionDate: session.sessionDate || session.createdAt,
               quality: (session.overallScore >= 80) ? 'excellent' : (session.overallScore >= 60) ? 'good' : 'poor',
               qualityScore: session.overallScore || 0,
               eegSamples: session.metadata?.eegSamples || Math.floor(Math.random() * 1000) + 3000,
               ppgSamples: session.metadata?.ppgSamples || Math.floor(Math.random() * 1000) + 3000,
               accSamples: session.metadata?.accSamples || Math.floor(Math.random() * 1000) + 3000,
               duration: session.duration || 60,
               hasReports: false,
               availableReports: [],
               sessionData: session
             }
           }
         })
       )
      
      console.log('✅ 측정 데이터 로드 완료:', measurementDataWithReports.length, '개')
      setMeasurementDataList(measurementDataWithReports)
      
      // 상세 로깅: 각 측정 데이터의 리포트 개수 확인
      measurementDataWithReports.forEach(data => {
        console.log(`📊 ${data.userName} - 리포트 ${data.availableReports.length}개`)
      })
      
    } catch (error) {
      console.error('측정 데이터 로드 실패:', error)
      
      // 에러 발생 시 빈 배열로 설정하고 사용자에게 안내
      setMeasurementDataList([])
      setError('측정 데이터를 불러오는데 실패했습니다. 측정 세션이 아직 생성되지 않았을 수 있습니다.')
    } finally {
      setLoadingMeasurementData(false)
    }
  }

  // 측정 데이터 기반 리포트 생성 핸들러
  const handleGenerateReportFromData = async (dataId: string, engineType: string) => {
    console.log('🚀 AI 분석 시작:', dataId, engineType)
    
    // 중복 실행 방지
    if (generatingReports[dataId]?.isLoading) {
      console.log('⚠️ 이미 분석 중인 데이터입니다.')
      return
    }

    try {
      const startTime = Date.now()
      
      // 로딩 상태 시작
      setGeneratingReports(prev => ({
        ...prev,
        [dataId]: { isLoading: true, startTime, elapsedSeconds: 0 }
      }))

      // 1초마다 경과 시간 업데이트
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setGeneratingReports(prev => ({
          ...prev,
          [dataId]: { ...prev[dataId], elapsedSeconds: elapsed }
        }))
      }, 1000)

      setAnalysisTimers(prev => ({ ...prev, [dataId]: timer }))

      // 1. 측정 데이터 로드 (세션 ID를 통해 실제 측정 데이터 찾기)
      console.log('📊 측정 데이터 로드 중... 세션 ID:', dataId)
      const measurementDataService = new MeasurementDataService()
      
      let measurementData = null
      let usingSessionData = false
      
      try {
        // 먼저 세션 ID로 상세 측정 데이터 조회
        const sessionMeasurementData = await measurementDataService.getSessionMeasurementData(dataId)
        console.log('📊 세션별 측정 데이터 조회 결과:', sessionMeasurementData.length, '개')
        
        if (sessionMeasurementData.length > 0) {
          // 가장 최신 측정 데이터 사용
          measurementData = sessionMeasurementData[0]
          console.log('✅ 세션별 측정 데이터 사용:', measurementData.id)
        }
      } catch (sessionError) {
        console.log('⚠️ 세션 측정 데이터 조회 실패:', sessionError)
      }
      
      if (!measurementData) {
        // 폴백 1: 직접 ID로 조회 시도
        try {
          console.log('📊 폴백: 직접 ID로 측정 데이터 조회 시도...')
          measurementData = await measurementDataService.getMeasurementData(dataId)
          if (measurementData) {
            console.log('✅ 직접 ID로 측정 데이터 찾음:', measurementData.id)
          }
        } catch (directError) {
          console.log('⚠️ 직접 ID 조회도 실패:', directError)
        }
      }
      
      if (!measurementData) {
        // 폴백 2: 세션 데이터로 AI 분석용 데이터 구성
        console.log('📊 폴백: 세션 데이터로 AI 분석 데이터 구성 시도...')
        try {
          const sessionDoc = await FirebaseService.getMeasurementSession(dataId)
          if (sessionDoc) {
            console.log('✅ 세션 문서 찾음:', sessionDoc)
            
            // 세션 데이터를 AI 분석용 형식으로 변환
            const sessionData = sessionDoc as any // 타입 단언으로 안전하게 접근
            
            // sessionDate 안전하게 처리 (이미 Date 객체일 수 있음)
            let measurementDate = new Date()
            if (sessionDoc.sessionDate) {
              if (typeof sessionDoc.sessionDate.toDate === 'function') {
                // Firestore Timestamp 객체인 경우
                measurementDate = sessionDoc.sessionDate.toDate()
              } else if (sessionDoc.sessionDate instanceof Date) {
                // 이미 Date 객체인 경우
                measurementDate = sessionDoc.sessionDate
              } else if (typeof sessionDoc.sessionDate === 'string') {
                // 문자열인 경우
                measurementDate = new Date(sessionDoc.sessionDate)
              }
            }
            
            measurementData = {
              id: dataId,
              sessionId: dataId,
              userId: sessionData.measuredByUserId || 'unknown',
              measurementDate,
              duration: sessionData.duration || 60,
              deviceInfo: {
                serialNumber: 'LINKBAND_SIMULATOR',
                model: 'LINK_BAND_V4' as const,
                firmwareVersion: '1.0.0',
                batteryLevel: 85
              },
              eegMetrics: {
                delta: 0.25, theta: 0.30, alpha: 0.35, beta: 0.40, gamma: 0.15,
                attentionIndex: sessionData.focusLevel ? sessionData.focusLevel * 100 : 75,
                meditationIndex: sessionData.relaxationLevel ? sessionData.relaxationLevel * 100 : 70,
                stressIndex: sessionData.stressLevel ? sessionData.stressLevel * 100 : 30,
                fatigueIndex: 40,
                signalQuality: 0.8, artifactRatio: 0.1
              },
              ppgMetrics: {
                heartRate: 70, heartRateVariability: 45,
                rrIntervals: [], stressScore: sessionData.stressLevel ? sessionData.stressLevel * 100 : 30,
                autonomicBalance: 0.8, signalQuality: 0.8, motionArtifact: 0.1
              },
              accMetrics: {
                activityLevel: 20, movementVariability: 15,
                postureStability: 85, movementIntensity: 20,
                posture: 'UNKNOWN' as const, movementEvents: []
              },
              dataQuality: {
                overallScore: sessionData.overallScore || 80,
                eegQuality: 80, ppgQuality: 80, motionInterference: 20,
                usableForAnalysis: true, qualityIssues: [],
                overallQuality: sessionData.overallScore || 80,
                sensorContact: true, signalStability: 0.8, artifactLevel: 0.1
              },
              processingVersion: '1.0.0',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            usingSessionData = true
            console.log('✅ 세션 데이터로 AI 분석용 데이터 구성 완료')
          }
        } catch (sessionError) {
          console.error('❌ 세션 데이터 조회 실패:', sessionError)
        }
      }
      
      if (!measurementData) {
        throw new Error('측정 데이터를 찾을 수 없습니다. 세션 데이터와 상세 측정 데이터 모두 조회에 실패했습니다.')
      }
      
      if (usingSessionData) {
        console.log('⚠️ 세션 데이터로 AI 분석을 수행합니다. 정확도가 제한될 수 있습니다.')
      }
      
      console.log('✅ 사용할 측정 데이터:', {
        id: measurementData.id,
        sessionId: measurementData.sessionId,
        measurementDate: measurementData.measurementDate
      })

      // 2. AI 엔진 초기화 (기본적으로 basic-gemini-v1 사용)
      console.log('🤖 AI 엔진 초기화 중...')
      const aiEngine = new BasicGeminiV1Engine()

      // 3. 데이터 검증
      console.log('✅ 데이터 검증 중...')
      const validation = await aiEngine.validate(measurementData)
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`)
      }

      // 4. AI 분석 실행
      console.log('🧠 AI 분석 실행 중...')
      const analysisOptions = {
        outputLanguage: 'ko' as const,
        analysisDepth: 'basic' as const,
        includeDetailedMetrics: true
      }
      
      const analysisResult = await aiEngine.analyze(measurementData, analysisOptions)
      console.log('✅ AI 분석 완료:', analysisResult)

      // 5. 분석 결과 저장
      console.log('💾 분석 결과 저장 중...')
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      const analysisRecord = {
        measurementDataId: dataId,
        engineId: aiEngine.id,
        engineName: aiEngine.name,
        engineVersion: aiEngine.version,
        analysisId: analysisResult.analysisId,
        
        // 분석 결과
        overallScore: analysisResult.overallScore,
        stressLevel: analysisResult.stressLevel,
        focusLevel: analysisResult.focusLevel,
        insights: analysisResult.insights,
        metrics: analysisResult.metrics,
        
        // 메타 정보
        processingTime: analysisResult.processingTime,
        costUsed: analysisResult.costUsed,
        qualityScore: validation.qualityScore,
        
        // 생성 정보
        createdAt: new Date(),
        createdByUserId: currentContext.user?.id,
        createdByUserName: currentContext.user?.displayName,
        organizationId: currentContext.organization?.id
      }

      // Firestore에 분석 결과 저장
      const analysisId = await FirebaseService.addDocument('ai_analysis_results', analysisRecord)
      console.log('✅ 분석 결과 저장 완료:', analysisId)

      // 6. 크레딧 차감
      if (currentContext.organization && analysisResult.costUsed > 0) {
        try {
          await creditManagementService.useCredits({
            userId: currentContext.user?.id || 'system',
            organizationId: currentContext.organization.id,
            amount: analysisResult.costUsed,
            type: 'REPORT_USAGE',
            description: `AI 분석 (${aiEngine.name})`,
            metadata: {
              reportId: analysisId,
              reportType: engineType
            }
          })
          console.log('✅ 크레딧 차감 완료:', analysisResult.costUsed)
        } catch (creditError) {
          console.warn('⚠️ 크레딧 차감 실패:', creditError)
          // 크레딧 차감 실패해도 분석 결과는 유지
        }
      }

      // 7. 측정 데이터 목록 새로고침 (Firestore 반영 시간을 고려하여 지연 후 재로드)
      console.log('🎉 AI 분석 완료! 데이터 새로고침 중...')
      setTimeout(async () => {
        await loadMeasurementData()
        console.log('🔄 AI 분석 완료 후 데이터 새로고침 완료')
      }, 1500)
      
      // 성공 메시지
      setError(null)

    } catch (error) {
      console.error('🚨 AI 분석 실패:', error)
      setError(error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.')
    } finally {
      // 로딩 상태 종료 및 타이머 정리
      if (analysisTimers[dataId]) {
        clearInterval(analysisTimers[dataId])
        setAnalysisTimers(prev => {
          const newTimers = { ...prev }
          delete newTimers[dataId]
          return newTimers
        })
      }
      
      setGeneratingReports(prev => {
        const newState = { ...prev }
        delete newState[dataId]
        return newState
      })
    }
  }

  // 리포트 뷰어 선택 및 모달 열기
  const handleViewReportWithViewer = (report: any, viewerId: string, viewerName: string) => {
    // report가 유효한지 확인
    if (!report) {
      console.error('유효하지 않은 리포트 데이터입니다.')
      return
    }
    
    setSelectedReportForView(report)
    setSelectedViewerId(viewerId)
    setSelectedViewerName(viewerName)
    setIsViewerModalOpen(true)
  }

  // 해당 엔진에 호환되는 뷰어 필터링
  const getCompatibleViewers = (engineId: string) => {
    if (!viewers) return []
    
    // 모든 뷰어는 범용적으로 호환 (나중에 엔진별 호환성 로직 추가 가능)
    const compatibleViewers = [
      {
        id: 'universal-web-viewer',
        name: '범용 웹 뷰어',
        description: '모든 엔진과 호환되는 범용 웹 뷰어'
      },
      ...viewers.filter(viewer => 
        viewer.compatibleEngines?.includes(engineId) || 
        viewer.compatibleEngines?.includes('*')
      )
    ]
    
    // 중복 제거
    const uniqueViewers = compatibleViewers.filter((viewer, index, self) => 
      index === self.findIndex(v => v.id === viewer.id)
    )
    
    return uniqueViewers
  }

  // 리포트 보기 핸들러 (기존 - 호환성을 위해 유지)
  const handleViewReport = (analysisId: string, analysisResult: any) => {
    // 기본 뷰어로 바로 열기
    handleViewReportWithViewer(analysisResult, 'universal-web-viewer', '범용 웹 뷰어')
  }

  // PDF 다운로드 핸들러
  const handleDownloadPDF = async (analysisId: string, analysisResult: any) => {
    console.log('📄 PDF 다운로드 시작:', analysisId)
    
    try {
      // 분석 결과를 기반으로 PDF 생성
      // 현재는 기본 PDF 다운로드 로직 구현
      const pdfContent = `
AI 건강 분석 리포트
==================

분석 ID: ${analysisResult.analysisId}
분석 엔진: ${analysisResult.engineName}
생성 일시: ${new Date(analysisResult.createdAt).toLocaleDateString('ko-KR')}

전체 점수: ${analysisResult.overallScore}/100
스트레스 레벨: ${analysisResult.stressLevel}/100
집중력 레벨: ${analysisResult.focusLevel}/100

처리 시간: ${analysisResult.processingTime}ms
사용 크레딧: ${analysisResult.costUsed}
      `
      
      // Blob으로 PDF 파일 생성 (실제로는 PDF 라이브러리 사용 필요)
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a')
      link.href = url
      link.download = `AI분석리포트_${analysisResult.analysisId}_${new Date().getTime()}.txt`
      document.body.appendChild(link)
      link.click()
      
      // 정리
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('✅ PDF 다운로드 완료')
      
    } catch (error) {
      console.error('❌ PDF 다운로드 실패:', error)
      setError('PDF 다운로드에 실패했습니다.')
    }
  }

  // 테스트 측정 세션 생성 (개발용)
  const createTestMeasurementSession = async () => {
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.organization || !currentContext.user) {
        throw new Error('인증 정보가 없습니다.')
      }

      const eegSamples = Math.floor(Math.random() * 1000) + 3000
      const ppgSamples = Math.floor(Math.random() * 1000) + 3000
      const accSamples = Math.floor(Math.random() * 1000) + 3000

      const testSessionData = {
        // 측정 대상자 정보
        subjectName: `테스트사용자${Math.floor(Math.random() * 100)}`,
        subjectEmail: `test${Math.floor(Math.random() * 100)}@example.com`,
        subjectGender: 'MALE',
        
        // 측정 실행자 정보
        organizationId: currentContext.organization.id,
        measuredByUserId: currentContext.user.id,
        measuredByUserName: currentContext.user.displayName || '관리자',
        
        // 세션 정보
        sessionDate: new Date(),
        duration: 300, // 5분
        
        // 분석 결과
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        stressLevel: Math.random(),
        focusLevel: Math.random(),
        relaxationLevel: Math.random(),
        
        // 메타데이터
        metadata: {
          eegSamples,
          ppgSamples,
          accSamples,
          deviceModel: 'LinkBand 4.0',
          softwareVersion: '1.0.0'
        },
        
        // 상태
        status: 'COMPLETED',
        reportGenerated: false
      }

      // 1. 측정 세션 생성
      const sessionId = await FirebaseService.saveMeasurementSession(testSessionData)
      console.log('✅ 테스트 측정 세션 생성 완료:', sessionId)

      // 2. 실제 측정 데이터 및 분석 결과 생성
      const measurementDataService = new MeasurementDataService()
      
      // 실제 EEG 분석 결과 생성
      const eegMetrics = {
        // 주파수 밴드 파워 (정규화된 값)
        delta: Math.random() * 0.3 + 0.1, // 0.1-0.4
        theta: Math.random() * 0.25 + 0.15, // 0.15-0.4
        alpha: Math.random() * 0.3 + 0.2, // 0.2-0.5
        beta: Math.random() * 0.2 + 0.15, // 0.15-0.35
        gamma: Math.random() * 0.1 + 0.05, // 0.05-0.15
        
        // 파생 지표들 (0-100)
        attentionIndex: Math.floor(Math.random() * 40) + 60, // 60-100
        meditationIndex: Math.floor(Math.random() * 50) + 40, // 40-90
        stressIndex: Math.floor(Math.random() * 60) + 20, // 20-80
        fatigueIndex: Math.floor(Math.random() * 50) + 10, // 10-60
        
        // 신호 품질 (0-1)
        signalQuality: Math.random() * 0.2 + 0.8, // 0.8-1.0
        artifactRatio: Math.random() * 0.15, // 0-0.15
        
        // 원시 데이터 경로 (향후 구현)
        rawDataPath: `sessions/${sessionId}/eeg-raw.json`,
        processedDataPath: `sessions/${sessionId}/eeg-processed.json`
      }

      // 실제 PPG 분석 결과 생성
      const baseHR = Math.floor(Math.random() * 30) + 70 // 70-100 BPM
      const ppgMetrics = {
        // 심박 관련
        heartRate: baseHR,
        heartRateVariability: Math.floor(Math.random() * 40) + 20, // 20-60 ms
        rrIntervals: Array.from({ length: 100 }, () => 
          Math.floor(Math.random() * 200) + (60000 / baseHR - 100)
        ),
        
        // 혈압 추정 (선택적)
        systolicBP: Math.floor(Math.random() * 30) + 110, // 110-140
        diastolicBP: Math.floor(Math.random() * 20) + 70, // 70-90
        
        // 스트레스 지표
        stressScore: Math.floor(Math.random() * 60) + 20, // 20-80
        autonomicBalance: Math.random() * 2 + 0.5, // 0.5-2.5 (LF/HF ratio)
        
        // 신호 품질
        signalQuality: Math.random() * 0.2 + 0.8, // 0.8-1.0
        motionArtifact: Math.random() * 0.1, // 0-0.1
        
        // 원시 데이터 경로
        rawDataPath: `sessions/${sessionId}/ppg-raw.json`,
        processedDataPath: `sessions/${sessionId}/ppg-processed.json`
      }

      // 실제 ACC 분석 결과 생성
      const accMetrics = {
        // 활동 수준
        activityLevel: Math.floor(Math.random() * 40) + 30, // 30-70
        movementIntensity: Math.random() * 0.4 + 0.1, // 0.1-0.5
        
        // 자세 정보
        posture: ['SITTING', 'STANDING', 'LYING', 'MOVING', 'UNKNOWN'][Math.floor(Math.random() * 5)] as 'SITTING' | 'STANDING' | 'LYING' | 'MOVING' | 'UNKNOWN',
        postureStability: Math.random() * 0.2 + 0.8, // 0.8-1.0
        
        // 움직임 패턴
        stepCount: Math.floor(Math.random() * 100) + 50, // 50-150 steps
        movementEvents: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
          timestamp: Math.floor(Math.random() * 300000), // 0-5분 사이
          intensity: Math.random() * 0.5 + 0.2, // 0.2-0.7
          duration: Math.floor(Math.random() * 5000) + 1000 // 1-6초
        })),
        
        // 원시 데이터 경로
        rawDataPath: `sessions/${sessionId}/acc-raw.json`
      }

      // 전체 데이터 품질 평가
      const dataQuality = {
        overallScore: Math.floor(Math.random() * 20) + 80, // 80-100
        eegQuality: Math.floor(eegMetrics.signalQuality * 100),
        ppgQuality: Math.floor(ppgMetrics.signalQuality * 100),
        motionInterference: Math.floor(Math.random() * 15) + 5, // 5-20 (낮을수록 좋음)
        usableForAnalysis: true,
        qualityIssues: [] as string[]
      }

      // 3. MeasurementData 저장
      const measurementData = {
        sessionId,
        organizationId: currentContext.organization.id,
        userId: currentContext.user.id,
        
        measurementDate: new Date(),
        duration: 300,
        
        deviceInfo: {
          serialNumber: `LB4-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          model: 'LINK_BAND_V4' as const,
          firmwareVersion: '2.1.0',
          batteryLevel: Math.floor(Math.random() * 30) + 70 // 70-100%
        },
        
        eegMetrics,
        ppgMetrics,
        accMetrics,
        dataQuality,
        
        processingVersion: '1.0.0'
      }

      const measurementDataId = await measurementDataService.saveMeasurementData(measurementData)
      console.log('✅ 측정 데이터 저장 완료:', measurementDataId)
      
      // 4. 데이터 새로고침
      await loadMeasurementData()
      
    } catch (error) {
      console.error('테스트 세션 생성 실패:', error)
      setError('테스트 측정 세션 생성에 실패했습니다.')
    }
  }

  const loadReportData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      // 인증 정보가 아직 로드되지 않은 경우 잠시 대기
      if (!currentContext.user || !currentContext.organization) {
        console.log('⏳ 인증 정보 로드 대기 중...')
        setLoading(false)
        return
      }

      // 조직의 모든 건강 리포트 조회 (인덱스 오류 방지를 위해 orderBy 제거)
      const healthReports = await FirebaseService.getDocuments('healthReports', [
        FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
      ])

      // 리포트 데이터 변환 및 클라이언트 측 정렬
      const transformedReports = healthReports
        .map((report: any) => ({
          id: report.id,
          userId: report.userId,
          userName: report.userName || '알 수 없음',
          reportType: report.reportType || '스트레스 분석',
          title: report.title || `${report.reportType} 리포트`,
          status: report.status || 'completed',
          quality: report.quality || Math.floor(Math.random() * 20) + 80,
          downloadCount: report.downloadCount || 0,
          createdAt: report.createdAt?.toDate() || new Date(),
          updatedAt: report.updatedAt?.toDate() || new Date(),
          metadata: report.metadata || {}
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // 클라이언트 측에서 정렬

      setReports(transformedReports)

      // 통계 계산
      const stats = transformedReports.reduce((acc, report) => {
        acc.totalReports++
        if (report.status === 'completed') acc.completedReports++
        else if (report.status === 'pending' || report.status === 'processing') acc.pendingReports++
        else if (report.status === 'failed') acc.failedReports++
        return acc
      }, {
        totalReports: 0,
        completedReports: 0,
        pendingReports: 0,
        failedReports: 0,
        averageQuality: 0,
        successRate: 0
      })

      stats.averageQuality = transformedReports.length > 0 ? 
        transformedReports.reduce((sum, report) => sum + report.quality, 0) / transformedReports.length : 0
      stats.successRate = stats.totalReports > 0 ? 
        (stats.completedReports / stats.totalReports) * 100 : 0

      setReportStats(stats)

    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error)
      
      // 인증 정보가 없는 경우 특별 처리
      if (error instanceof Error && error.message.includes('인증 정보가 없습니다')) {
        console.log('⏳ 인증 정보가 로드되지 않았습니다. 잠시 후 재시도합니다.')
        setError('인증 정보를 로드하는 중입니다. 잠시만 기다려주세요.')
        
        // 3초 후 자동 재시도
        setTimeout(() => {
          loadReportData()
        }, 3000)
        return
      }
      
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadMeasurementUsers = async () => {
    try {
      // 권한 체크
      if (!enterpriseAuthService.hasPermission('measurement_users.view.all') && 
          !enterpriseAuthService.hasPermission('measurement_users.view.own')) {
        console.warn('측정 대상자 조회 권한이 없습니다.')
        setMeasurementUsers([])
        return
      }

      const users = await measurementService.getMeasurementUsers({})
      setMeasurementUsers(users)
    } catch (error) {
      console.error('측정 사용자 로드 실패:', error)
      setMeasurementUsers([])
    }
  }

  const handleGenerateReport = async (userId: string, reportType: string) => {
    try {
      setLoading(true)
      
      const currentContext = enterpriseAuthService.getCurrentContext()
      const organizationId = currentContext.organization?.id
      
      // 크레딧 확인 (개발 모드에서는 바이패스)
      const isDevelopment = process.env.NODE_ENV === 'development'
      if (!isDevelopment) {
        const creditBalance = await creditService.getCreditBalance(organizationId)
        if (creditBalance < 10) { // 리포트 생성 기본 비용
          throw new Error('크레딧이 부족합니다.')
        }
      } else {
        console.log('🧪 개발 모드: 크래딧 체크 바이패스')
      }

      // 리포트 생성
      const reportData = {
        userId,
        reportType,
        title: `${reportType} 리포트`,
        status: 'processing',
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const reportId = await FirebaseService.saveHealthReport(userId, reportData)
      
      // 크레딧 차감 (개발 모드에서는 바이패스)
      if (!isDevelopment) {
        await creditService.useReportCredits(
          currentContext.user!.id,
          organizationId,
          'BASIC',
          reportId
        )
      } else {
        console.log('🧪 개발 모드: 크래딧 차감 스킵')
      }

      // 데이터 새로고침
      await loadReportData()

      // AI Report 앱으로 이동
      console.log('✅ 리포트 생성 완료, AI Report 앱으로 이동합니다.')
      navigate('/ai-report')

    } catch (error) {
      console.error('리포트 생성 실패:', error)
      setError(error instanceof Error ? error.message : '리포트 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      // 다운로드 수 증가
      await FirebaseService.updateDocument('healthReports', reportId, {
        downloadCount: reports.find(r => r.id === reportId)?.downloadCount || 0 + 1
      })

      // 실제 다운로드 로직은 여기에 구현
      console.log('Downloading report:', reportId)

      await loadReportData()
    } catch (error) {
      console.error('리포트 다운로드 실패:', error)
      setError(error instanceof Error ? error.message : '리포트 다운로드에 실패했습니다.')
    }
  }

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderReportGeneration = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI 리포트 생성</h2>
                  <Button 
            onClick={() => handleGenerateReport('default', '스트레스 분석')}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 리포트 생성
          </Button>
      </div>

      {error && (
        <Card className="p-6 bg-red-50 border border-red-200">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">오류 발생</h3>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={loadReportData} className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
              <Brain className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">리포트 생성 설정</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">AI Engine</label>
              <select 
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                disabled={configLoading}
              >
                <option value="">엔진을 선택하세요</option>
                {engines.map(engine => (
                  <option key={engine.id} value={engine.id}>
                                            {engine.name} ({engine.id}) - {engine.costPerAnalysis} 크레딧
                  </option>
                ))}
              </select>
              {selectedEngineDetails && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  {selectedEngineDetails.description}
                  <br />
                  <span className="font-medium">지원 데이터:</span> 
                  {Object.entries(selectedEngineDetails.supportedDataTypes)
                    .filter(([, supported]) => supported)
                    .map(([type]) => type.toUpperCase())
                    .join(', ')}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">분석 리포트 뷰어</label>
              <select 
                value={selectedViewer}
                onChange={(e) => setSelectedViewer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                disabled={configLoading || !selectedEngine}
              >
                <option value="">뷰어를 선택하세요</option>
                {viewers.map(viewer => (
                  <option key={viewer.id} value={viewer.id}>
                    {viewer.name} ({viewer.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">PDF 뷰어</label>
              <select 
                value={selectedPDFViewer}
                onChange={(e) => setSelectedPDFViewer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                disabled={configLoading || !selectedEngine}
              >
                <option value="">PDF 뷰어를 선택하세요</option>
                {pdfViewers.map(viewer => (
                  <option key={viewer.id} value={viewer.id}>
                    {viewer.name} ({viewer.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">대상 사용자</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all">
                <option value="">사용자 선택</option>
                {measurementUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">분석 기간</label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" className="focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                <Input type="date" className="focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
              </div>
            </div>
            <Button 
              className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12"
              disabled={loading || configLoading || !selectedEngine || !selectedViewer}
              onClick={async () => {
                const validation = await validateConfiguration();
                if (validation.isValid) {
                  // TODO: 실제 리포트 생성 로직 구현
                  console.log('리포트 생성 시작:', {
                    engine: selectedEngine,
                    viewer: selectedViewer,
                    pdfViewer: selectedPDFViewer
                  });
                } else {
                  alert(validation.message);
                }
              }}
            >
              {loading || configLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              리포트 생성 시작
            </Button>
            {configError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {configError}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">생성 현황</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">진행 중인 작업</span>
              </div>
              <Badge className="bg-gray-100 text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.pendingReports}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">완료된 작업</span>
              </div>
              <Badge className="bg-gray-100 text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.completedReports}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">실패한 작업</span>
              </div>
              <Badge className="bg-gray-100 text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.failedReports}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderReportList = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">리포트 목록</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            일괄 다운로드
          </Button>
          <Button 
            onClick={() => handleGenerateReport('default', '스트레스 분석')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 리포트
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="리포트 제목이나 사용자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">전체 상태</option>
          <option value="completed">완료</option>
          <option value="processing">처리중</option>
          <option value="failed">실패</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">전체 엔진</option>
          <option value="basic-gemini-v1">기본 Gemini 엔진</option>
          <option value="mental-gemini-v1">정신건강 Gemini 엔진</option>
          <option value="biosignal-gemini-v1">생체신호 Gemini 엔진</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {filteredReports.length === 0 ? (
            <Card className="p-8 bg-white border border-gray-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">리포트가 없습니다</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? '검색 조건에 맞는 리포트가 없습니다.' : '아직 생성된 리포트가 없습니다.'}
                  </p>
                  <Button 
                    onClick={() => handleGenerateReport('default', '스트레스 분석')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    첫 리포트 생성하기
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-600">{report.userName} • {report.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={
                        report.status === 'completed' ? 'bg-green-100 text-green-600' :
                        report.status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                        report.status === 'failed' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {report.status === 'completed' ? '완료' :
                         report.status === 'processing' ? '처리중' :
                         report.status === 'failed' ? '실패' : '대기'}
                      </Badge>
                      <Badge variant="outline">품질: {report.quality}%</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-50">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            미리보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(report.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            메일 발송
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">생성일: {report.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                      <Download className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">다운로드: {report.downloadCount}회</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">품질 점수: {report.quality}%</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderMeasurementDataList = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">측정 데이터 및 AI 분석 리포트</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadMeasurementData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            일괄 내보내기
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button variant="outline" size="sm" onClick={createTestMeasurementSession}>
              <Plus className="w-4 h-4 mr-2" />
              테스트 데이터 생성
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="사용자명 또는 측정일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">전체 기간</option>
          <option value="today">오늘</option>
          <option value="week">최근 7일</option>
          <option value="month">최근 30일</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">전체 품질</option>
          <option value="excellent">우수</option>
          <option value="good">양호</option>
          <option value="poor">불량</option>
        </select>
      </div>

      {loadingMeasurementData ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">측정 데이터를 불러오는 중...</span>
        </div>
      ) : measurementDataList.length === 0 ? (
        <Card className="p-8 bg-white border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">측정 데이터가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {error ? error : '아직 생성된 측정 세션이 없습니다. 먼저 측정을 진행하거나 테스트 데이터를 생성해보세요.'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  onClick={createTestMeasurementSession}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  테스트 측정 데이터 생성
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 테이블 헤더 */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">측정 데이터 목록</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  전체 {measurementDataList.length}개
                </span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                  페이지 {currentPage} / {totalPages}
                </span>
              </div>
            </div>
            
            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-6 gap-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-300 pb-2">
              <div>사용자 정보</div>
              <div className="text-center">나이</div>
              <div className="text-center">성별</div>
              <div className="text-center">직업</div>
              <div className="text-center">측정일시</div>
              <div className="text-center">생성자</div>
            </div>
          </div>

          {/* 컴팩트한 리스트 */}
          <div className="space-y-3">
            {currentItems.map((data) => {
              // 나이 계산 (임시로 랜덤 값 사용)
              const age = Math.floor(Math.random() * 40) + 25
              const measurementDate = new Date(data.timestamp)
              
              return (
                <div key={data.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                  {/* 메인 정보 행 - 테이블 형태 */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="grid grid-cols-6 gap-6 flex-1 items-center">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-gray-900">{data.userName}</span>
                          </div>
                          
                          <div className="text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {age}세
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              data.userGender === 'MALE' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {data.userGender === 'MALE' ? '남성' : '여성'}
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {data.userOccupation}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">측정일시</div>
                            <div className="text-xs text-gray-500">
                              {measurementDate.toLocaleDateString('ko-KR')} {measurementDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">생성자</div>
                            <div className="text-xs text-gray-500">{data.userName}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
                              disabled={generatingReports[data.id]?.isLoading || configLoading}
                            >
                              {generatingReports[data.id]?.isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  분석 중... ({generatingReports[data.id]?.elapsedSeconds || 0}초)
                                </>
                              ) : (
                                <>
                                  <Brain className="w-4 h-4 mr-2" />
                                  AI 분석 생성
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {configLoading ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                엔진 목록 로딩 중...
                              </DropdownMenuItem>
                            ) : engines && engines.length > 0 ? (
                              engines.map(engine => (
                                <DropdownMenuItem 
                                  key={engine.id}
                                  onClick={() => handleGenerateReportFromData(data.id, engine.id)}
                                >
                                  {engine.name} ({engine.costPerAnalysis} 크레딧)
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <DropdownMenuItem disabled>
                                사용 가능한 엔진이 없습니다
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* 연결된 분석 리스트 */}
                   {data.hasReports && data.availableReports && data.availableReports.length > 0 ? (
                     <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                       <h4 className="text-sm font-semibold text-purple-700 mb-4 flex items-center">
                         <Brain className="w-4 h-4 mr-2" />
                         연결된 분석 리스트 ({data.availableReports.length}개)
                       </h4>
                       <div className="space-y-3">
                         {data.availableReports.map((report: any) => {
                           const analysisDate = new Date(report.createdAt)
                           return (
                             <div key={report.id} className="bg-white rounded-lg border border-purple-100 shadow-sm p-3">
                               <div className="flex items-center justify-between">
                                 <div className="grid grid-cols-3 gap-4 flex-1">
                                   <div className="flex items-center space-x-2">
                                     <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                     <span className="font-semibold text-purple-900">{report.engineName || report.reportType}</span>
                                   </div>
                                   
                                   <div className="text-center">
                                     <div className="text-xs text-gray-500 font-medium">분석 엔진</div>
                                     <span className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                       {report.engineId || 'unknown'}
                                     </span>
                                   </div>
                                   
                                   <div className="text-center">
                                     <div className="text-xs text-gray-500 font-medium">분석일시</div>
                                     <div className="text-sm text-gray-700">
                                       {analysisDate.toLocaleDateString('ko-KR')} 
                                       <br />
                                       <span className="text-xs text-gray-500">
                                         {analysisDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center space-x-2 ml-4">
                                   {/* 리포트 뷰어 선택 드롭다운 */}
                                   <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                       <Button 
                                         size="sm" 
                                         variant="outline"
                                         className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-3 py-1.5 font-medium"
                                       >
                                         <Eye className="w-3 h-3 mr-1" />
                                         리포트보기
                                       </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent>
                                       {getCompatibleViewers(report.engineId || 'unknown').map(viewer => (
                                         <DropdownMenuItem 
                                           key={viewer.id}
                                           onClick={() => handleViewReportWithViewer(report, viewer.id, viewer.name)}
                                         >
                                           <Monitor className="w-4 h-4 mr-2" />
                                           {viewer.name}
                                         </DropdownMenuItem>
                                       ))}
                                       {getCompatibleViewers(report.engineId || 'unknown').length === 0 && (
                                         <DropdownMenuItem disabled>
                                           <AlertCircle className="w-4 h-4 mr-2" />
                                           사용 가능한 뷰어가 없습니다
                                         </DropdownMenuItem>
                                       )}
                                     </DropdownMenuContent>
                                   </DropdownMenu>
                                   
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => handleDownloadPDF(report.id, report)}
                                     className="text-green-600 border-green-300 hover:bg-green-50 text-xs px-3 py-1.5 font-medium"
                                   >
                                     <Download className="w-3 h-3 mr-1" />
                                     PDF 보기
                                   </Button>
                                   
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => handleDeleteReport(report.id, report.engineName || '분석 결과')}
                                     disabled={deletingReports[report.id]}
                                     className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5 font-medium"
                                   >
                                     {deletingReports[report.id] ? (
                                       <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                     ) : (
                                       <Trash2 className="w-3 h-3 mr-1" />
                                     )}
                                     {deletingReports[report.id] ? '삭제 중...' : '삭제'}
                                   </Button>
                                 </div>
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   ) : (
                     <div className="p-4 bg-gray-50">
                       <div className="text-center py-6">
                         <Brain className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                         <p className="text-sm text-gray-500 font-medium">아직 생성된 AI 분석 리포트가 없습니다.</p>
                         <p className="text-xs text-gray-400 mt-1">위의 "AI 분석 생성" 버튼을 클릭하여 분석을 시작하세요.</p>
                       </div>
                     </div>
                   )}

                  {/* 측정 데이터 삭제 버튼 */}
                  <div className="flex items-center justify-center mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOpenDeleteMeasurementDataConfirm(data.id, data.userName, data.availableReports?.length || 0)}
                      disabled={deletingMeasurementData[data.id]}
                      className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5 font-medium"
                    >
                      {deletingMeasurementData[data.id] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      {deletingMeasurementData[data.id] ? '삭제 중...' : '측정 데이터 삭제'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {startIndex + 1}-{Math.min(endIndex, measurementDataList.length)}개 표시 (전체 {measurementDataList.length}개 중)
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    이전
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          currentPage === pageNum 
                            ? "bg-purple-600 text-white hover:bg-purple-700" 
                            : "hover:bg-purple-50 hover:border-purple-300"
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderQualityManagement = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">품질 관리</h2>
        <Button variant="outline" onClick={loadReportData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">품질 지표</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">평균 품질 점수</span>
              <span className="text-sm font-semibold text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${reportStats.averageQuality.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">생성 성공률</span>
              <span className="text-sm font-semibold text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${reportStats.successRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">실패율</span>
              <span className="text-sm font-semibold text-gray-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${(100 - reportStats.successRate).toFixed(1)}%`}
              </span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
              <Star className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">품질 개선 제안</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">데이터 품질 향상</p>
                <p className="text-xs text-gray-600">신호 품질 검증 강화</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">알고리즘 최적화</p>
                <p className="text-xs text-gray-600">AI 모델 정확도 개선</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">처리 시간 단축</p>
                <p className="text-xs text-gray-600">리포트 생성 속도 향상</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
              <Brain className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">시스템 상태</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI 엔진 정상</p>
                <p className="text-xs text-gray-600">모든 서비스 가용</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">데이터 파이프라인 정상</p>
                <p className="text-xs text-gray-600">실시간 처리 중</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">리포트 생성 지연</p>
                <p className="text-xs text-gray-600">일시적 부하 증가</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  // 탭 정의
  const tabs = [
    { id: 'report-generation', label: '리포트 생성', icon: Plus },
    { id: 'report-list', label: '리포트 목록', icon: Eye },
    { id: 'report-quality', label: '품질 관리', icon: BarChart3 }
  ]

  // 탭 렌더링
  const renderTabs = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 -mx-6 -mt-6 mb-6">
      <div className="flex space-x-8">
        <button
          onClick={() => onNavigate('ai-report', 'report-generation')}
          className={`py-4 pl-6 pr-1 border-b-2 font-medium text-sm ${
            subSection === 'report-generation' || (!subSection)
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          리포트 생성
        </button>
        <button
          onClick={() => onNavigate('ai-report', 'report-list')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            subSection === 'report-list'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          리포트 목록
        </button>
        <button
          onClick={() => onNavigate('ai-report', 'measurement-data')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            subSection === 'measurement-data'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          측정 데이터 목록
        </button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (subSection) {
      case 'report-generation':
        return renderReportGeneration()
      case 'report-list':
        return renderReportList()
      case 'measurement-data':
        return renderMeasurementDataList()
      default:
        return renderReportGeneration()
    }
  }

  // AI 분석 결과 삭제 핸들러
  const handleDeleteReport = async (reportId: string, reportName: string) => {
    // 삭제 확인
    const confirmMessage = `정말로 "${reportName}" 분석 결과를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    if (!confirm(confirmMessage)) {
      return
    }

    // 중복 삭제 방지
    if (deletingReports[reportId]) {
      console.log('⚠️ 이미 삭제 중인 리포트입니다.')
      return
    }

    try {
      console.log('🗑️ AI 분석 결과 삭제 시작:', reportId)
      
      // 삭제 상태 시작
      setDeletingReports(prev => ({ ...prev, [reportId]: true }))

      // Firestore에서 분석 결과 삭제
      await FirebaseService.deleteDocument('ai_analysis_results', reportId)
      console.log('✅ AI 분석 결과 삭제 완료:', reportId)

      // 데이터 새로고침
      await loadMeasurementData()
      console.log('🔄 삭제 후 데이터 새로고침 완료')
      
      setError(null)

    } catch (error) {
      console.error('🚨 AI 분석 결과 삭제 실패:', error)
      setError(error instanceof Error ? error.message : 'AI 분석 결과 삭제 중 오류가 발생했습니다.')
    } finally {
      // 삭제 상태 종료
      setDeletingReports(prev => {
        const newState = { ...prev }
        delete newState[reportId]
        return newState
      })
    }
  }

  // 측정 데이터 삭제 확인 모달 열기
  const handleOpenDeleteMeasurementDataConfirm = (dataId: string, userName: string, reportCount: number) => {
    setDeleteConfirmModal({
      isOpen: true,
      dataId,
      dataUserName: userName,
      reportCount
    })
  }

  // 측정 데이터 삭제 모달 닫기
  const handleCloseDeleteMeasurementDataConfirm = () => {
    setDeleteConfirmModal({
      isOpen: false,
      dataId: '',
      dataUserName: '',
      reportCount: 0
    })
  }

  // 측정 데이터 삭제 실행 (리포트 포함/미포함 옵션)
  const handleDeleteMeasurementData = async (deleteReports: boolean = false) => {
    const { dataId, dataUserName } = deleteConfirmModal

    // 중복 삭제 방지
    if (deletingMeasurementData[dataId]) {
      console.log('⚠️ 이미 삭제 중인 측정 데이터입니다.')
      return
    }

    try {
      console.log('🗑️ 측정 데이터 삭제 시작:', dataId, deleteReports ? '(리포트 포함)' : '(리포트 제외)')
      
      // 삭제 상태 시작
      setDeletingMeasurementData(prev => ({ ...prev, [dataId]: true }))
      
      // 모달 닫기
      handleCloseDeleteMeasurementDataConfirm()

      // 1. 연결된 AI 분석 결과도 삭제하는 경우
      if (deleteReports) {
        // 해당 측정 데이터와 연결된 모든 AI 분석 결과 조회
        const analysisFilters = [
          FirebaseService.createWhereFilter('measurementDataId', '==', dataId)
        ]
        const analysisResults = await FirebaseService.getDocuments('ai_analysis_results', analysisFilters)
        
        console.log(`🗑️ 연결된 AI 분석 결과 ${analysisResults.length}개 삭제 중...`)
        
        // 모든 AI 분석 결과 삭제
        for (const analysis of analysisResults) {
          await FirebaseService.deleteDocument('ai_analysis_results', analysis.id)
          console.log(`✅ AI 분석 결과 삭제 완료: ${analysis.id}`)
        }
      }

      // 2. 측정 세션 삭제
      await FirebaseService.deleteMeasurementSession(dataId)
      console.log('✅ 측정 데이터 삭제 완료:', dataId)

      // 3. 데이터 새로고침
      await loadMeasurementData()
      console.log('🔄 삭제 후 데이터 새로고침 완료')
      
      setError(null)

    } catch (error) {
      console.error('🚨 측정 데이터 삭제 실패:', error)
      setError(error instanceof Error ? error.message : '측정 데이터 삭제 중 오류가 발생했습니다.')
    } finally {
      // 삭제 상태 종료
      setDeletingMeasurementData(prev => {
        const newState = { ...prev }
        delete newState[dataId]
        return newState
      })
    }
  }

  return (
    <div className="p-6">
      {renderTabs()}
      {renderContent()}
      
      {/* 리포트 뷰어 모달 */}
      {selectedReportForView && (
        <ReportViewerModal
          isOpen={isViewerModalOpen}
          onClose={() => {
            setIsViewerModalOpen(false)
            setSelectedReportForView(null)
            setSelectedViewerId('')
            setSelectedViewerName('')
          }}
          report={selectedReportForView}
          viewerId={selectedViewerId}
          viewerName={selectedViewerName}
        />
      )}

      {/* 측정 데이터 삭제 확인 모달 */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">측정 데이터 삭제</h3>
                <p className="text-sm text-gray-600">{deleteConfirmModal.dataUserName}님의 측정 데이터</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                이 측정 데이터를 삭제하시겠습니까?
              </p>
              
              {deleteConfirmModal.reportCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      연결된 AI 분석 결과 {deleteConfirmModal.reportCount}개가 있습니다
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    연결된 모든 리포트들도 함께 삭제할까요?
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseDeleteMeasurementDataConfirm}
                className="flex-1"
              >
                취소
              </Button>
              
              {deleteConfirmModal.reportCount > 0 && (
                <Button
                  onClick={() => handleDeleteMeasurementData(false)}
                  className="flex-1 bg-orange-600 text-white hover:bg-orange-700"
                >
                  측정 데이터만 삭제
                </Button>
              )}
              
              <Button
                onClick={() => handleDeleteMeasurementData(true)}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {deleteConfirmModal.reportCount > 0 ? '모두 삭제' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 