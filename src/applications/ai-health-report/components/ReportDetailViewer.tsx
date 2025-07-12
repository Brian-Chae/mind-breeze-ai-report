import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Download, 
  ArrowLeft, 
  Calendar, 
  User, 
  Briefcase, 
  Heart, 
  Brain, 
  Zap,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  Shield,
  BarChart3,
  Users,
  TrendingUp,
  Flame,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { StoredReport } from '../services/ReportStorage';
import PDFReportService from '../services/PDFReportService';
import { toast } from 'sonner';
import { AIAnalysisMarkdownRenderer } from './AIAnalysisMarkdownRenderer';
import { GeminiAIService } from '../services/GeminiAIService';
import DetailedAnalysisSection from './DetailedAnalysisSection';
import OverallHealthReport from './report_segments/OverallHealthReport';
import EEGPPGDetailAnalysisReport from './report_segments/EEGPPGDetailAnalysisReport';
import MentalHealthRiskReport from './report_segments/MentalHealthRiskReport';
import MedicalRiskAnalysisReport from './report_segments/MedicalRiskAnalysisReport';
import PersonalizedRecommendationsReport from './report_segments/PersonalizedRecommendationsReport';

interface ReportDetailViewerProps {
  report: StoredReport;
  onBack: () => void;
  className?: string;
  
  // 🆕 즉시 분석용 추가 기능
  isCurrentAnalysis?: boolean; // 즉시 분석 vs 저장된 리포트 구분
  showSaveButton?: boolean; // 저장 버튼 표시 여부
  showShareButton?: boolean; // 공유 버튼 표시 여부
  onSave?: () => void; // 저장 콜백
  onShare?: () => void; // 공유 콜백
  
  // 🆕 추가 액션 버튼들
  showEEGButton?: boolean; // EEG 상세 분석 버튼
  showPPGButton?: boolean; // PPG 상세 분석 버튼
  onViewEEGAnalysis?: () => void; // EEG 상세 분석 콜백
  onViewPPGAnalysis?: () => void; // PPG 상세 분석 콜백
  
  // 🆕 상태 표시
  isSaving?: boolean; // 저장 중 상태
  saveSuccess?: boolean; // 저장 성공 상태
}

interface ExpandedSections {
  overview: boolean;
  analysis: boolean;
  recommendations: boolean;
  mentalHealthRisk: boolean;
  medicalRiskAnalysis: boolean;
}

interface MentalHealthComprehensiveAnalysis {
  comprehensiveInterpretation: string;
  individualMetricsInterpretation: {
    focusIndex: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    relaxationIndex: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    stressIndex: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    cognitiveLoad: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    emotionalStability: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    hemisphericBalance: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    totalPower: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
  };
  ageSpecificAnalysis: {
    ageGroup: string;
    typicalCharacteristics: string;
    currentComparison: string;
    riskFactors: string[];
    strengths: string[];
  };
  genderSpecificAnalysis: {
    gender: string;
    brainPatternCharacteristics: string;
    hormonalInfluence: string;
    mentalHealthPatterns: string;
    managementPoints: string[];
  };
  occupationalAnalysis: {
    occupation: string;
    workRequirements: string;
    stressFactors: string[];
    brainFunctionMatch: string;
    workplaceRisks: string[];
    adaptationStrategies: string[];
  };
  mentalHealthRiskAssessment: {
    primaryRisks: string[];
    protectiveFactors: string[];
    immediateAttention: string[];
    longTermMonitoring: string[];
  };
  personalizedRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    occupationSpecific: string[];
  };
}

interface PhysicalHealthComprehensiveAnalysis {
  comprehensiveInterpretation: string;
  individualMetricsInterpretation: {
    heartRate: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    rmssd: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    sdnn: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    spo2: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
    lfHfRatio: {
      value: number;
      normalRange: string;
      status: string;
      interpretation: string;
      personalizedAdvice: string;
    };
  };
  ageSpecificAnalysis: {
    ageGroup: string;
    typicalCharacteristics: string;
    currentComparison: string;
    riskFactors: string[];
    strengths: string[];
  };
  genderSpecificAnalysis: {
    gender: string;
    cardiovascularCharacteristics: string;
    hormonalInfluence: string;
    healthPatterns: string;
    managementPoints: string[];
  };
  occupationalAnalysis: {
    occupation: string;
    workRequirements: string;
    stressFactors: string[];
    cardiovascularMatch: string;
    workplaceRisks: string[];
    adaptationStrategies: string[];
  };
  cardiovascularRiskAssessment: {
    primaryRisks: string[];
    protectiveFactors: string[];
    immediateAttention: string[];
    longTermMonitoring: string[];
  };
  personalizedRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    occupationSpecific: string[];
  };
}

const ReportDetailViewer: React.FC<ReportDetailViewerProps> = ({
  report,
  onBack,
  className = '',
  
  // 🆕 즉시 분석용 추가 기능
  isCurrentAnalysis = false,
  showSaveButton = false,
  showShareButton = false,
  onSave,
  onShare,
  
  // 🆕 추가 액션 버튼들
  showEEGButton = false,
  showPPGButton = false,
  onViewEEGAnalysis,
  onViewPPGAnalysis,
  
  // 🆕 상태 표시
  isSaving = false,
  saveSuccess = false
}) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    overview: true,
    analysis: false,
    recommendations: false,
    mentalHealthRisk: false,
    medicalRiskAnalysis: false
  });
  const [mentalHealthComprehensive, setMentalHealthComprehensive] = useState<MentalHealthComprehensiveAnalysis | null>(null);
  const [loadingComprehensive, setLoadingComprehensive] = useState(false);
  const [physicalHealthComprehensive, setPhysicalHealthComprehensive] = useState<PhysicalHealthComprehensiveAnalysis | null>(null);
  const [loadingPhysicalComprehensive, setLoadingPhysicalComprehensive] = useState(false);
  const [stressComprehensive, setStressComprehensive] = useState<{
    comprehensiveInterpretation: string;
    ageSpecificAnalysis: {
      ageGroup: string;
      typicalCharacteristics: string;
      currentComparison: string;
      riskFactors: string[];
      strengths: string[];
    };
    genderSpecificAnalysis: {
      gender: string;
      stressPatternCharacteristics: string;
      hormonalInfluence: string;
      stressManagementPatterns: string;
      managementPoints: string[];
    };
    occupationalAnalysis: {
      occupation: string;
      workRequirements: string;
      stressFactors: string[];
      stressManagementMatch: string;
      workplaceRisks: string[];
      adaptationStrategies: string[];
    };
  } | null>(null);
  const [loadingStressComprehensive, setLoadingStressComprehensive] = useState(false);

  const { personalInfo, analysisResult } = report;

  // 뇌파 분석 종합 해석 로드
  useEffect(() => {
    // 🔧 즉시 분석인 경우에만 AI 분석 실행
    if (!isCurrentAnalysis) {
      console.log('📋 저장된 리포트 - 뇌파 AI 분석 건너뜀');
      return;
    }

    const loadMentalHealthComprehensive = async () => {
      if (!analysisResult?.detailedAnalysis?.mentalHealth) return;
      
      try {
        setLoadingComprehensive(true);
        
        // detailedAnalysis.mentalHealth를 MentalHealthReport 형태로 변환
        const mentalHealthReport = {
          score: analysisResult.detailedAnalysis.mentalHealth.score,
          status: analysisResult.detailedAnalysis.mentalHealth.status,
          analysis: analysisResult.detailedAnalysis.mentalHealth.analysis,
          keyMetrics: analysisResult.detailedAnalysis.mentalHealth.keyMetrics,
          recommendations: analysisResult.detailedAnalysis.mentalHealth.recommendations || [],
          concerns: [] // 기본값으로 빈 배열 설정
        };
        
        const comprehensiveAnalysis = await GeminiAIService.generateMentalHealthComprehensiveInterpretation(
          personalInfo,
          report.measurementData,
          mentalHealthReport
        );
        setMentalHealthComprehensive(comprehensiveAnalysis);
      } catch (error) {
        console.error('뇌파 분석 종합 해석 로드 실패:', error);
        toast.error('뇌파 분석 종합 해석을 불러오는데 실패했습니다.');
      } finally {
        setLoadingComprehensive(false);
      }
    };

    loadMentalHealthComprehensive();
  }, [personalInfo, report.measurementData, analysisResult?.detailedAnalysis?.mentalHealth, isCurrentAnalysis]);

  // 맥파 분석 종합 해석 로드
  useEffect(() => {
    // 🔧 즉시 분석인 경우에만 AI 분석 실행
    if (!isCurrentAnalysis) {
      console.log('📋 저장된 리포트 - 맥파 AI 분석 건너뜀');
      return;
    }

    const loadPhysicalHealthComprehensive = async () => {
      if (!analysisResult?.detailedAnalysis?.physicalHealth) return;
      
      try {
        setLoadingPhysicalComprehensive(true);
        
        // detailedAnalysis.physicalHealth를 PhysicalHealthReport 형태로 변환
        const physicalHealthReport = {
          score: analysisResult.detailedAnalysis.physicalHealth.score,
          status: analysisResult.detailedAnalysis.physicalHealth.status,
          analysis: analysisResult.detailedAnalysis.physicalHealth.analysis,
          keyMetrics: analysisResult.detailedAnalysis.physicalHealth.keyMetrics,
          recommendations: analysisResult.detailedAnalysis.physicalHealth.recommendations || [],
          concerns: [] // 기본값으로 빈 배열 설정
        };
        
        const comprehensiveAnalysis = await GeminiAIService.generatePhysicalHealthComprehensiveInterpretation(
          personalInfo,
          report.measurementData,
          physicalHealthReport
        );
        setPhysicalHealthComprehensive(comprehensiveAnalysis);
      } catch (error) {
        console.error('맥파 분석 종합 해석 로드 실패:', error);
        toast.error('맥파 분석 종합 해석을 불러오는데 실패했습니다.');
      } finally {
        setLoadingPhysicalComprehensive(false);
      }
    };

    loadPhysicalHealthComprehensive();
  }, [personalInfo, report.measurementData, analysisResult?.detailedAnalysis?.physicalHealth, isCurrentAnalysis]);

  // 스트레스 분석 종합 해석 로드
  useEffect(() => {
    // 🔧 즉시 분석인 경우에만 AI 분석 실행
    if (!isCurrentAnalysis) {
      console.log('📋 저장된 리포트 - 스트레스 AI 분석 건너뜀');
      return;
    }

    const loadStressComprehensive = async () => {
      if (!analysisResult?.detailedAnalysis?.stressLevel) return;
      
      try {
        setLoadingStressComprehensive(true);
        
        // 스트레스 분석을 위한 데이터 준비
        const stressReport = {
          score: analysisResult.detailedAnalysis.stressLevel.score,
          level: analysisResult.detailedAnalysis.stressLevel.level,
          eegStressIndex: report.measurementData.eegMetrics.stressIndex?.value || 0,
          heartRate: report.measurementData.ppgMetrics.heartRate?.value || 0,
          rmssd: report.measurementData.ppgMetrics.rmssd?.value || 0,
          lfHfRatio: report.measurementData.ppgMetrics.lfHfRatio?.value || 0,
          relaxationIndex: report.measurementData.eegMetrics.relaxationIndex?.value || 0
        };
        
        // 임시로 정적 스트레스 종합 해석 생성 (향후 AI 서비스 연동 예정)
        const comprehensiveAnalysis = {
          comprehensiveInterpretation: `**${personalInfo.name}님의 스트레스 상태 종합 분석**\n\n` +
            `측정 결과 전반적인 스트레스 관리 점수는 ${stressReport.score}점으로 ${stressReport.level} 상태를 보이고 있습니다.\n\n` +
            `**주요 스트레스 지표 분석:**\n\n` +
            `• **뇌파 스트레스 지수**: ${stressReport.eegStressIndex.toFixed(2)} - ${stressReport.eegStressIndex >= 3.0 && stressReport.eegStressIndex <= 4.0 ? '정상 범위 내의 적절한 정신적 긴장 상태' : stressReport.eegStressIndex > 4.0 ? '높은 정신적 스트레스 상태로 주의 필요' : '낮은 정신적 활성도로 각성 상태 개선 필요'}\n\n` +
            `• **자율신경 균형**: LF/HF 비율 ${stressReport.lfHfRatio.toFixed(2)} - ${stressReport.lfHfRatio >= 1.0 && stressReport.lfHfRatio <= 10.0 ? '교감신경과 부교감신경의 균형이 적절히 유지됨' : '자율신경 불균형 상태로 스트레스 관리 필요'}\n\n` +
            `• **스트레스 회복력**: RMSSD ${stressReport.rmssd.toFixed(0)}ms - ${stressReport.rmssd >= 20 && stressReport.rmssd <= 50 ? '양호한 스트레스 회복 능력' : stressReport.rmssd > 50 ? '우수한 스트레스 회복 능력' : '스트레스 회복 능력 개선 필요'}\n\n` +
            `• **심박수 반응**: ${stressReport.heartRate.toFixed(0)}BPM - ${stressReport.heartRate >= 60 && stressReport.heartRate <= 100 ? '정상 범위의 안정적인 심박수' : stressReport.heartRate > 100 ? '높은 심박수로 스트레스 반응 증가' : '낮은 심박수'}\n\n` +
            `**개인 특성 고려사항:**\n\n` +
            `${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}의 경우, 해당 연령대의 일반적인 스트레스 패턴과 비교하여 ${stressReport.score >= 70 ? '양호한 스트레스 관리 상태' : '개선이 필요한 스트레스 관리 상태'}를 보이고 있습니다.\n\n` +
            `**종합 권장사항:**\n\n` +
            `현재 스트레스 상태를 고려할 때, ${stressReport.score >= 80 ? '현재의 스트레스 관리 방식을 유지하되 예방적 관리에 집중' : stressReport.score >= 60 ? '일부 스트레스 지표 개선을 위한 맞춤형 관리 방안 적용' : '종합적인 스트레스 관리 전략 수립 및 전문적 도움 고려'}하는 것이 권장됩니다.`,
          ageSpecificAnalysis: {
            ageGroup: `${personalInfo.age}세`,
            typicalCharacteristics: `${personalInfo.age}세 연령대는 ${personalInfo.gender === 'male' ? '직업적 책임과 사회적 역할 증가로 인한 스트레스 관리가 중요한' : '다양한 생활 변화와 호르몬 변화로 인한 스트레스 적응이 필요한'} 시기입니다.`,
            currentComparison: `현재 스트레스 수준은 해당 연령대 평균 대비 ${stressReport.score >= 70 ? '양호한' : '개선이 필요한'} 상태입니다.`,
            riskFactors: stressReport.score < 60 ? ['만성 스트레스 축적', '자율신경 불균형', '수면 질 저하'] : ['일시적 스트레스 증가'],
            strengths: stressReport.score >= 70 ? ['적절한 스트레스 대응 능력', '안정적인 자율신경 기능'] : ['개선 가능성 높음']
          },
          genderSpecificAnalysis: {
            gender: personalInfo.gender === 'male' ? '남성' : '여성',
            stressPatternCharacteristics: personalInfo.gender === 'male' ? '남성은 일반적으로 문제 해결 중심의 스트레스 대응 패턴을 보입니다.' : '여성은 일반적으로 감정적 지지와 사회적 연결을 통한 스트레스 관리 패턴을 보입니다.',
            hormonalInfluence: personalInfo.gender === 'male' ? '테스토스테론 수준이 스트레스 반응에 영향을 미칩니다.' : '에스트로겐과 프로게스테론 변화가 스트레스 민감도에 영향을 미칩니다.',
            stressManagementPatterns: personalInfo.gender === 'male' ? '신체 활동과 목표 지향적 활동을 통한 스트레스 해소가 효과적입니다.' : '사회적 지지와 감정 표현을 통한 스트레스 관리가 중요합니다.',
            managementPoints: personalInfo.gender === 'male' ? ['규칙적인 운동', '명확한 목표 설정', '취미 활동'] : ['사회적 연결', '감정 표현', '자기 돌봄']
          },
          occupationalAnalysis: {
            occupation: personalInfo.occupation,
            workRequirements: `${personalInfo.occupation} 직군의 특성상 다양한 업무 스트레스 요인에 노출되어 있습니다.`,
            stressFactors: personalInfo.occupation === 'developer' ? ['장시간 컴퓨터 작업', '업무 압박', '기술 변화 적응'] : 
                          personalInfo.occupation === 'manager' ? ['의사결정 부담', '팀 관리', '성과 압박'] : 
                          ['업무 압박', '대인관계', '환경 변화'],
            stressManagementMatch: `현재 스트레스 수준은 업무 수행에 ${stressReport.score >= 70 ? '적합한' : '개선이 필요한'} 상태입니다.`,
            workplaceRisks: stressReport.score < 60 ? ['업무 효율성 저하', '의사결정 능력 감소', '대인관계 문제'] : ['일시적 스트레스 증가'],
            adaptationStrategies: ['업무 우선순위 설정', '휴식 시간 확보', '스트레스 관리 기법 활용']
          }
        };
        setStressComprehensive(comprehensiveAnalysis);
      } catch (error) {
        console.error('스트레스 분석 종합 해석 로드 실패:', error);
        toast.error('스트레스 분석 종합 해석을 불러오는데 실패했습니다.');
      } finally {
        setLoadingStressComprehensive(false);
      }
    };

    loadStressComprehensive();
  }, [personalInfo, report.measurementData, analysisResult?.detailedAnalysis?.stressLevel, isCurrentAnalysis]);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const pdfService = PDFReportService.getInstance();
      const pdfBlob = await pdfService.generatePDFFromStoredReport(report);
      
      // PDF 다운로드
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI건강리포트_${report.personalInfo.name}_${new Date(report.timestamp).toLocaleDateString('ko-KR').replace(/\./g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF가 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      toast.error('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getOccupationLabel = (occupation: string) => {
    const labels: { [key: string]: string } = {
      'teacher': '교사',
      'military_medic': '의무병사',
      'military_career': '직업군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'parent': '학부모',
      'firefighter': '소방공무원',
      'police': '경찰공무원',
      'developer': '개발자',
      'designer': '디자이너',
      'office_worker': '일반 사무직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'other': '그외'
    };
    return labels[occupation] || occupation;
  };

  // 5단계 분포 표시 컴포넌트
  const ScoreDistributionBar = ({ score, label, className = '' }: { score: number; label: string; className?: string }) => {
    const getScoreLevel = (score: number) => {
      if (score < 5) return { level: '위험', color: 'text-red-600' };
      if (score < 25) return { level: '경계', color: 'text-orange-600' };
      if (score < 75) return { level: '보통', color: 'text-yellow-600' };
      if (score < 95) return { level: '양호', color: 'text-green-600' };
      return { level: '우수', color: 'text-blue-600' };
    };

    const { level, color } = getScoreLevel(score);

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-700">{label}</span>
          <span className={`text-xl font-bold ${color}`}>
            {score.toFixed(1)}/100
          </span>
        </div>
        <div className="space-y-2">
          <div className="relative">
            {/* 전체 구간 색상 표시 */}
            <div className="w-full h-4 rounded-lg overflow-hidden bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-400 to-blue-500">
              {/* 구간 경계선 */}
              <div className="absolute top-0 left-[5%] w-px h-4 bg-white opacity-70"></div>
              <div className="absolute top-0 left-[25%] w-px h-4 bg-white opacity-70"></div>
              <div className="absolute top-0 left-[75%] w-px h-4 bg-white opacity-70"></div>
              <div className="absolute top-0 left-[95%] w-px h-4 bg-white opacity-70"></div>
            </div>
            
            {/* 현재 위치 마커 라인 */}
            <div 
              className="absolute top-0 w-0.5 h-4 bg-gray-900 rounded-sm transition-all duration-500"
              style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
            />
            
            {/* 현재 위치 표시점 */}
            <div 
              className="absolute top-1/2 w-3 h-3 bg-white border-2 border-gray-900 rounded-full transition-all duration-500"
              style={{ left: `${score}%`, transform: 'translate(-50%, -50%)' }}
            />
            
            {/* 점수 및 상태 툴팁 */}
            <div 
              className="absolute -top-12 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold transition-all duration-500 whitespace-nowrap text-center"
              style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
            >
              <div>{score.toFixed(1)}점</div>
              <div>{level}</div>
              <div className="absolute top-full left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800" style={{ transform: 'translateX(-50%)' }}></div>
            </div>
          </div>
          
          {/* 구간 라벨 */}
          <div className="flex justify-between text-sm text-gray-500 font-medium">
            <span>위험</span>
            <span>경계</span>
            <span>보통</span>
            <span>양호</span>
            <span>우수</span>
          </div>
        </div>
        <div className={`text-base font-semibold ${color}`}>
          상태: {level}
        </div>
      </div>
    );
  };

  // 뇌파 지표 270도 게이지 그래프 컴포넌트
  const MentalHealthRiskChart = ({ value, label }: { 
    value: number; 
    label: string; 
  }) => {
    // 정신건강 위험도 구간: 0-30 (정상), 31-50 (경계), 51-100 (위험)
    const totalRange = 100;
    const normalMax = 30;
    const borderlineMax = 50;
    
    // 200도 각도 계산
    const totalAngle = 200;
    const startAngle = 260;
    
    // 각 구간의 각도 계산 (비율에 따라)
    const normalAngle = (normalMax / totalRange) * totalAngle; // 30% = 60도
    const borderlineAngle = ((borderlineMax - normalMax) / totalRange) * totalAngle; // 20% = 40도  
    const riskAngle = ((totalRange - borderlineMax) / totalRange) * totalAngle; // 50% = 100도
    
    // 현재 값의 각도 계산
    const currentValueAngle = Math.min(totalAngle, Math.max(0, (value / totalRange) * totalAngle));
    
    // 극좌표를 직교좌표로 변환하는 함수
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    
    // 호 경로 생성 함수
    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    const centerX = 50;
    const centerY = 50;
    const radius = 40;
    
    // 각 구간의 경로 생성 (약간씩 겹치게 하여 경계를 직선으로 만들기)
    const normalPath = describeArc(centerX, centerY, radius, startAngle, startAngle + normalAngle + 1);
    const borderlinePath = describeArc(centerX, centerY, radius, startAngle + normalAngle - 1, startAngle + normalAngle + borderlineAngle + 1);
    const riskPath = describeArc(centerX, centerY, radius, startAngle + normalAngle + borderlineAngle - 1, startAngle + totalAngle);
    
    // 현재 값 마커 위치
    const markerAngle = startAngle + currentValueAngle;
    const markerPos = polarToCartesian(centerX, centerY, radius, markerAngle);
    const markerPosInner = polarToCartesian(centerX, centerY, radius - 12, markerAngle);

    return (
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-56 h-56" viewBox="0 0 100 100">
          {/* 배경 호 */}
          <path
            d={describeArc(centerX, centerY, radius, startAngle, startAngle + totalAngle)}
            stroke="#f3f4f6"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 정상 구간 (초록색) - 먼저 그리고 왼쪽 끝 round */}
          <path
            d={normalPath}
            stroke="#10b981"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 위험 구간 (빨간색) - 두 번째로 그리고 오른쪽 끝 round */}
          <path
            d={riskPath}
            stroke="#ef4444"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* 경계 구간 (노란색) - 가장 마지막에 그리고 butt로 중간 경계 덮어쓰기 */}
          <path
            d={borderlinePath}
            stroke="#eab308"
            strokeWidth="12"
            fill="none"
            strokeLinecap="butt"
          />
          
          {/* 현재 값 마커 */}
          <g>
            {/* 마커 라인 */}
            <line
              x1={markerPosInner.x}
              y1={markerPosInner.y}
              x2={markerPos.x}
              y2={markerPos.y}
              stroke="#1f2937"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 마커 점 */}
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r="4"
              fill="#1f2937"
            />
          </g>
        </svg>
        
        {/* 중앙 값 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center mt-1">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {value.toFixed(0)}
            </div>
            {/* 상태 표시 - Chip 형태 */}
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={
                  value <= 30
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : value <= 50
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }
              >
                {value <= 30 ? '정상' : value <= 50 ? '경계' : '위험'}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* 범위 라벨 */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-between text-sm text-gray-500 px-4">
          <span>정상</span>
          <span>경계</span>
          <span>위험</span>
        </div>
      </div>
    );
  };

  const EEGMetricChart = ({ value, normalRange, label, unit = '', status, customLabels }: { 
    value: number; 
    normalRange: { min: number; max: number }; 
    label: string; 
    unit?: string;
    status: 'low' | 'normal' | 'high';
    customLabels?: { low: string; normal: string; high: string };
  }) => {
    // 전체 범위 계산 (정상범위 앞뒤로 여유분 추가)
    const rangeSpan = normalRange.max - normalRange.min;
    const minValue = normalRange.min - rangeSpan * 0.5; // 정상 최소값보다 50% 낮게
    const maxValue = normalRange.max + rangeSpan * 0.5; // 정상 최대값보다 50% 높게
    
    // 200도 각도 계산
    const totalAngle = 200; // 200도
    const startAngle = 260; // 시작 각도 (정상 범위 가운데가 위에 오도록 조정)
    
    // 각 구간의 각도 계산
    const lowRangeAngle = ((normalRange.min - minValue) / (maxValue - minValue)) * totalAngle;
    const normalRangeAngle = ((normalRange.max - normalRange.min) / (maxValue - minValue)) * totalAngle;
    const highRangeAngle = ((maxValue - normalRange.max) / (maxValue - minValue)) * totalAngle;
    
    // 현재 값의 각도 계산
    const currentValueAngle = Math.min(totalAngle, Math.max(0, ((value - minValue) / (maxValue - minValue)) * totalAngle));
    
    // 극좌표를 직교좌표로 변환하는 함수
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    
    // 호 경로 생성 함수
    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    const centerX = 50;
    const centerY = 50;
    const radius = 40;
    
    // 각 구간의 경로 생성 (약간씩 겹치게 하여 경계를 직선으로 만들기)
    const lowPath = describeArc(centerX, centerY, radius, startAngle, startAngle + lowRangeAngle + 1);
    const normalPath = describeArc(centerX, centerY, radius, startAngle + lowRangeAngle - 1, startAngle + lowRangeAngle + normalRangeAngle + 1);
    const highPath = describeArc(centerX, centerY, radius, startAngle + lowRangeAngle + normalRangeAngle - 1, startAngle + totalAngle);
    
    // 현재 값 마커 위치
    const markerAngle = startAngle + currentValueAngle;
    const markerPos = polarToCartesian(centerX, centerY, radius, markerAngle);
    const markerPosInner = polarToCartesian(centerX, centerY, radius - 12, markerAngle);

    return (
      <div className="relative w-full mx-auto">
        {/* 차트 영역 - viewBox를 조정하여 하단 빈 공간 제거 */}
        <div className="relative">
          <svg className="w-full" viewBox="0 0 100 65" style={{ height: 'auto', aspectRatio: '100/65' }}>
            {/* 배경 호 */}
            <path
              d={describeArc(centerX, centerY, radius, startAngle, startAngle + totalAngle)}
              stroke="#f3f4f6"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* 미만 구간 (노란색) - 먼저 그리고 왼쪽 끝 round */}
            <path
              d={lowPath}
              stroke="#eab308"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* 초과 구간 (빨간색) - 두 번째로 그리고 오른쪽 끝 round */}
            <path
              d={highPath}
              stroke="#ef4444"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* 정상 구간 (녹색) - 가장 마지막에 그리고 butt로 중간 경계 덮어쓰기 */}
            <path
              d={normalPath}
              stroke="#10b981"
              strokeWidth="12"
              fill="none"
              strokeLinecap="butt"
            />
            
            {/* 현재 값 마커 */}
            <g>
              {/* 마커 라인 */}
              <line
                x1={markerPosInner.x}
                y1={markerPosInner.y}
                x2={markerPos.x}
                y2={markerPos.y}
                stroke="#1f2937"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* 마커 점 */}
              <circle
                cx={markerPos.x}
                cy={markerPos.y}
                r="4"
                fill="#1f2937"
              />
            </g>
          </svg>
          
          {/* 중앙 값 표시 - 새로운 레이아웃 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center mt-32">
              {/* 측정값과 단위 */}
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {value.toFixed(value < 10 ? 2 : 1)}{unit && ` ${unit}`}
              </div>
              
              {/* 정상 범위 표시 */}
              <div className="text-sm text-gray-600 mb-1">
                정상 : {normalRange.min.toFixed(normalRange.min < 1 ? 3 : normalRange.min < 10 ? 2 : 1)}{unit && ` ${unit}`} ~ {normalRange.max.toFixed(normalRange.max < 1 ? 3 : normalRange.max < 10 ? 2 : 1)}{unit && ` ${unit}`}
              </div>
              
              {/* 상태 표시 - Chip 형태 */}
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className={
                    status === 'normal'
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : status === 'high'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }
                >
                  {status === 'normal' ? '정상' : status === 'high' ? '높음' : '낮음'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* 범위 라벨 - 차트 바로 아래에 밀착 */}
        <div className="flex justify-between text-sm text-gray-500 px-4 -mt-1">
          <span>{customLabels?.low || '미만'}</span>
          <span>{customLabels?.normal || '정상'}</span>
          <span>{customLabels?.high || '초과'}</span>
        </div>
      </div>
    );
  };

  // 뇌파 지표 데이터 정의
  const eegMetrics = [
    {
      id: 'focusIndex',
      title: '집중력 지수',
      subtitle: 'Focus Index',
      value: 2.02,
      normalRange: { min: 1.8, max: 2.4 },
      unit: '',
      status: 'normal' as const,
      normalRangeText: '1.8 - 2.4',
      currentState: '양호',
      interpretation: '현재 집중력이 정상 범위에 있으며, 인지적 주의력이 적절히 유지되고 있습니다. 지속적인 집중 상태를 잘 유지하고 있어 학습이나 업무 효율성이 높을 것으로 예상됩니다.'
    },
    {
      id: 'relaxationIndex',
      title: '이완도 지수',
      subtitle: 'Relaxation Index',
      value: 0.20,
      normalRange: { min: 0.18, max: 0.22 },
      unit: '',
      status: 'normal' as const,
      normalRangeText: '0.18 - 0.22',
      currentState: '양호',
      interpretation: '적절한 이완 상태를 유지하고 있어 스트레스 관리가 잘 되고 있습니다. 정신적 휴식과 회복 능력이 양호하며, 과도한 긴장 없이 편안한 상태를 유지하고 있습니다.'
    },
    {
      id: 'stressIndex',
      title: '스트레스 지수',
      subtitle: 'Stress Index',
      value: 3.2,
      normalRange: { min: 2.0, max: 4.0 },
      unit: '',
      status: 'normal' as const,
      normalRangeText: '2.0 - 4.0',
      currentState: '양호',
      interpretation: '스트레스 수준이 정상 범위 내에 있어 적절한 각성 상태를 유지하고 있습니다. 과도한 스트레스나 긴장 없이 일상 활동에 적합한 정신적 상태를 보이고 있습니다.'
    },
    {
      id: 'hemisphericBalance',
      title: '좌우뇌 균형',
      subtitle: 'Hemispheric Balance',
      value: -0.04,
      normalRange: { min: -0.1, max: 0.1 },
      unit: '',
      status: 'normal' as const,
      normalRangeText: '-0.1 ~ 0.1',
      currentState: '균형',
      interpretation: '좌우뇌 활성도가 균형을 이루고 있어 논리적 사고와 창의적 사고가 조화롭게 작용하고 있습니다. 인지적 처리 능력이 균형적으로 발달되어 있는 상태입니다.',
      customLabels: { low: '우뇌우세', normal: '균형', high: '좌뇌우세' }
    },
    {
      id: 'cognitiveLoad',
      title: '인지 부하',
      subtitle: 'Cognitive Load',
      value: 0.55,
      normalRange: { min: 0.3, max: 0.8 },
      unit: '',
      status: 'normal' as const,
      normalRangeText: '0.3 - 0.8',
      currentState: '적정',
      interpretation: '인지적 부하가 적절한 수준에 있어 정보 처리 능력이 효율적으로 작동하고 있습니다. 과도한 인지적 부담 없이 복잡한 사고 과정을 수행할 수 있는 상태입니다.'
    },
    {
      id: 'totalPower',
      title: '신경 활성도',
      subtitle: 'Total Power',
      value: 1020,
      normalRange: { min: 850, max: 1150 },
      unit: 'µV²',
      status: 'normal' as const,
      normalRangeText: '850 - 1150 µV²',
      currentState: '양호',
      interpretation: '전체적인 뇌 활성도가 정상 범위에 있어 신경계 기능이 건강하게 작동하고 있습니다. 적절한 신경 활동 수준을 유지하고 있어 인지 기능과 정서 조절이 원활합니다.'
    }
  ];

  // 상태 판단 함수
  const getMetricStatus = (value: number, normalRange: { min: number; max: number }): 'low' | 'normal' | 'high' => {
    if (value < normalRange.min) return 'low';
    if (value > normalRange.max) return 'high';
    return 'normal';
  };

  // EEG 지표 카드 배경색 결정 함수
  const getEEGCardBackgroundClass = (status: 'low' | 'normal' | 'high') => {
    switch (status) {
      case 'normal':
        return 'bg-white border-gray-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // PPG 지표 데이터 준비 함수 (신체건강 분석용)
  const preparePPGMetrics = () => {
    const ppgMetrics = [
      // 첫 번째 행: 심박수 | 산소포화도
      {
        id: 'heartRate',
        title: '심박수',
        subtitle: 'Heart Rate',
        value: report.measurementData.ppgMetrics?.heartRate?.value || 79,
        normalRange: { min: 60, max: 100 },
        unit: 'BPM',
        status: getMetricStatus(report.measurementData.ppgMetrics?.heartRate?.value || 79, { min: 60, max: 100 }),
        normalRangeText: '60-100 BPM',
        currentState: '정상 범위 - 건강한 심박수',
        interpretation: physicalHealthComprehensive?.individualMetricsInterpretation?.heartRate?.interpretation || 
                        report.measurementData.ppgMetrics?.heartRate?.interpretation || 
                        '심장의 수축 빈도로 심혈관 건강과 자율신경계 상태를 반영합니다. 현재 심박수는 정상 범위에 있어 건강한 심혈관 기능을 나타냅니다.',
        customLabels: { low: '서맥', normal: '정상', high: '빈맥' }
      },
      {
        id: 'spo2',
        title: '산소포화도',
        subtitle: 'SpO2',
        value: report.measurementData.ppgMetrics?.spo2?.value || 92,
        normalRange: { min: 95, max: 100 },
        unit: '%',
        status: getMetricStatus(report.measurementData.ppgMetrics?.spo2?.value || 92, { min: 95, max: 100 }),
        normalRangeText: '95-100%',
        currentState: '정상 범위 미달 - 산소 공급 부족 (의료진 상담 권장)',
        interpretation: physicalHealthComprehensive?.individualMetricsInterpretation?.spo2?.interpretation || 
                        report.measurementData.ppgMetrics?.spo2?.interpretation || 
                        '혈액 내 산소 포화도로 호흡 및 순환 기능을 평가합니다. 현재 수치는 정상 범위에 있어 적절한 산소 공급이 이루어지고 있습니다.',
        customLabels: { low: '부족', normal: '정상', high: '과포화' }
      },
      // 두 번째 행: 심박변이도 RMSSD | 심박변이도 SDNN
      {
        id: 'rmssd',
        title: '심박변이도 RMSSD',
        subtitle: 'RMSSD',
        value: report.measurementData.ppgMetrics?.rmssd?.value || 229,
        normalRange: { min: 20, max: 50 },
        unit: 'ms',
        status: getMetricStatus(report.measurementData.ppgMetrics?.rmssd?.value || 229, { min: 20, max: 50 }),
        normalRangeText: '20-50 ms',
        currentState: '정상 범위 초과 - 매우 활발한 부교감신경 활동',
        interpretation: physicalHealthComprehensive?.individualMetricsInterpretation?.rmssd?.interpretation || 
                        report.measurementData.ppgMetrics?.rmssd?.interpretation || 
                        '연속된 심박 간격의 변이를 측정하여 부교감신경 활성도와 스트레스 회복 능력을 평가합니다. 현재 RMSSD 수치는 우수한 자율신경 균형을 나타냅니다.',
        customLabels: { low: '낮음', normal: '양호', high: '높음' }
      },
      {
        id: 'sdnn',
        title: '심박변이도 SDNN',
        subtitle: 'SDNN',
        value: report.measurementData.ppgMetrics?.sdnn?.value || 188,
        normalRange: { min: 30, max: 100 },
        unit: 'ms',
        status: getMetricStatus(report.measurementData.ppgMetrics?.sdnn?.value || 188, { min: 30, max: 100 }),
        normalRangeText: '30-100 ms',
        currentState: '정상 범위 초과 - 매우 높은 자율신경 활성도',
        interpretation: physicalHealthComprehensive?.individualMetricsInterpretation?.sdnn?.interpretation || 
                        report.measurementData.ppgMetrics?.sdnn?.interpretation || 
                        '전체 심박변이도를 나타내며, 자율신경계의 전반적인 건강 상태를 평가합니다. 현재 SDNN 수치는 매우 건강한 자율신경 기능을 보여줍니다.',
        customLabels: { low: '낮음', normal: '양호', high: '높음' }
      },
      // 세 번째 행: LF Power | HF Power
      {
        id: 'lfPower',
        title: 'LF Power',
        subtitle: '저주파 성분',
        value: report.measurementData.ppgMetrics?.lfPower?.value || 14863.64,
        normalRange: { min: 500, max: 20000 },
        unit: 'ms²',
        status: getMetricStatus(report.measurementData.ppgMetrics?.lfPower?.value || 14863.64, { min: 500, max: 20000 }),
        normalRangeText: '500-20000 ms²',
        currentState: '정상 범위 - 양호한 교감신경 활동',
        interpretation: report.measurementData.ppgMetrics?.lfPower?.interpretation || 
                        '교감신경 활성도를 반영하며, 스트레스 반응과 혈압 조절 능력을 나타냅니다. 현재 LF Power는 건강한 교감신경 기능을 보여줍니다.',
        customLabels: { low: '낮음', normal: '양호', high: '높음' }
      },
      {
        id: 'hfPower',
        title: 'HF Power',
        subtitle: '고주파 성분',
        value: report.measurementData.ppgMetrics?.hfPower?.value || 1708.49,
        normalRange: { min: 200, max: 5000 },
        unit: 'ms²',
        status: getMetricStatus(report.measurementData.ppgMetrics?.hfPower?.value || 1708.49, { min: 200, max: 5000 }),
        normalRangeText: '200-5000 ms²',
        currentState: '정상 범위 - 양호한 부교감신경 활동',
        interpretation: report.measurementData.ppgMetrics?.hfPower?.interpretation || 
                        '부교감신경 활성도를 반영하며, 휴식 및 회복 능력을 나타냅니다. 현재 HF Power는 양호한 부교감신경 기능을 보여줍니다.',
        customLabels: { low: '낮음', normal: '양호', high: '높음' }
      },
      // 네 번째 행: 자율신경 균형 (단독)
      {
        id: 'lfHfRatio',
        title: '자율신경 균형',
        subtitle: 'LF/HF Ratio',
        value: report.measurementData.ppgMetrics?.lfHfRatio?.value || 8.70,
        normalRange: { min: 1.0, max: 10.0 },
        unit: '',
        status: getMetricStatus(report.measurementData.ppgMetrics?.lfHfRatio?.value || 8.70, { min: 1.0, max: 10.0 }),
        normalRangeText: '1.0-10.0',
        currentState: '정상 범위 - 균형잡힌 자율신경 활동',
        interpretation: physicalHealthComprehensive?.individualMetricsInterpretation?.lfHfRatio?.interpretation || 
                        report.measurementData.ppgMetrics?.lfHfRatio?.interpretation || 
                        '교감신경과 부교감신경의 균형을 나타내며, 스트레스 대응 능력을 평가합니다. 현재 자율신경 균형은 적절한 상태를 유지하고 있습니다.',
        customLabels: { low: '부교감우세', normal: '균형', high: '교감우세' }
      }
    ];

    return ppgMetrics;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {personalInfo.name}님의 건강 리포트
                {isCurrentAnalysis && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    현재 분석
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {formatDate(report.timestamp)}
              </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                    {personalInfo.age}세
                  </Badge>
                  <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                    {personalInfo.gender === 'male' ? '남성' : '여성'}
                  </Badge>
                  <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">
                    {getOccupationLabel(personalInfo.occupation)}
                  </Badge>
            </div>
          </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 🆕 EEG 상세 분석 버튼 */}
            {showEEGButton && onViewEEGAnalysis && (
              <Button
                onClick={onViewEEGAnalysis}
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Brain className="h-4 w-4" />
                EEG 상세
              </Button>
            )}
            
            {/* 🆕 PPG 상세 분석 버튼 */}
            {showPPGButton && onViewPPGAnalysis && (
              <Button
                onClick={onViewPPGAnalysis}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <Heart className="h-4 w-4" />
                PPG 상세
              </Button>
            )}
            
            {/* 🆕 저장 버튼 */}
            {showSaveButton && onSave && (
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    {saveSuccess ? '저장됨' : '저장'}
                  </>
                )}
              </Button>
            )}
            
            {/* 🆕 공유 버튼 */}
            {showShareButton && onShare && (
              <Button
                onClick={onShare}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                공유
              </Button>
            )}
            
          <Button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4" />
            {downloadingPDF ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </Button>
          </div>
        </div>

        {/* 1단계: 전체 건강 개요 */}
        <OverallHealthReport
          report={report}
          analysisResult={analysisResult}
          isExpanded={expandedSections.overview}
          onToggleExpanded={() => setExpandedSections(prev => ({
            ...prev,
            overview: !prev.overview
          }))}
          EEGMetricChart={EEGMetricChart}
        />


        {/* 2단계: 상세 분석 결과 */}
        <EEGPPGDetailAnalysisReport
          report={report}
          analysisResult={analysisResult}
          isExpanded={expandedSections.analysis}
          onToggleExpanded={() => setExpandedSections(prev => ({
            ...prev,
            analysis: !prev.analysis
          }))}
          EEGMetricChart={EEGMetricChart}
          getScoreBadgeColor={getScoreBadgeColor}
          getOccupationLabel={getOccupationLabel}
          ScoreDistributionBar={ScoreDistributionBar}
          mentalHealthComprehensive={mentalHealthComprehensive}
          physicalHealthComprehensive={physicalHealthComprehensive}
          loadingComprehensive={loadingComprehensive}
          preparePPGMetrics={preparePPGMetrics}
          getMetricStatus={getMetricStatus}
          getEEGCardBackgroundClass={getEEGCardBackgroundClass}
        />


        {/* 3단계: 정신 건강 위험도 분석 */}
        <MentalHealthRiskReport
          report={report}
          analysisResult={analysisResult}
          isExpanded={expandedSections.mentalHealthRisk}
          onToggleExpanded={() => setExpandedSections(prev => ({
            ...prev,
            mentalHealthRisk: !prev.mentalHealthRisk
          }))}
          MentalHealthRiskChart={MentalHealthRiskChart}
        />

        {/* 4단계: 의학적 위험도 분석 */}
        <MedicalRiskAnalysisReport
          report={report}
          analysisResult={analysisResult}
          isExpanded={expandedSections.medicalRiskAnalysis}
          onToggleExpanded={() => setExpandedSections(prev => ({
            ...prev,
            medicalRiskAnalysis: !prev.medicalRiskAnalysis
          }))}
        />

        <PersonalizedRecommendationsReport
          report={report}
          analysisResult={analysisResult}
          isExpanded={expandedSections.recommendations}
          onToggleExpanded={() => setExpandedSections(prev => ({
            ...prev,
            recommendations: !prev.recommendations
          }))}
        />
      </div>
    </div>
  );
};

export default ReportDetailViewer;
