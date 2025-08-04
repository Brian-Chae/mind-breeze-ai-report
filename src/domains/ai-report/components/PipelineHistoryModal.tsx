/**
 * 파이프라인 실행 이력 모달
 * 조직의 모든 파이프라인 실행 이력을 표시
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Input } from '@ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import { Card, CardContent } from '@ui/card';
import { 
  Brain, 
  Heart, 
  Sparkles, 
  Clock,
  Calendar,
  User,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { pipelineReportService, PipelineReport } from '../services/PipelineReportService';
import { cn } from '@shared/components/ui/utils';

interface PipelineHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onViewReport?: (report: PipelineReport) => void;
}

export const PipelineHistoryModal: React.FC<PipelineHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  organizationId,
  onViewReport 
}) => {
  const [reports, setReports] = useState<PipelineReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PipelineReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 파이프라인 리포트 목록 로드
  useEffect(() => {
    if (isOpen && organizationId) {
      loadReports();
    }
  }, [isOpen, organizationId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const loadedReports = await pipelineReportService.getPipelineReportsByOrganization(
        organizationId,
        50 // 최대 50개까지 로드
      );
      setReports(loadedReports);
      setFilteredReports(loadedReports);
    } catch (error) {
      console.error('파이프라인 리포트 로드 실패:', error);
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링 로직
  useEffect(() => {
    let filtered = [...reports];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.metadata.status === statusFilter);
    }

    setFilteredReports(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [searchTerm, statusFilter, reports]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // 상태에 따른 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            파이프라인 실행 이력
          </DialogTitle>
        </DialogHeader>

        {/* 필터 섹션 */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="이름 또는 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="error">오류</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '새로고침'
            )}
          </Button>
        </div>

        {/* 리포트 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : currentReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? '검색 결과가 없습니다.' 
                : '파이프라인 실행 이력이 없습니다.'}
            </div>
          ) : (
            currentReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* 기본 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {report.personalInfo?.name || '익명'}
                        </h3>
                        <Badge className={cn('text-xs', getStatusColor(report.metadata.status))}>
                          {report.metadata.status === 'completed' ? '완료' : '오류'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.round(report.metadata.totalDuration / 1000)}초
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {report.personalInfo?.age}세 {report.personalInfo?.gender === 'male' ? '남성' : '여성'}
                        </div>
                      </div>
                    </div>

                    {/* 분석 단계 표시 */}
                    <div className="flex items-center gap-2 mx-6">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        report.eegAnalysisId ? "bg-purple-100" : "bg-gray-100"
                      )}>
                        <Brain className={cn(
                          "w-5 h-5",
                          report.eegAnalysisId ? "text-purple-600" : "text-gray-400"
                        )} />
                      </div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        report.ppgAnalysisId ? "bg-red-100" : "bg-gray-100"
                      )}>
                        <Heart className={cn(
                          "w-5 h-5",
                          report.ppgAnalysisId ? "text-red-600" : "text-gray-400"
                        )} />
                      </div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        report.integratedAnalysisId ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        <Sparkles className={cn(
                          "w-5 h-5",
                          report.integratedAnalysisId ? "text-blue-600" : "text-gray-400"
                        )} />
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div>
                      {report.metadata.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewReport?.(report)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          보기
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 건강 점수 (있을 경우) */}
                  {report.integratedAnalysisResult?.overallSummary?.healthScore && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">종합 건강 점수</span>
                        <span className={cn(
                          "text-lg font-bold",
                          report.integratedAnalysisResult.overallSummary.healthScore >= 80 
                            ? "text-green-600" 
                            : report.integratedAnalysisResult.overallSummary.healthScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}>
                          {report.integratedAnalysisResult.overallSummary.healthScore}점
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const distance = Math.abs(page - currentPage);
                  return distance <= 2 || page === 1 || page === totalPages;
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 요약 정보 */}
        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-around text-sm">
          <div className="text-center">
            <p className="text-gray-600">전체 실행</p>
            <p className="font-semibold text-lg">{reports.length}건</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">성공률</p>
            <p className="font-semibold text-lg text-green-600">
              {reports.length > 0 
                ? Math.round((reports.filter(r => r.metadata.status === 'completed').length / reports.length) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">평균 소요 시간</p>
            <p className="font-semibold text-lg">
              {reports.length > 0
                ? Math.round(reports.reduce((sum, r) => sum + r.metadata.totalDuration, 0) / reports.length / 1000)
                : 0}초
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};