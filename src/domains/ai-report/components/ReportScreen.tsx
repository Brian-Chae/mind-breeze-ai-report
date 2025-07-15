import React, { useState, useCallback } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';
import { 
  FileText, Download, Share2, RotateCcw, CheckCircle2, 
  AlertTriangle, Brain, Heart, TrendingUp, Star 
} from 'lucide-react';

import type { AIAnalysisResponse } from '../types';

interface ReportScreenProps {
  analysisResult: AIAnalysisResponse;
  onRestart: () => void;
  onClose?: () => void;
}

export function ReportScreen({ analysisResult, onRestart, onClose }: ReportScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const handleDownload = useCallback(() => {
    // TODO: PDF 다운로드 기능 구현
    console.log('Downloading report...', analysisResult.reportId);
  }, [analysisResult.reportId]);

  const handleShare = useCallback(() => {
    // TODO: 공유 기능 구현
    console.log('Sharing report...', analysisResult.reportId);
  }, [analysisResult.reportId]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          AI Health Report 완성!
        </h2>
        <p className="text-gray-600">
          {analysisResult.personalInfo.name}님의 건강 상태 분석이 완료되었습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4 border-b">
            {[
              { key: 'overview', label: '요약', icon: TrendingUp },
              { key: 'detailed', label: '상세 분석', icon: Brain },
              { key: 'recommendations', label: '권장사항', icon: Star }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center space-x-2 pb-2 px-4 border-b-2 transition-colors
                  ${activeTab === tab.key 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 요약 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 전체 점수 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                건강 점수 요약
                <Badge variant={analysisResult.reliability === 'high' ? 'default' : 'secondary'}>
                  {analysisResult.reliability === 'high' ? '높은 신뢰도' : '보통 신뢰도'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 정신 건강 점수 */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisResult.analysisResults.mentalHealthScore / 100)}`}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(analysisResult.analysisResults.mentalHealthScore)}`}>
                        {analysisResult.analysisResults.mentalHealthScore}
                      </span>
                      <span className="text-xs text-gray-500">점</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">정신 건강</h3>
                  <p className="text-sm text-gray-600">뇌파 기반 분석</p>
                </div>

                {/* 신체 건강 점수 */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisResult.analysisResults.physicalHealthScore / 100)}`}
                        className="text-green-500 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(analysisResult.analysisResults.physicalHealthScore)}`}>
                        {analysisResult.analysisResults.physicalHealthScore}
                      </span>
                      <span className="text-xs text-gray-500">점</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">신체 건강</h3>
                  <p className="text-sm text-gray-600">심박 기반 분석</p>
                </div>

                {/* 스트레스 레벨 */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisResult.analysisResults.stressLevel / 100)}`}
                        className="text-red-500 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(100 - analysisResult.analysisResults.stressLevel)}`}>
                        {analysisResult.analysisResults.stressLevel}
                      </span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">스트레스</h3>
                  <p className="text-sm text-gray-600">복합 지표 분석</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 리포트 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>리포트 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">리포트 ID:</span>
                  <span className="ml-2 font-mono">{analysisResult.reportId}</span>
                </div>
                <div>
                  <span className="text-gray-600">생성 일시:</span>
                  <span className="ml-2">{analysisResult.generatedAt.toLocaleString('ko-KR')}</span>
                </div>
                <div>
                  <span className="text-gray-600">분석 대상:</span>
                  <span className="ml-2">{analysisResult.personalInfo.name}님</span>
                </div>
                <div>
                  <span className="text-gray-600">신뢰도:</span>
                  <span className={`ml-2 font-medium ${getReliabilityColor(analysisResult.reliability)}`}>
                    {analysisResult.reliability === 'high' ? '높음' : '보통'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 상세 분석 탭 */}
      {activeTab === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              상세 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {analysisResult.analysisResults.detailedAnalysis}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 권장사항 탭 */}
      {activeTab === 'recommendations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              AI 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.analysisResults.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-blue-800 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          PDF 다운로드
        </Button>
        <Button onClick={handleShare} variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          공유하기
        </Button>
        <Button onClick={onRestart} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          새로 측정
        </Button>
        {onClose && (
          <Button onClick={onClose}>
            완료
          </Button>
        )}
      </div>
    </div>
  );
} 