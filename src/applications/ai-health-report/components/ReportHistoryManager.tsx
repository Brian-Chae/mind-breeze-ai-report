import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { StoredReport, ReportSearchFilter } from '../services/ReportStorage';
import ReportStorage from '../services/ReportStorage';
import { toast } from 'sonner';

interface ReportHistoryManagerProps {
  onViewReport: (report: StoredReport) => void;
  onDownloadPDF: (report: StoredReport) => void;
  className?: string;
}

const ReportHistoryManager: React.FC<ReportHistoryManagerProps> = ({
  onViewReport,
  onDownloadPDF,
  className = ''
}) => {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<StoredReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [selectedScoreRange, setSelectedScoreRange] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const reportStorage = ReportStorage.getInstance();

  // 리포트 목록 로드
  useEffect(() => {
    loadReports();
  }, []);

  // 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [reports, searchKeyword, selectedDateRange, selectedScoreRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const allReports = await reportStorage.getAllReports();
      setReports(allReports);
      console.log(`📋 ${allReports.length}개의 리포트를 로드했습니다.`);
    } catch (error) {
      console.error('리포트 로드 실패:', error);
      toast.error('리포트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // 검색어 필터링
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(report => 
        report.personalInfo.name.toLowerCase().includes(keyword) ||
        getOccupationLabel(report.personalInfo.occupation).toLowerCase().includes(keyword) ||
        report.analysisResult.overallHealth.summary.toLowerCase().includes(keyword) ||
        (report.notes && report.notes.toLowerCase().includes(keyword))
      );
    }

    // 날짜 범위 필터링
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (selectedDateRange) {
        case '7days':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(report => new Date(report.timestamp) >= cutoffDate);
    }

    // 점수 범위 필터링
    if (selectedScoreRange !== 'all') {
      filtered = filtered.filter(report => {
        const score = report.analysisResult.overallHealth.score;
        switch (selectedScoreRange) {
          case 'high':
            return score >= 80;
          case 'medium':
            return score >= 60 && score < 80;
          case 'low':
            return score < 60;
          default:
            return true;
        }
      });
    }

    // 최신순 정렬
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredReports(filtered);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('이 리포트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const success = await reportStorage.deleteReport(reportId);
      if (success) {
        toast.success('리포트가 삭제되었습니다.');
        await loadReports();
      } else {
        toast.error('리포트 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('리포트 삭제 실패:', error);
      toast.error('리포트 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">리포트 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 검색 및 필터 섹션 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-800/50 transition-colors border-b border-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Search className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">검색 및 필터</CardTitle>
                  <p className="text-sm text-gray-400">총 {filteredReports.length}개의 리포트</p>
                </div>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="p-6 space-y-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="이름, 직업, 분석 결과로 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>

              {/* 필터 옵션 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 날짜 범위 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    날짜 범위
                  </label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value as any)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">전체 기간</option>
                    <option value="7days">최근 7일</option>
                    <option value="30days">최근 30일</option>
                    <option value="90days">최근 90일</option>
                  </select>
                </div>

                {/* 점수 범위 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    건강 점수
                  </label>
                  <select
                    value={selectedScoreRange}
                    onChange={(e) => setSelectedScoreRange(e.target.value as any)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">전체 점수</option>
                    <option value="high">우수 (80-100점)</option>
                    <option value="medium">보통 (60-79점)</option>
                    <option value="low">주의 (0-59점)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 리포트 목록 */}
        {filteredReports.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {reports.length === 0 ? '저장된 리포트가 없습니다' : '검색 결과가 없습니다'}
              </h3>
              <p className="text-gray-400">
                {reports.length === 0 
                  ? 'AI 건강 분석을 완료하면 리포트가 자동으로 저장됩니다.' 
                  : '다른 검색어나 필터를 사용해보세요.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-white">
                            {report.personalInfo.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {getOccupationLabel(report.personalInfo.occupation)}
                        </Badge>
                        <Badge className={getScoreBadgeColor(report.analysisResult.overallHealth.score)}>
                          {report.analysisResult.overallHealth.score}점
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.timestamp)}
                      </div>
                      
                      <p className="text-gray-300 line-clamp-2 mb-3">
                        {report.analysisResult.overallHealth.summary}
                      </p>
                      
                      {report.notes && (
                        <p className="text-sm text-gray-400 italic">
                          메모: {report.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => onViewReport(report)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500"
                      >
                        <Eye className="h-4 w-4" />
                        보기
                      </Button>
                      <Button
                        onClick={() => onDownloadPDF(report)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => handleDeleteReport(report.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHistoryManager; 