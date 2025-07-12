/**
 * AI Health Report 히스토리 화면
 * - 저장된 리포트 목록 표시
 * - 검색 및 필터링 기능
 * - 리포트 상세 보기, 삭제, 내보내기 기능
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar,
  TrendingUp,
  User,
  FileText,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

import useReportHistory from '../hooks/useReportHistory';
import { StoredReport, ReportSearchFilter } from '../services/ReportStorage';
import usePerformanceOptimization from '../hooks/usePerformanceOptimization';
import ReportHistoryManager from './ReportHistoryManager';
import ReportDetailViewer from './ReportDetailViewer';
import PDFReportService from '../services/PDFReportService';
import { toast } from 'sonner';

interface HistoryScreenProps {
  onViewReport: (reportId: string) => void;
  onBackToHome: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onViewReport,
  onBackToHome
}) => {
  const {
    reports,
    stats,
    isLoading,
    isSearching,
    isDeleting,
    error,
    searchReports,
    deleteReport,
    exportReports,
    importReports,
    clearError,
    resetSearch
  } = useReportHistory();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'high' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [viewingReport, setViewingReport] = useState<StoredReport | null>(null);

  // 성능 최적화 훅
  const { 
    memoizedReportAnalysis, 
    debounce, 
    calculateVirtualization,
    measureRenderTime 
  } = usePerformanceOptimization({
    enableVirtualization: true,
    enableMemoization: true,
    maxCacheSize: 50
  });

  // PDF 서비스 인스턴스
  const pdfService = PDFReportService.getInstance();

  // 검색 실행
  const executeSearch = async () => {
    if (!searchKeyword.trim()) {
      await resetSearch();
      return;
    }

    const filter: ReportSearchFilter = {
      keywords: searchKeyword.trim()
    };

    await searchReports(filter);
  };

  // 디바운스된 검색
  const debouncedSearch = debounce(executeSearch, 300);

  // 메모이제이션된 리포트 분석
  const reportAnalysis = memoizedReportAnalysis(reports);

  // 필터링된 리포트 목록
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // 키워드 검색
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(report => 
        report.personalInfo.name.toLowerCase().includes(keyword) ||
        report.analysisResult.overallHealth.summary.toLowerCase().includes(keyword) ||
        report.analysisResult.detailedAnalysis.mentalHealth.analysis.toLowerCase().includes(keyword) ||
        report.analysisResult.detailedAnalysis.physicalHealth.analysis.toLowerCase().includes(keyword)
      );
    }

    // 카테고리 필터
    switch (selectedFilter) {
      case 'recent':
        // 최근 7일
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(report => report.timestamp > weekAgo);
        break;
      case 'high':
        // 높은 점수 (80점 이상)
        filtered = filtered.filter(report => report.analysisResult.overallHealth.score >= 80);
        break;
      case 'low':
        // 낮은 점수 (60점 미만)
        filtered = filtered.filter(report => report.analysisResult.overallHealth.score < 60);
        break;
    }

    return filtered;
  }, [reports, searchKeyword, selectedFilter]);

  // 고급 필터 적용
  const handleAdvancedFilter = async (filter: ReportSearchFilter) => {
    await searchReports(filter);
    setShowFilters(false);
  };

  // 리포트 삭제
  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('이 리포트를 삭제하시겠습니까?')) {
      await deleteReport(reportId);
    }
  };

  // 다중 삭제
  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;
    
    if (window.confirm(`선택한 ${selectedReports.length}개 리포트를 삭제하시겠습니까?`)) {
      for (const reportId of selectedReports) {
        await deleteReport(reportId);
      }
      setSelectedReports([]);
    }
  };

  // 내보내기
  const handleExport = async () => {
    try {
      const exportData = await exportReports();
      if (exportData) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-health-reports-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('내보내기 실패:', error);
    }
  };

  // 가져오기
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCount = await importReports(text);
      toast.success(`${importedCount}개 리포트를 가져왔습니다.`);
    } catch (error) {
      console.error('가져오기 실패:', error);
      toast.error('파일을 가져오는데 실패했습니다.');
    }
  };

  // 🆕 리포트 상세 보기 핸들러
  const handleViewReportDetail = (report: StoredReport) => {
    setViewingReport(report);
  };

  // 🆕 리포트 상세 보기에서 돌아가기
  const handleBackToList = () => {
    setViewingReport(null);
  };

  // 🆕 PDF 다운로드 핸들러
  const handleDownloadPDF = async (report: StoredReport) => {
    try {
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
    }
  };

  // 데이터베이스 리셋 (개발/디버깅 용도)
  const handleResetDatabase = async () => {
    if (window.confirm('⚠️ 모든 리포트 데이터가 삭제됩니다. 정말로 데이터베이스를 리셋하시겠습니까?')) {
      try {
        const storage = (await import('../services/ReportStorage')).default.getInstance();
        await storage.resetDatabase();
        
        // 로컬 스토리지도 초기화
        localStorage.removeItem('ai_health_reports');
        
        // 페이지 새로고침으로 완전한 재초기화
        alert('✅ 데이터베이스가 리셋되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
        
      } catch (error) {
        console.error('데이터베이스 리셋 실패:', error);
        alert('데이터베이스 리셋에 실패했습니다. 페이지를 새로고침해주세요.');
        window.location.reload();
      }
    }
  };

  // 점수에 따른 색상 반환
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 점수에 따른 배지 색상 반환
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // 리포트 상세 보기 화면
  if (viewingReport) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-6xl mx-auto">
          <ReportDetailViewer
            report={viewingReport}
            onBack={handleBackToList}
            className="text-white"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBackToHome}
              className="text-gray-400 hover:text-white"
            >
              ← 홈으로
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">건강 리포트 히스토리</h1>
              <p className="text-gray-400">저장된 건강 분석 리포트를 확인하세요</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || reports.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                가져오기
              </Button>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetDatabase}
              className="text-xs"
              title="개발/디버깅 용도 - 모든 데이터 삭제"
            >
              <XCircle className="w-4 h-4 mr-2" />
              DB 리셋
            </Button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
                닫기
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">총 리포트</p>
                    <p className="text-2xl font-bold text-white">{stats.totalReports}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">평균 점수</p>
                    <p className="text-2xl font-bold text-white">{stats.averageScore}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">최근 측정</p>
                    <p className="text-sm font-medium text-white">
                      {stats.latestReport ? 
                        format(new Date(stats.latestReport.timestamp), 'MM/dd HH:mm', { locale: ko }) : 
                        '없음'
                      }
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">저장 용량</p>
                    <p className="text-sm font-medium text-white">
                      {(stats.storageUsed / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 🆕 새로운 리포트 히스토리 매니저 사용 */}
        <ReportHistoryManager
          onViewReport={handleViewReportDetail}
          onDownloadPDF={handleDownloadPDF}
          className="bg-gray-900 border-gray-700 text-white"
        />
      </div>
    </div>
  );
};

export default HistoryScreen; 