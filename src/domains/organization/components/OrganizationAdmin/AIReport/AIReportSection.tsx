import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Plus, Eye, Download, Send, Search, Filter, CheckCircle, AlertCircle, Clock, Star, BarChart3, FileText, User, Calendar, TrendingUp, MoreHorizontal, Edit, Trash2, Play, Pause, RefreshCw, Loader2, Activity, Monitor, Share2, Copy, Link, DollarSign, Briefcase, Building, Mail, UserCheck, X, Info } from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { FirebaseService } from '@core/services/FirebaseService'
import creditManagementService from '@domains/organization/services/CreditManagementService'
import measurementUserManagementService from '@domains/individual/services/MeasurementUserManagementService'
import measurementUserIntegrationService from '@domains/individual/services/MeasurementUserIntegrationService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { MeasurementDataService } from '@domains/ai-report/services/MeasurementDataService'
import { processedDataStorageService } from '@domains/ai-report/services/ProcessedDataStorageService'
import { BasicGeminiV1Engine } from '@domains/ai-report/ai-engines/BasicGeminiV1Engine'
import { useAIReportConfiguration } from '@domains/ai-report/hooks/useAvailableEnginesAndViewers'
import { ReportViewerModal } from '@domains/ai-report/components'
import { rendererRegistry } from '@domains/ai-report/core/registry/RendererRegistry'
import { findCompatibleRenderers, getRecommendedRenderers } from '@domains/ai-report/core/utils/EngineRendererMatcher'
import { initializeRenderers } from '@domains/ai-report/report-renderers'
import customRendererService from '@domains/ai-report/services/CustomRendererService'
import reportSharingService from '@domains/ai-report/services/ReportSharingService'

interface AIReportSectionProps {
  subSection: string;
  onNavigate: (section: string, subSection?: string) => void;
}

// 측정 데이터 상세 보기 컴포넌트
interface MeasurementDataDetailViewProps {
  data: any;
}

const MeasurementDataDetailView: React.FC<MeasurementDataDetailViewProps> = ({ data }) => {
  const formatValue = (value: any, decimals: number = 2) => {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    return value?.toString() || 'N/A';
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('ko-KR');
  };

  // 시계열 데이터 통계 계산 함수
  const calculateStatistics = (timeSeries: number[] | undefined) => {
    if (!timeSeries || timeSeries.length === 0) {
      return { mean: 0, variance: 0, std: 0, min: 0, max: 0, count: 0 };
    }
    
    const n = timeSeries.length;
    const mean = timeSeries.reduce((sum, val) => sum + val, 0) / n;
    const variance = timeSeries.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    const min = Math.min(...timeSeries);
    const max = Math.max(...timeSeries);
    
    return { mean, variance, std, min, max, count: n };
  };

  return (
    <div className="space-y-4">
      {/* 디버그 정보 */}
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs">
        <strong className="text-gray-700">디버그 정보:</strong> 
        <span className={data.processedTimeSeries ? 'text-green-600' : 'text-red-600'}>
          processedTimeSeries: {data.processedTimeSeries ? '있음' : '없음'}
        </span>
        {data.processedTimeSeries && (
          <span className="text-green-600">
            {' '}(EEG: {data.processedTimeSeries.eeg?.timestamps?.length || 0}개,
            {' '}PPG: {data.processedTimeSeries.ppg?.heartRate?.length || 0}개,
            {' '}ACC: {data.processedTimeSeries.acc?.activityLevel?.length || 0}개)
          </span>
        )}
        <span className="text-gray-500 ml-2">
          | 데이터 타입: {typeof data}, 키 개수: {Object.keys(data).length}
        </span>
        <div className="mt-2 text-xs text-gray-600">
          <strong>전체 키 목록:</strong> {Object.keys(data).join(', ')}
        </div>
        {Object.keys(data).includes('processedTimeSeries') && (
          <div className="mt-1 text-xs text-orange-600">
            <strong>processedTimeSeries 내용:</strong> {JSON.stringify(data.processedTimeSeries, null, 2).substring(0, 200)}...
          </div>
        )}
      </div>
      
      {/* 기본 정보 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          기본 정보
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">사용자명</span>
            <p className="font-semibold text-gray-900">{data.userName || data.subjectName || 'N/A'}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">측정일시</span>
            <p className="font-semibold text-gray-900 text-sm">{formatDate(data.timestamp || data.measurementDate || data.sessionDate)}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">측정 시간</span>
            <p className="font-semibold text-gray-900">{data.duration || 60}초</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">전체 품질</span>
            <p className="font-semibold text-green-600">{formatValue(data.overallQuality || data.qualityScore || data.dataQuality?.overallScore || 'N/A')}{data.overallQuality || data.qualityScore || data.dataQuality?.overallScore ? '%' : ''}</p>
          </div>
        </div>
      </div>

      {/* EEG 데이터 */}
      {data.eegMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
            <Brain className="w-5 h-5 mr-2 text-blue-600" />
            EEG 뇌파 분석 결과
          </h3>
          
          {/* 주요 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-blue-500">
              <span className="text-xs text-gray-500 block mb-1">집중도</span>
              <p className="font-bold text-blue-700 text-lg">{formatValue(data.eegMetrics.attentionIndex)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-green-500">
              <span className="text-xs text-gray-500 block mb-1">명상도</span>
              <p className="font-bold text-green-700 text-lg">{formatValue(data.eegMetrics.meditationIndex)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border-l-4 border-red-500">
              <span className="text-xs text-gray-500 block mb-1">스트레스 지수</span>
              <p className="font-bold text-red-700 text-lg">{formatValue(data.eegMetrics.stressIndex)}</p>
            </div>
          </div>
          
          {/* 뇌파 파워 */}
          <div className="bg-white p-3 rounded-md shadow-sm">
            <h4 className="font-medium mb-3 text-gray-700">뇌파 파워 분석</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Delta</span>
                <p className="font-semibold text-purple-600">{formatValue(data.eegMetrics.delta)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Theta</span>
                <p className="font-semibold text-blue-600">{formatValue(data.eegMetrics.theta)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Alpha</span>
                <p className="font-semibold text-green-600">{formatValue(data.eegMetrics.alpha)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Beta</span>
                <p className="font-semibold text-orange-600">{formatValue(data.eegMetrics.beta)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Gamma</span>
                <p className="font-semibold text-red-600">{formatValue(data.eegMetrics.gamma)}</p>
              </div>
            </div>
          </div>
          
          {/* 신호 품질 */}
          <div className="mt-3 bg-white p-3 rounded-md shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">신호 품질</span>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (data.eegMetrics.signalQuality || 0) * 100)}%` }}
                ></div>
              </div>
              <p className="font-semibold text-green-600 text-sm">{formatValue((data.eegMetrics.signalQuality || 0) * 100)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* PPG 데이터 */}
      {data.ppgMetrics && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-red-800">
            <Activity className="w-5 h-5 mr-2 text-red-600" />
            PPG 심박 분석 결과
          </h3>
          
          {/* 주요 심박 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-4 rounded-md shadow-sm border-l-4 border-red-500">
              <span className="text-xs text-gray-500 block mb-1">심박수</span>
              <div className="flex items-end space-x-1">
                <p className="font-bold text-red-700 text-2xl">{formatValue(data.ppgMetrics.heartRate)}</p>
                <span className="text-sm text-gray-600 mb-1">BPM</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border-l-4 border-blue-500">
              <span className="text-xs text-gray-500 block mb-1">심박 변이도 (HRV)</span>
              <div className="flex items-end space-x-1">
                <p className="font-bold text-blue-700 text-2xl">{formatValue(data.ppgMetrics.heartRateVariability)}</p>
                <span className="text-sm text-gray-600 mb-1">ms</span>
              </div>
            </div>
          </div>
          
          {/* 추가 지표들 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">스트레스 점수</span>
              <p className="font-semibold text-orange-600">{formatValue(data.ppgMetrics.stressScore)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">자율신경 균형</span>
              <p className="font-semibold text-green-600">{formatValue(data.ppgMetrics.autonomicBalance)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">신호 품질</span>
              <p className="font-semibold text-green-600">{formatValue((data.ppgMetrics.signalQuality || 0) * 100)}%</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">움직임 노이즈</span>
              <p className="font-semibold text-red-600">{formatValue((data.ppgMetrics.motionArtifact || 0) * 100)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ACC 데이터 */}
      {data.accMetrics && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-green-800">
            <Monitor className="w-5 h-5 mr-2 text-green-600" />
            가속도계 분석 결과
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">활동 수준</span>
              <p className="font-semibold text-green-600 text-lg">{formatValue(data.accMetrics.activityLevel)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">움직임 강도</span>
              <p className="font-semibold text-blue-600 text-lg">{formatValue(data.accMetrics.movementIntensity)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">자세 안정성</span>
              <p className="font-semibold text-purple-600 text-lg">{formatValue(data.accMetrics.postureStability)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">자세</span>
              <p className="font-semibold text-gray-700">{data.accMetrics.posture || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 시계열 데이터 상세 통계 */}
      {(data.processedTimeSeries || data.timeSeriesData) && (
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-purple-800">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            시계열 데이터 저장 상태 및 통계
            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
              1분간 초단위 수집
            </Badge>
          </h3>
          
          {/* 데이터 저장 상태 개요 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-3 rounded-md shadow-sm text-center border-l-4 border-purple-500">
              <span className="text-xs text-gray-500 block mb-1">전체 데이터 포인트</span>
              <p className="font-bold text-purple-700 text-lg">{
                data.processedTimeSeries?.eeg?.timestamps?.length || 
                data.timeSeriesData?.eeg?.timestamps?.length || 
                0
              }</p>
              <span className="text-xs text-gray-400">개</span>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center border-l-4 border-blue-500">
              <span className="text-xs text-gray-500 block mb-1">측정 시간</span>
              <p className="font-bold text-blue-700 text-lg">{
                data.processedTimeSeries?.duration || 
                data.timeSeriesData?.duration || 
                data.duration ||
                60
              }</p>
              <span className="text-xs text-gray-400">초</span>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center border-l-4 border-green-500">
              <span className="text-xs text-gray-500 block mb-1">전체 품질</span>
              <p className="font-bold text-green-700 text-lg">{formatValue(
                data.processedTimeSeries?.metadata?.qualityScore || 
                data.timeSeriesData?.metadata?.qualityScore ||
                data.dataQuality?.overallScore ||
                85
              )}</p>
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center border-l-4 border-orange-500">
              <span className="text-xs text-gray-500 block mb-1">샘플링 레이트</span>
              <p className="font-semibold text-orange-700 text-sm">EEG: {
                data.processedTimeSeries?.metadata?.samplingRate?.eeg || 256
              }Hz</p>
              <p className="font-semibold text-orange-600 text-xs">PPG: {
                data.processedTimeSeries?.metadata?.samplingRate?.ppg || 64
              }Hz</p>
            </div>
          </div>

          {/* EEG 시계열 데이터 통계 */}
          {(data.processedTimeSeries?.eeg || data.timeSeriesData?.eeg) && (() => {
            const eegData = data.processedTimeSeries?.eeg || data.timeSeriesData?.eeg;
            const focusStats = calculateStatistics(eegData.focusIndex);
            const relaxStats = calculateStatistics(eegData.relaxationIndex);
            const stressStats = calculateStatistics(eegData.stressIndex);
            const attentionStats = calculateStatistics(eegData.attentionLevel);
            const meditationStats = calculateStatistics(eegData.meditationLevel);
            
            return (
              <div className="bg-white p-4 rounded-md shadow-sm mb-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-blue-500" />
                  EEG 시계열 데이터 통계 (초단위)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">지표</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">평균</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">표준편차</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최소값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최대값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">데이터수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">집중도</td>
                        <td className="px-3 py-2 text-center text-blue-600 font-semibold">{formatValue(focusStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(focusStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(focusStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(focusStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{focusStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">이완도</td>
                        <td className="px-3 py-2 text-center text-green-600 font-semibold">{formatValue(relaxStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(relaxStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(relaxStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(relaxStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{relaxStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">스트레스</td>
                        <td className="px-3 py-2 text-center text-red-600 font-semibold">{formatValue(stressStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{stressStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">주의력</td>
                        <td className="px-3 py-2 text-center text-purple-600 font-semibold">{formatValue(attentionStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(attentionStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(attentionStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(attentionStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{attentionStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">명상도</td>
                        <td className="px-3 py-2 text-center text-indigo-600 font-semibold">{formatValue(meditationStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(meditationStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(meditationStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(meditationStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{meditationStats.count}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* PPG 시계열 데이터 통계 */}
          {(data.processedTimeSeries?.ppg || data.timeSeriesData?.ppg) && (() => {
            const ppgData = data.processedTimeSeries?.ppg || data.timeSeriesData?.ppg;
            const hrStats = calculateStatistics(ppgData.heartRate);
            const hrvStats = calculateStatistics(ppgData.hrv || ppgData.rmssd);
            const stressStats = calculateStatistics(ppgData.stressLevel);
            const lfHfStats = calculateStatistics(ppgData.lfHfRatio);
            
            return (
              <div className="bg-white p-4 rounded-md shadow-sm mb-4">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-red-500" />
                  PPG 시계열 데이터 통계 (초단위)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">지표</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">평균</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">표준편차</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최소값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최대값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">데이터수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">심박수 (BPM)</td>
                        <td className="px-3 py-2 text-center text-red-600 font-semibold">{formatValue(hrStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{hrStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">HRV (ms)</td>
                        <td className="px-3 py-2 text-center text-blue-600 font-semibold">{formatValue(hrvStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrvStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrvStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(hrvStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{hrvStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">스트레스 레벨</td>
                        <td className="px-3 py-2 text-center text-orange-600 font-semibold">{formatValue(stressStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stressStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{stressStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">LF/HF 비율</td>
                        <td className="px-3 py-2 text-center text-green-600 font-semibold">{formatValue(lfHfStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(lfHfStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(lfHfStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(lfHfStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{lfHfStats.count}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ACC 시계열 데이터 통계 */}
          {(data.processedTimeSeries?.acc || data.timeSeriesData?.acc) && (() => {
            const accData = data.processedTimeSeries?.acc || data.timeSeriesData?.acc;
            const activityStats = calculateStatistics(accData.activityLevel);
            const movementStats = calculateStatistics(accData.movementIntensity);
            const stabilityStats = calculateStatistics(accData.posturalStability);
            
            return (
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-green-500" />
                  ACC 시계열 데이터 통계 (초단위)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">지표</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">평균</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">표준편차</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최소값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">최대값</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">데이터수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">활동 레벨</td>
                        <td className="px-3 py-2 text-center text-green-600 font-semibold">{formatValue(activityStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(activityStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(activityStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(activityStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{activityStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">움직임 강도</td>
                        <td className="px-3 py-2 text-center text-blue-600 font-semibold">{formatValue(movementStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(movementStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(movementStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(movementStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{movementStats.count}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">자세 안정성</td>
                        <td className="px-3 py-2 text-center text-purple-600 font-semibold">{formatValue(stabilityStats.mean)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stabilityStats.std)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stabilityStats.min)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{formatValue(stabilityStats.max)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{stabilityStats.count}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 개인정보 */}
      {data.personalInfo && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-amber-800">
            <User className="w-5 h-5 mr-2 text-amber-600" />
            개인 정보
            <Badge variant="outline" className="ml-2 text-xs">
              AI 분석 참고용
            </Badge>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">이름</span>
              <p className="font-semibold text-gray-800">{data.personalInfo.name || 'N/A'}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">나이</span>
              <p className="font-semibold text-blue-600">{data.personalInfo.age || 'N/A'}<span className="text-xs text-gray-400 ml-1">세</span></p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">성별</span>
              <p className="font-semibold text-purple-600">{data.personalInfo.gender || 'N/A'}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm text-center">
              <span className="text-xs text-gray-500 block mb-1">직업</span>
              <p className="font-semibold text-green-600">{data.personalInfo.occupation || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 세션 정보 (측정 데이터가 없을 때) */}
      {!data.eegMetrics && !data.ppgMetrics && data.sessionOnly && data.sessionData && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
            <Info className="w-5 h-5 mr-2 text-gray-600" />
            세션 정보
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">측정자</span>
              <p className="font-semibold text-gray-900">{data.sessionData.measuredByUserName || '알 수 없음'}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">조직</span>
              <p className="font-semibold text-gray-900">{data.sessionData.organizationName || '개인'}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">상태</span>
              <p className="font-semibold text-orange-600">{data.sessionData.status || 'INCOMPLETE'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 데이터가 없는 경우 메시지 */}
      {!data.eegMetrics && !data.ppgMetrics && !data.accMetrics && !data.timeSeriesData && !data.personalInfo && !data.sessionOnly && (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
            <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">측정 데이터가 없습니다</h3>
            <p className="text-sm text-gray-400">해당 측정 세션의 상세 데이터를 찾을 수 없습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [selectedEngineFilter, setSelectedEngineFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest') // 정렬 옵션
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all') // 기간 필터
  
  // AI Report 설정을 위한 organization ID
  const [currentContext, setCurrentContext] = useState(enterpriseAuthService.getCurrentContext())
  const organizationId = currentContext.organization?.id || ''
  
  // enterpriseAuthService의 상태 변경 감지
  useEffect(() => {
    const updateContext = () => {
      const newContext = enterpriseAuthService.getCurrentContext()
      console.log('🔄 Context 업데이트:', newContext)
      setCurrentContext(newContext)
    }
    
    // 초기 로드 및 주기적 체크
    updateContext()
    const interval = setInterval(updateContext, 500) // 0.5초마다 체크
    
    return () => clearInterval(interval)
  }, [])
  
  // 렌더러 시스템 초기화
  useEffect(() => {
    try {
      initializeRenderers()
    } catch (error) {
    }
  }, [])

  // 커스텀 렌더러 로드
  useEffect(() => {
    const loadCustomRenderers = async () => {
      try {
        const accessibleCustomRenderers = await customRendererService.getAccessibleRenderers(organizationId)
        setCustomRenderers(accessibleCustomRenderers)
      } catch (error) {
        setCustomRenderers([])
      }
    }

    loadCustomRenderers()
  }, [organizationId])
  const {
    selectedEngine,
    selectedViewer,
    setSelectedEngine,
    setSelectedViewer,
    engines,
    viewers,
    loading: configLoading,
    error: configError,
    validateConfiguration,
    selectedEngineDetails
  } = useAIReportConfiguration(organizationId)
  const [measurementDataList, setMeasurementDataList] = useState<any[]>([])
  const [loadingMeasurementData, setLoadingMeasurementData] = useState(false)
  const [customRenderers, setCustomRenderers] = useState<any[]>([]) // B2B 커스텀 렌더러 목록
  const [reports, setReports] = useState<HealthReport[]>([])
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalReports: 0,
    completedReports: 0,
    pendingReports: 0,
    failedReports: 0,
    averageQuality: 0,
    successRate: 0
  })

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
  
  // 공유 관련 상태
  const [creatingShareLinks, setCreatingShareLinks] = useState<{[reportId: string]: boolean}>({})
  const [shareSuccess, setShareSuccess] = useState<{[reportId: string]: string}>({})
  const [shareError, setShareError] = useState<{[reportId: string]: string}>({})
  
  // 이메일 복사 상태
  const [copiedEmails, setCopiedEmails] = useState<{[dataId: string]: boolean}>({})
  
  // 측정 데이터 상세 보기 상태
  const [measurementDetailModal, setMeasurementDetailModal] = useState<{
    isOpen: boolean;
    dataId: string;
    data: any;
  }>({
    isOpen: false,
    dataId: '',
    data: null
  })
  
  // 이메일 복사 핸들러
  const handleEmailCopy = async (dataId: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmails(prev => ({ ...prev, [dataId]: true }));
      setTimeout(() => {
        setCopiedEmails(prev => ({ ...prev, [dataId]: false }));
      }, 2000);
    } catch (err) {
    }
  }
  
  // 측정 데이터 상세 보기 핸들러
  const handleViewMeasurementData = async (dataId: string) => {
    try {
      console.log('🔍 handleViewMeasurementData 호출됨:', {
        dataId,
        measurementDataListLength: measurementDataList.length,
        measurementDataListIds: measurementDataList.map(d => d.id)
      });
      
      // 현재 측정 데이터 목록에서 해당 데이터 찾기
      const measurementData = measurementDataList.find(data => data.id === dataId)
      if (!measurementData) {
        console.error('❌ 측정 데이터를 찾을 수 없습니다:', {
          searchedId: dataId,
          availableIds: measurementDataList.map(d => d.id)
        });
        setError('측정 데이터를 찾을 수 없습니다.')
        return
      }
      
      console.log('[DATACHECK] ✅ 측정 데이터 찾음:', {
        dataId: measurementData.id,
        dataKeys: Object.keys(measurementData),
        hasProcessedTimeSeries: !!measurementData.processedTimeSeries,
        sessionDate: measurementData.sessionDate,
        userName: measurementData.userName
      });
      
      // 추가 상세 정보가 필요한 경우 MeasurementDataService에서 가져오기
      const measurementDataService = new MeasurementDataService()
      let detailedData = measurementData
      
      try {
        // dataId는 실제로 세션 ID이므로, 세션에 연결된 측정 데이터를 가져와야 함
        console.log('[DATACHECK] 📊 세션 ID로 측정 데이터 조회 시작:', dataId);
        const sessionMeasurementData = await measurementDataService.getSessionMeasurementData(dataId)
        console.log('[DATACHECK] 📊 세션 측정 데이터 조회 결과:', {
          sessionId: dataId,
          foundCount: sessionMeasurementData?.length || 0,
          hasData: !!sessionMeasurementData && sessionMeasurementData.length > 0
        });
        
        if (sessionMeasurementData && sessionMeasurementData.length > 0) {
          // 가장 최신 측정 데이터 사용
          const actualMeasurementData = sessionMeasurementData[0]
          console.log('[DATACHECK] ✅ 측정 데이터 조회 성공:', {
            measurementId: actualMeasurementData.id,
            hasEegMetrics: !!actualMeasurementData.eegMetrics,
            hasPpgMetrics: !!actualMeasurementData.ppgMetrics,
            hasProcessedTimeSeries: !!actualMeasurementData.processedTimeSeries,
            processedTimeSeriesKeys: actualMeasurementData.processedTimeSeries ? Object.keys(actualMeasurementData.processedTimeSeries) : [],
            eegTimeSeriesLength: actualMeasurementData.processedTimeSeries?.eeg?.timestamps?.length || 0,
            rawDataKeys: Object.keys(actualMeasurementData),
            rawDataSample: JSON.stringify(actualMeasurementData).substring(0, 500) + '...'
          });
          
          // processedTimeSeries를 우선적으로 보존하면서 데이터 병합
          detailedData = { 
            ...measurementData, 
            ...actualMeasurementData,
            // processedTimeSeries가 있으면 반드시 보존
            ...(actualMeasurementData.processedTimeSeries ? { 
              processedTimeSeries: actualMeasurementData.processedTimeSeries 
            } : {})
          }
        } else {
          console.warn('[DATACHECK] ⚠️ 세션에 연결된 측정 데이터가 없습니다:', {
            sessionId: dataId,
            searchResult: sessionMeasurementData,
            usingBaseMeasurementData: true
          });
          // 세션 데이터만 사용
          detailedData = measurementData
        }
      } catch (detailError) {
        console.warn('추가 측정 데이터를 가져오는데 실패했습니다:', detailError)
        // 기본 데이터로 계속 진행
      }
      
      // ✅ Firestore에만 의존하므로 Storage 관련 코드 제거
      // processedTimeSeries 데이터는 이미 detailedData에 포함되어 있음
      console.log('[DATACHECK] 📊 최종 데이터 확인 (모달 전송 직전):', {
        hasEegMetrics: !!detailedData.eegMetrics,
        hasPpgMetrics: !!detailedData.ppgMetrics,
        hasProcessedTimeSeries: !!detailedData.processedTimeSeries,
        processedTimeSeriesKeys: detailedData.processedTimeSeries ? Object.keys(detailedData.processedTimeSeries) : [],
        eegTimeSeriesLength: detailedData.processedTimeSeries?.eeg?.timestamps?.length || 0,
        dataSource: 'Firestore',
        allDataKeys: Object.keys(detailedData)
      });
      
      // 모달 열기
      setMeasurementDetailModal({
        isOpen: true,
        dataId: dataId,
        data: detailedData
      })
    } catch (error) {
      console.error('측정 데이터 조회 오류:', error)
      setError('측정 데이터를 불러오는데 실패했습니다.')
    }
  }
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    // organizationId가 있을 때만 데이터 로드
    if (organizationId) {
      console.log('📋 데이터 로드 시작 - organizationId:', organizationId)
      loadReportData()
      loadMeasurementData()
    } else {
      console.log('⏳ organizationId 대기 중...')
    }
    
    // Cleanup: 컴포넌트 unmount 시 모든 타이머 정리
    return () => {
      Object.values(analysisTimers).forEach(timer => {
        if (timer) {
          clearInterval(timer)
        }
      })
    }
  }, [organizationId]) // organizationId가 변경될 때마다 재실행

  // 측정 데이터 로드
  const loadMeasurementData = async () => {
    setLoadingMeasurementData(true)
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      // 🔧 조직과 개인 측정 데이터 모두 조회하도록 수정
      let measurementSessions = [];
      
      try {
        // 🔧 디버깅: 전체 측정 세션 조회
        console.log('🔍 전체 측정 세션 조회 시작...');
        const allSessions = await FirebaseService.getMeasurementSessions([]);
        console.log(`📊 전체 측정 세션 수: ${allSessions.length}개`);
        
        if (allSessions.length > 0) {
          console.log('첫 번째 세션 예시:', {
            id: allSessions[0].id,
            organizationId: allSessions[0].organizationId,
            measuredByUserId: allSessions[0].measuredByUserId,
            subjectName: allSessions[0].subjectName,
            sessionDate: allSessions[0].sessionDate
          });
        }
        
        // 🔧 임시로 모든 세션을 추가 (개발/디버깅용)
        // 조직 ID가 없거나 현재 조직과 일치하는 세션만 필터링
        const currentOrgId = currentContext.organization?.id;
        const filteredSessions = allSessions.filter((session: any) => {
          // 조직 ID가 없는 개인 세션이거나
          // 현재 조직 ID와 일치하는 세션만 포함
          return !session.organizationId || session.organizationId === currentOrgId;
        });
        
        console.log(`🔍 필터링된 세션 수: ${filteredSessions.length}개`);
        measurementSessions.push(...filteredSessions);
        
        // 🔧 아래 코드는 이미 위에서 필터링된 세션을 추가했으므로 주석 처리
        /*
        // 1. 조직 측정 세션 조회 (조직 ID가 있는 경우)
        if (currentContext.organization) {
          const orgFilters = [
            FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
          ]
          const orgSessions = await FirebaseService.getMeasurementSessions(orgFilters)
          console.log(`📊 조직 측정 세션 조회 완료: ${orgSessions.length}개`);
          measurementSessions.push(...orgSessions);
        }
        
        // 2. 현재 사용자의 개인 측정 세션 조회
        try {
          // Firebase auth 직접 import 사용
          const { auth } = await import('@core/services/firebase');
          const currentUser = auth.currentUser;
          if (currentUser) {
            // 현재 사용자가 측정한 데이터 조회
            const userFilters = [
              FirebaseService.createWhereFilter('measuredByUserId', '==', currentUser.uid)
            ]
            const userSessions = await FirebaseService.getMeasurementSessions(userFilters);
            console.log('현재 사용자 UID:', currentUser.uid);
            console.log('사용자의 전체 측정 세션:', userSessions.length);
            
            // organizationId가 없는 개인 세션만 필터링
            const personalSessions = userSessions.filter((session: any) => !session.organizationId);
            console.log(`👤 개인 측정 세션 조회 완료: ${personalSessions.length}개`);
            
            // 디버깅을 위해 첫 번째 세션 정보 출력
            if (userSessions.length > 0) {
              console.log('첫 번째 세션 정보:', {
                id: userSessions[0].id,
                organizationId: userSessions[0].organizationId,
                measuredByUserId: userSessions[0].measuredByUserId,
                subjectName: userSessions[0].subjectName
              });
            }
            
            measurementSessions.push(...personalSessions);
          } else {
            console.log('⚠️ 현재 로그인한 사용자가 없습니다.');
          }
        } catch (authError) {
          console.error('사용자 인증 확인 중 오류:', authError);
        }
        */
        
      } catch (queryError) {
        console.error('측정 세션 조회 중 오류:', queryError);
        // 실패 시 빈 배열로 진행
        measurementSessions = [];
      }
      
      // 중복 제거 (같은 ID를 가진 세션이 여러 개 있을 수 있음)
      const uniqueSessions = new Map();
      measurementSessions.forEach(session => {
        uniqueSessions.set(session.id, session);
      });
      measurementSessions = Array.from(uniqueSessions.values());
      
      console.log(`🔍 중복 제거 후 총 측정 세션: ${measurementSessions.length}개`);
      
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
             
             // 담당자 정보 조회
             let managerInfo = null;
             if (session.measuredByUserId || session.measurementByUserId) {
               try {
                 const managerId = session.measuredByUserId || session.measurementByUserId;
                 const managerDoc = await FirebaseService.getDocument('users', managerId) as any;
                 if (managerDoc && managerDoc.id) {
                   managerInfo = {
                     name: managerDoc.displayName || managerDoc.name || '알 수 없음',
                     department: managerDoc.department || '미지정'
                   };
                 }
               } catch (error) {
               }
             }
             
             // 나이 계산
             let calculatedAge = session.subjectAge;
             if (!calculatedAge && session.subjectBirthDate) {
               try {
                 let birthDate;
                 if (typeof session.subjectBirthDate.toDate === 'function') {
                   birthDate = session.subjectBirthDate.toDate();
                 } else if (session.subjectBirthDate instanceof Date) {
                   birthDate = session.subjectBirthDate;
                 } else {
                   birthDate = new Date(session.subjectBirthDate);
                 }
                 
                 const today = new Date();
                 calculatedAge = today.getFullYear() - birthDate.getFullYear();
                 if (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                   calculatedAge--;
                 }
               } catch (error) {
               }
             }

             return {
               id: session.id,
               userName: session.subjectName || '알 수 없음',
               userAge: calculatedAge,
               userGender: session.subjectGender || '미지정',
               userOccupation: session.subjectOccupation || '미지정',
               userDepartment: session.subjectDepartment || '미지정',
               userEmail: session.subjectEmail || '',
               managerInfo: managerInfo,
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
                 timestamp: analysis.timestamp,
                 personalInfo: analysis.personalInfo, // 🎯 개인 정보 추가
                 overallScore: analysis.overallScore || 0,
                 stressLevel: analysis.stressLevel || 0,
                 focusLevel: analysis.focusLevel || 0,
                 insights: analysis.insights, // 🎯 insights 필드 추가
                 rawData: analysis.rawData, // 🎯 rawData 필드 추가
                 metrics: analysis.metrics, // 🎯 metrics 필드 추가
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
             
             // 나이 계산
             let calculatedAge = session.subjectAge;
             if (!calculatedAge && session.subjectBirthDate) {
               try {
                 let birthDate;
                 if (typeof session.subjectBirthDate.toDate === 'function') {
                   birthDate = session.subjectBirthDate.toDate();
                 } else if (session.subjectBirthDate instanceof Date) {
                   birthDate = session.subjectBirthDate;
                 } else {
                   birthDate = new Date(session.subjectBirthDate);
                 }
                 
                 const today = new Date();
                 calculatedAge = today.getFullYear() - birthDate.getFullYear();
                 if (today.getMonth() < birthDate.getMonth() || 
                     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                   calculatedAge--;
                 }
               } catch (error) {
               }
             }
             
             return {
               id: session.id,
               userName: session.subjectName || '알 수 없음',
               userAge: calculatedAge,
               userGender: session.subjectGender || '미지정',
               userOccupation: session.subjectOccupation || '미지정',
               userDepartment: session.subjectDepartment || '미지정',
               userEmail: session.subjectEmail || '',
               managerInfo: null, // catch 블록에서는 담당자 정보 조회하지 않음
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
      
      setMeasurementDataList(measurementDataWithReports)
      
      // 상세 로깅: 전체 측정 데이터 개수 확인
      console.log(`✅ 측정 데이터 로드 완료: 총 ${measurementDataWithReports.length}개`);
      console.log('측정 데이터 목록:', measurementDataWithReports.map(data => ({
        id: data.id,
        userName: data.userName,
        organizationId: data.organizationId,
        timestamp: data.timestamp
      })))
      
    } catch (error) {
      
      // 에러 발생 시 빈 배열로 설정하고 사용자에게 안내
      setMeasurementDataList([])
      setError('측정 데이터를 불러오는데 실패했습니다. 측정 세션이 아직 생성되지 않았을 수 있습니다.')
    } finally {
      setLoadingMeasurementData(false)
    }
  }

  // 측정 데이터 기반 리포트 생성 핸들러
  const handleGenerateReportFromData = async (dataId: string, engineType: string) => {
    console.log('🚀 AI 분석 생성 시작:', { dataId, engineType });
    
    // 중복 실행 방지
    if (generatingReports[dataId]?.isLoading) {
      console.log('⚠️ 이미 실행 중인 분석이 있음:', dataId);
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
      console.log('📊 측정 데이터 로드 시작:', dataId);
      const measurementDataService = new MeasurementDataService()
      
      let measurementData = null
      let usingSessionData = false
      
      try {
        // 먼저 세션 ID로 상세 측정 데이터 조회
        const sessionMeasurementData = await measurementDataService.getSessionMeasurementData(dataId)
        
        if (sessionMeasurementData.length > 0) {
          // 가장 최신 측정 데이터 사용
          measurementData = sessionMeasurementData[0]
        }
      } catch (sessionError) {
      }
      
      if (!measurementData) {
        // 폴백 1: 직접 ID로 조회 시도
        try {
          measurementData = await measurementDataService.getMeasurementData(dataId)
          if (measurementData) {
          }
        } catch (directError) {
        }
      }
      
      if (!measurementData) {
        // 폴백 2: 세션 데이터로 AI 분석용 데이터 구성
        try {
          const sessionDoc = await FirebaseService.getMeasurementSession(dataId)
          if (sessionDoc) {
            
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
                delta: { value: 0.25 }, 
                theta: { value: 0.30 }, 
                alpha: { value: 0.35 }, 
                beta: { value: 0.40 }, 
                gamma: { value: 0.15 },
                focusIndex: { value: sessionData.focusLevel ? Math.min(Math.max(sessionData.focusLevel * 3, 1.8), 2.4) : 2.1 },
                relaxationIndex: { value: sessionData.relaxationLevel ? sessionData.relaxationLevel : 0.20 },
                stressIndex: { value: sessionData.stressLevel ? Math.min(Math.max(sessionData.stressLevel * 5, 0.3), 7.0) : 3.5 },
                hemisphericBalance: { value: 0.02 },
                cognitiveLoad: { value: sessionData.stressLevel ? Math.min(Math.max(sessionData.stressLevel * 1.5, 0.3), 0.8) : 0.5 },
                emotionalStability: { value: 0.7 },
                totalPower: { value: 950 },
                attentionIndex: sessionData.focusLevel ? sessionData.focusLevel * 100 : 75,
                meditationIndex: sessionData.relaxationLevel ? sessionData.relaxationLevel * 100 : 70,
                fatigueIndex: 40,
                signalQuality: 0.8, 
                artifactRatio: 0.1
              },
              ppgMetrics: {
                heartRate: { value: 72 },
                rmssd: { value: 30 },
                sdnn: { value: 50 },
                lfHfRatio: { value: 2.5 },
                spo2: { value: 98 },
                heartRateVariability: 45,
                rrIntervals: [], 
                stressScore: sessionData.stressLevel ? sessionData.stressLevel * 100 : 30,
                autonomicBalance: 0.8, 
                signalQuality: 0.8, 
                motionArtifact: 0.1
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
          }
        } catch (sessionError) {
        }
      }
      
      if (!measurementData) {
        throw new Error('측정 데이터를 찾을 수 없습니다. 세션 데이터와 상세 측정 데이터 모두 조회에 실패했습니다.')
      }
      
      if (usingSessionData) {
      }
      

      // 2. 세션 데이터에서 개인 정보 추출
      const targetMeasurementData = measurementDataList.find(data => data.id === dataId)
      const sessionData = targetMeasurementData?.sessionData || {}
      
      // 🔍 디버깅: 세션 데이터 상세 확인
      
      // 나이 계산 로직 개선
      let calculatedAge = sessionData.subjectAge || 30; // 기본값
      
      // subjectAge가 없지만 생년월일이 있다면 나이 계산
      if (!sessionData.subjectAge && sessionData.subjectBirthDate) {
        try {
          let birthDate;
          
          // Firestore Timestamp 객체인 경우 .toDate()로 변환
          if (typeof sessionData.subjectBirthDate.toDate === 'function') {
            birthDate = sessionData.subjectBirthDate.toDate();
          } else if (sessionData.subjectBirthDate instanceof Date) {
            birthDate = sessionData.subjectBirthDate;
          } else {
            birthDate = new Date(sessionData.subjectBirthDate);
          }
          
          const today = new Date()
          calculatedAge = today.getFullYear() - birthDate.getFullYear()
          
          // 생일이 지났는지 확인하여 정확한 만 나이 계산
          if (today.getMonth() < birthDate.getMonth() || 
              (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            calculatedAge--
          }
          
        } catch (error) {
        }
      }
      
      // 개인 정보 구성 (AI 엔진이 기대하는 형식)
      const personalInfo = {
        name: sessionData.subjectName || targetMeasurementData?.userName || '알 수 없음',
        age: calculatedAge,
        gender: (sessionData.subjectGender === 'FEMALE' ? 'female' : 'male') as 'male' | 'female',
        occupation: sessionData.subjectOccupation || targetMeasurementData?.userOccupation || 'office_worker',
        // 🎯 공유 링크를 위한 생년월일 추가
        birthDate: sessionData.subjectBirthDate ? 
          (sessionData.subjectBirthDate.toDate ? 
            sessionData.subjectBirthDate.toDate().toISOString().split('T')[0] : // Firestore Timestamp -> YYYY-MM-DD
            new Date(sessionData.subjectBirthDate).toISOString().split('T')[0]   // Date -> YYYY-MM-DD
          ) : 
          null
      }
      
      // AI 엔진이 기대하는 전체 데이터 구조 구성
      const aiAnalysisData = {
        personalInfo,
        measurementData: {
          eegMetrics: measurementData.eegMetrics || {},
          ppgMetrics: measurementData.ppgMetrics || {},
          qualityMetrics: measurementData.dataQuality ? {
            signalQuality: measurementData.dataQuality.overallScore / 100,
            measurementDuration: measurementData.duration || 60
          } : {
            signalQuality: 0.8,
            measurementDuration: 60
          }
        }
      }
      

      // 3. AI 엔진 초기화 (기본적으로 basic-gemini-v1 사용)
      console.log('🤖 AI 엔진 초기화:', engineType);
      const aiEngine = new BasicGeminiV1Engine()

      // 4. 데이터 검증
      console.log('✅ 데이터 검증 시작');
      const validation = await aiEngine.validate(aiAnalysisData)
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`)
      }
      console.log('✅ 데이터 검증 성공');

      // 5. AI 분석 실행
      console.log('🧠 AI 분석 실행 시작');
      const analysisOptions = {
        outputLanguage: 'ko' as const,
        analysisDepth: 'basic' as const,
        includeDetailedMetrics: true
      }
      
      const analysisResult = await aiEngine.analyze(aiAnalysisData, analysisOptions)
      console.log('🧠 AI 분석 완료:', analysisResult.analysisId);

      // 5. 분석 결과 저장
      // 최신 context를 다시 가져옴
      const latestContext = enterpriseAuthService.getCurrentContext()
      console.log('📍 현재 컨텍스트:', latestContext);
      
      // organizationId가 없으면 오류 발생
      if (!latestContext.organization?.id) {
        console.error('❌ 조직 정보 없음. State currentContext:', currentContext);
        console.error('❌ 조직 정보 없음. Latest context:', latestContext);
        throw new Error('조직 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      // 🔥 MeasurementUser 찾기/생성
      let measurementUserId: string | null = null;
      if (personalInfo && sessionData.subjectEmail) {
        try {
          // personalInfo를 PersonalInfo 형식으로 변환
          const convertedPersonalInfo = {
            name: personalInfo.name,
            email: sessionData.subjectEmail,
            gender: personalInfo.gender === 'female' ? 'FEMALE' as const : 'MALE' as const,
            birthDate: personalInfo.birthDate ? new Date(personalInfo.birthDate) : undefined,
            occupation: personalInfo.occupation,
            department: sessionData.subjectDepartment,
            phone: personalInfo.phone || '',
            address: personalInfo.address || ''
          };
          
          measurementUserId = await measurementUserIntegrationService.findOrCreateMeasurementUser(
            convertedPersonalInfo,
            latestContext.organization?.id
          );
        } catch (error) {
          // MeasurementUser 연결 실패해도 분석 결과는 저장
        }
      }
      
      const analysisRecord = {
        measurementDataId: dataId,
        measurementUserId, // 🔥 MeasurementUser ID 추가
        engineId: aiEngine.id,
        engineName: aiEngine.name,
        engineVersion: aiEngine.version,
        analysisId: analysisResult.analysisId,
        timestamp: analysisResult.timestamp,
        
        // 🎯 개인 정보 추가 (렌더러에서 사용)
        personalInfo: personalInfo,
        
        // 분석 결과
        overallScore: analysisResult.overallScore,
        stressLevel: analysisResult.stressLevel,
        focusLevel: analysisResult.focusLevel,
        insights: analysisResult.insights,
        metrics: analysisResult.metrics,
        rawData: analysisResult.rawData, // 🎯 rawData 추가 (detailedAnalysis 포함)
        
        // 메타 정보
        processingTime: analysisResult.processingTime,
        costUsed: analysisResult.costUsed,
        qualityScore: validation.qualityScore,
        
        // 생성 정보
        createdAt: new Date(),
        createdByUserId: latestContext.user?.id,
        createdByUserName: latestContext.user?.displayName,
        organizationId: latestContext.organization?.id
      }

      // Firestore에 분석 결과 저장
      const analysisId = await FirebaseService.addDocument('ai_analysis_results', analysisRecord)
      
      // 리포트 목록에도 추가 (UI에서 보이도록)
      const reportData = {
        userId: measurementUserId || latestContext.user?.id,
        reportType: engineType,
        title: `AI 건강 분석 리포트`,
        status: 'completed',
        organizationId: latestContext.organization?.id,
        analysisId: analysisId,
        personalInfo: personalInfo,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      if (measurementUserId) {
        await FirebaseService.saveHealthReport(measurementUserId, reportData)
      }

      // 🔥 MeasurementUser의 reportIds 업데이트
      if (measurementUserId) {
        try {
          await measurementUserManagementService.addReportId(measurementUserId, analysisId);
        } catch (error) {
          // reportIds 업데이트 실패해도 분석 결과는 유지
        }
      }

      // 6. 크레딧 차감
      if (latestContext.organization && analysisResult.costUsed > 0) {
        try {
          await creditManagementService.useCredits({
            userId: latestContext.user?.id || 'system',
            organizationId: latestContext.organization.id,
            amount: analysisResult.costUsed,
            type: 'REPORT_USAGE',
            description: `AI 분석 (${aiEngine.name})`,
            metadata: {
              reportId: analysisId,
              reportType: engineType
            }
          })
        } catch (creditError) {
          // 크레딧 차감 실패해도 분석 결과는 유지
        }
      }

      // 7. 측정 데이터 목록 새로고침 (Firestore 반영 시간을 고려하여 지연 후 재로드)
      setTimeout(async () => {
        await loadMeasurementData()
      }, 1500)
      
      // 성공 메시지
      setError(null)

    } catch (error) {
      console.error('❌ AI 분석 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.';
      console.error('❌ 오류 메시지:', errorMessage);
      setError(errorMessage);
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
      return
    }
    
    setSelectedReportForView(report)
    setSelectedViewerId(viewerId)
    setSelectedViewerName(viewerName)
    setIsViewerModalOpen(true)
  }

  // 공유 링크 생성
  const handleCreateShareLink = async (report: any) => {
    if (!report) {
      return
    }

    const reportId = report.id
    setCreatingShareLinks(prev => ({ ...prev, [reportId]: true }))
    setShareError(prev => {
      const newState = { ...prev }
      delete newState[reportId]
      return newState
    })

    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      if (!currentContext.organization?.id || !currentContext.user?.id) {
        throw new Error('조직 또는 사용자 정보를 찾을 수 없습니다.')
      }

      // 리포트에서 개인정보 가져오기
      const subjectName = report.personalInfo?.name || report.createdByUserName || '익명'
      
      // 생년월일 확인 - 여러 소스에서 시도
      let subjectBirthDate = null;
      
      console.log('Checking birth date sources:', {
        reportId: report.id,
        measurementDataId: report.measurementDataId,
        hasPersonalInfo: !!report.personalInfo,
        personalInfoKeys: report.personalInfo ? Object.keys(report.personalInfo) : []
      });
      
      // 1. personalInfo에서 먼저 확인
      if (report.personalInfo?.birthDate) {
        try {
          subjectBirthDate = new Date(report.personalInfo.birthDate)
        } catch (error) {
        }
      }
      
      // 2. personalInfo에 없으면 sessionData에서 가져오기
      if (!subjectBirthDate && report.measurementDataId) {
        try {
          const measurementDoc = await FirebaseService.getDocument('measurement_sessions', report.measurementDataId) as any
          
          const sessionData = measurementDoc?.sessionData
          
          if (sessionData?.subjectBirthDate) {
            // Firestore Timestamp인 경우 변환
            subjectBirthDate = sessionData.subjectBirthDate.toDate ? 
              sessionData.subjectBirthDate.toDate() : 
              new Date(sessionData.subjectBirthDate)
          } else {
          }
        } catch (error) {
        }
      }

             // 3. 여전히 없으면 에러 처리
       if (!subjectBirthDate) {
         throw new Error('이 리포트는 생년월일 정보가 없어 공유할 수 없습니다. 새로운 분석을 다시 실행해주세요.')
       } else {
       }

      // 공유 링크 생성
      const shareableReport = await reportSharingService.createShareableLink(
        reportId,
        currentContext.organization.id,
        currentContext.user.id,
        currentContext.user.displayName || 'Unknown',
        subjectName,
        subjectBirthDate,
        {
          expiryDays: 30,
          maxAccessCount: 100
        }
      )

      const shareUrl = reportSharingService.generateShareUrl(shareableReport.shareToken)
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl)
      
      setShareSuccess(prev => ({ 
        ...prev, 
        [reportId]: shareUrl 
      }))


      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setShareSuccess(prev => {
          const newState = { ...prev }
          delete newState[reportId]
          return newState
        })
      }, 3000)

    } catch (error) {
      setShareError(prev => ({ 
        ...prev, 
        [reportId]: error instanceof Error ? error.message : '공유 링크 생성에 실패했습니다.' 
      }))

      // 5초 후 에러 메시지 제거
      setTimeout(() => {
        setShareError(prev => {
          const newState = { ...prev }
          delete newState[reportId]
          return newState
        })
      }, 5000)
    } finally {
      setCreatingShareLinks(prev => {
        const newState = { ...prev }
        delete newState[reportId]
        return newState
      })
    }
  }

    // 해당 엔진에 호환되는 뷰어 필터링 (실제 렌더러 시스템 사용)
  const getCompatibleViewers = useCallback((engineId: string) => {
    try {
      // 1. 기본 렌더러 시스템에서 조회
      const recommendedRenderers = getRecommendedRenderers(engineId)
      const compatibleRenderers = findCompatibleRenderers(engineId)
      const allWebRenderers = rendererRegistry.getByFormat('web')
      
      // 2. 기본 렌더러들 합치기
      const baseRenderers = [
        ...recommendedRenderers,
        ...compatibleRenderers,
        ...allWebRenderers
      ]
      
      // 3. 기본 렌더러를 뷰어 형태로 변환
      const baseViewers = baseRenderers
        .filter((renderer, index, self) => 
          index === self.findIndex(r => r.id === renderer.id)
        )
        .map(renderer => ({
          id: renderer.id,
          name: renderer.name,
          description: renderer.description.length > 20 ? renderer.description.substring(0, 20) + '...' : renderer.description,
          version: renderer.version,
          costPerRender: renderer.costPerRender,
          isRecommended: recommendedRenderers.some(r => r.id === renderer.id),
          isCustom: false,
          subscriptionTier: 'basic' as const
        }))
      
      // 4. 커스텀 렌더러는 별도 state로 관리하여 여기서 합치기
      const customViewers = customRenderers
        .filter((custom: any) => 
          custom.supportedEngines.includes(engineId) || 
          custom.supportedEngines.includes('*')
        )
        .filter((custom: any) => custom.outputFormat === 'web')
        .map((custom: any) => ({
          id: custom.rendererId,
          name: custom.name,
          description: custom.description.length > 20 ? custom.description.substring(0, 20) + '...' : custom.description,
          version: custom.version,
          costPerRender: custom.creditCostPerRender,
          isRecommended: false,
          isCustom: true,
          subscriptionTier: custom.subscriptionTier,
          organizationName: custom.organizationName,
          accessLevel: custom.accessLevel
        }))
      
      // 5. 모든 뷰어 합치기 (커스텀 렌더러 우선)
      const allViewers = [...customViewers, ...baseViewers]
      
      return allViewers
      
    } catch (error) {
      
      // 오류 발생시 기본 뷰어 반환
      return [{
        id: 'basic-gemini-v1-web',
        name: '기본 웹 뷰어',
        description: '기본 제공 웹 뷰어',
        version: '1.0.0',
        costPerRender: 0,
        isRecommended: true,
        isCustom: false,
        subscriptionTier: 'basic' as const
      }]
    }
  }, [customRenderers])

  // 리포트 보기 핸들러 (기존 - 호환성을 위해 유지)
  const handleViewReport = (analysisId: string, analysisResult: any) => {
    // 기본 뷰어로 바로 열기
    handleViewReportWithViewer(analysisResult, 'universal-web-viewer', '범용 웹 뷰어')
  }

  // PDF 다운로드 핸들러
  const handleDownloadPDF = async (analysisId: string, analysisResult: any) => {
    
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
      
      
    } catch (error) {
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
      
      // 4. 데이터 새로고침
      await loadMeasurementData()
      
    } catch (error) {
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
      
      // 인증 정보가 없는 경우 특별 처리
      if (error instanceof Error && error.message.includes('인증 정보가 없습니다')) {
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
      }

      // 데이터 새로고침
      await loadReportData()

      // 리포트 뷰어 모달 표시 (Web Renderer 사용)
      setSelectedReportForView({
        id: analysisId,
        engineId: aiEngine.id,
        analysisResult: analysisResult,
        personalInfo: personalInfo
      })
      setIsViewerModalOpen(true)
      
      // 데이터 새로고침 후 잠시 후 AI Reports 목록으로 이동
      setTimeout(() => {
        navigate('/org-admin/ai-reports')
      }, 3000) // 3초 후 자동 이동

    } catch (error) {
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

      await loadReportData()
    } catch (error) {
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
        <h2 className="text-2xl font-bold text-gray-900">AI 정신건강 리포트</h2>
          <Button 
            onClick={async () => {
              const validation = await validateConfiguration();
              if (validation.isValid) {
                // 설정 저장
                console.log('AI 리포트 설정:', {
                  engine: selectedEngine,
                  viewer: selectedViewer
                });
                // AI 리포트 생성 페이지로 이동
                navigate('/ai-report/personal-info');
              } else {
                alert(validation.message);
              }
            }}
            disabled={loading || configLoading || !selectedEngine || !selectedViewer}
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900"
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

            <Button 
              className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12"
              disabled={loading || configLoading || !selectedEngine || !selectedViewer}
              onClick={async () => {
                const validation = await validateConfiguration();
                if (validation.isValid) {
                  // 설정 저장
                  console.log('AI 리포트 설정:', {
                    engine: selectedEngine,
                    viewer: selectedViewer
                  });
                  // AI 리포트 생성 페이지로 이동
                  navigate('/ai-report/personal-info');
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">리포트 목록</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadMeasurementData} className="text-gray-900 border-gray-300 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" size="sm" className="text-gray-900 border-gray-300 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              일괄 다운로드
            </Button>
          </div>
        </div>
        
        {/* 검색 및 필터 섹션 */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="측정자명, 날짜로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* 정렬 옵션 */}
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된 순</option>
          </select>
          
          {/* 기간 필터 */}
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">지난 1주일</option>
            <option value="month">지난 1개월</option>
          </select>
        </div>
        
        {loadingMeasurementData ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">리포트 목록을 불러오는 중...</span>
          </div>
        ) : filteredGeneratedReports.length === 0 ? (
          <Card className="p-8 bg-white border border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">생성된 리포트가 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || dateFilter !== 'all' 
                    ? '검색 조건에 맞는 리포트가 없습니다.' 
                    : '아직 생성된 AI 분석 리포트가 없습니다.'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredGeneratedReports.map((report) => (
              <div key={`${report.measurementDataId}-${report.id}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* 사용자 정보 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-lg font-semibold text-gray-900">{report.subjectName || '알 수 없음'}</span>
                      </div>
                      
                      {/* 개인정보 Badge들 */}
                      <div className="flex items-center space-x-2">
                        {report.subjectAge && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            만 {report.subjectAge}세
                          </Badge>
                        )}
                        
                        {report.subjectGender && report.subjectGender !== '미지정' && (
                          <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">
                            {report.subjectGender === 'MALE' ? '남성' : report.subjectGender === 'FEMALE' ? '여성' : report.subjectGender}
                          </Badge>
                        )}
                        
                        {report.subjectOccupation && report.subjectOccupation !== '미지정' && (
                          <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">
                            {report.subjectOccupation}
                          </Badge>
                        )}
                        
                        {report.subjectDepartment && report.subjectDepartment !== '미지정' && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {report.subjectDepartment}
                          </Badge>
                        )}
                        
                        {report.subjectEmail && report.subjectEmail !== '' && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-gray-50 text-gray-700 border-gray-200 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleEmailCopy(report.id, report.subjectEmail)}
                          >
                            {copiedEmails[report.id] ? '복사됨!' : report.subjectEmail}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {report.managerInfo && (
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">담당자</div>
                          <div className="text-sm text-gray-700">
                            {report.managerInfo.name}{report.managerInfo.department !== '미지정' ? `(${report.managerInfo.department})` : ''}
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">생성일시</div>
                        <div className="text-sm text-gray-700">
                          {new Date(report.createdAt).toLocaleDateString('ko-KR')} {new Date(report.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">측정일시</div>
                        <div className="text-sm text-gray-700">
                          {new Date(report.measurementDate).toLocaleDateString('ko-KR')} {new Date(report.measurementDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 리포트 정보 */}
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">AI 건강 분석 리포트</span>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">분석 엔진</div>
                          <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded text-gray-700">
                            {report.engineId || 'basic-gemini-v1'}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">렌더링</div>
                          <span className="text-sm text-gray-700">기본 웹 뷰어</span>
                        </div>
                      </div>
                      
                      {/* 액션 버튼들 */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateShareLink(report)}
                          disabled={creatingShareLinks[report.id]}
                          className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors"
                        >
                          {creatingShareLinks[report.id] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Share2 className="w-4 h-4 mr-1" />
                          )}
                          공유하기
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              리포트보기
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {getCompatibleViewers(report.engineId || 'unknown').map(viewer => (
                              <DropdownMenuItem 
                                key={viewer.id}
                                onClick={() => handleViewReportWithViewer(report, viewer.id, viewer.name)}
                                className="text-gray-900 hover:text-gray-900"
                              >
                                {viewer.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id, report.engineName || '분석 결과')}
                          disabled={deletingReports[report.id]}
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors"
                        >
                          {deletingReports[report.id] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 공유 성공/에러 메시지 */}
                {shareSuccess[report.id] && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                    <div className="flex items-center gap-1">
                      <Copy className="w-4 h-4" />
                      공유 링크가 클립보드에 복사되었습니다!
                    </div>
                  </div>
                )}
                
                {shareError[report.id] && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                    {shareError[report.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )

  // 분석 엔진 목록 추출
  const availableEngines = useMemo(() => {
    const engines = new Set<string>()
    measurementDataList.forEach(data => {
      data.availableReports?.forEach((report: any) => {
        if (report.engineId) {
          engines.add(report.engineId)
        }
      })
    })
    return Array.from(engines).sort()
  }, [measurementDataList])

  // 필터링 및 정렬된 데이터
  const filteredMeasurementData = useMemo(() => {
    const now = new Date()
    
    // 기간 필터 계산
    const getDateFilterRange = () => {
      switch (dateFilter) {
        case 'today':
          const todayStart = new Date(now)
          todayStart.setHours(0, 0, 0, 0)
          return todayStart
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - 7)
          weekStart.setHours(0, 0, 0, 0)
          return weekStart
        case 'month':
          const monthStart = new Date(now)
          monthStart.setDate(now.getDate() - 30)
          monthStart.setHours(0, 0, 0, 0)
          return monthStart
        default:
          return null
      }
    }
    
    const dateFilterStart = getDateFilterRange()
    
    return measurementDataList
      .filter(data => {
        // 검색어 필터
        const matchesSearch = searchQuery === '' || 
          data.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          new Date(data.timestamp).toLocaleDateString('ko-KR').includes(searchQuery)
        
        // 엔진 필터
        const matchesEngine = selectedEngineFilter === 'all' || 
          data.availableReports?.some((report: any) => report.engineId === selectedEngineFilter)
        
        // 기간 필터
        const matchesDate = !dateFilterStart || new Date(data.timestamp) >= dateFilterStart
        
        return matchesSearch && matchesEngine && matchesDate
      })
      .sort((a, b) => {
        // 정렬: 최신순 또는 오래된 순
        const dateA = new Date(a.timestamp).getTime()
        const dateB = new Date(b.timestamp).getTime()
        
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [measurementDataList, searchQuery, selectedEngineFilter, sortOrder, dateFilter])

  // 페이지네이션 계산 (필터링된 데이터 기준)
  const totalPages = Math.ceil(filteredMeasurementData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredMeasurementData.slice(startIndex, endIndex)

  // 필터나 검색어가 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedEngineFilter, sortOrder, dateFilter])

  // 리포트 목록용: 실제 생성된 리포트들 수집
  const allGeneratedReports = useMemo(() => {
    const reports: any[] = []
    
    measurementDataList.forEach(measurementData => {
      if (measurementData.availableReports && measurementData.availableReports.length > 0) {
        measurementData.availableReports.forEach((report: any) => {
          reports.push({
            ...report,
            // 측정자 정보 추가
            subjectName: measurementData.userName,
            subjectAge: measurementData.userAge,
            subjectGender: measurementData.userGender,
            subjectOccupation: measurementData.userOccupation,
            subjectDepartment: measurementData.userDepartment,
            subjectEmail: measurementData.userEmail,
            measurementDate: measurementData.timestamp,
            managerInfo: measurementData.managerInfo,
            // 원본 측정 데이터 참조
            measurementDataId: measurementData.id
          })
        })
      }
    })
    
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [measurementDataList])

  // 리포트 목록용: 검색 및 필터링된 리포트들
  const filteredGeneratedReports = useMemo(() => {
    const now = new Date()
    
    // 기간 필터 계산
    const getDateFilterRange = () => {
      switch (dateFilter) {
        case 'today':
          const todayStart = new Date(now)
          todayStart.setHours(0, 0, 0, 0)
          return todayStart
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - 7)
          weekStart.setHours(0, 0, 0, 0)
          return weekStart
        case 'month':
          const monthStart = new Date(now)
          monthStart.setDate(now.getDate() - 30)
          monthStart.setHours(0, 0, 0, 0)
          return monthStart
        default:
          return null
      }
    }
    
    const dateFilterStart = getDateFilterRange()
    
    return allGeneratedReports
      .filter(report => {
        // 검색어 필터
        const matchesSearch = searchQuery === '' || 
          report.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          new Date(report.createdAt).toLocaleDateString('ko-KR').includes(searchQuery)
        
        // 기간 필터
        const matchesDate = !dateFilterStart || new Date(report.createdAt) >= dateFilterStart
        
        return matchesSearch && matchesDate
      })
      .sort((a, b) => {
        // 정렬: 최신순 또는 오래된 순
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [allGeneratedReports, searchQuery, sortOrder, dateFilter])

  // 통계 계산 함수 (필터링된 데이터 기준)
  const calculateStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 이번주 시작일 (월요일) 계산
    const thisWeekStart = new Date(today)
    const dayOfWeek = today.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 일요일(0)인 경우 6일 빼기, 나머지는 dayOfWeek - 1
    thisWeekStart.setDate(today.getDate() - daysToSubtract)
    thisWeekStart.setHours(0, 0, 0, 0)

    // 총 측정 데이터 수 (전체 데이터 기준)
    const totalMeasurements = measurementDataList.length

    // 총 발행된 리포트 수 (전체 데이터 기준)
    const totalReports = measurementDataList.reduce((sum, data) => {
      return sum + (data.availableReports?.length || 0)
    }, 0)

    // 오늘 측정한 데이터 수 (전체 데이터 기준)
    const todayMeasurements = measurementDataList.filter(data => {
      const measurementDate = new Date(data.timestamp)
      return measurementDate >= today && measurementDate < tomorrow
    }).length

    // 이번주 측정한 데이터 수 (전체 데이터 기준)
    const thisWeekMeasurements = measurementDataList.filter(data => {
      const measurementDate = new Date(data.timestamp)
      return measurementDate >= thisWeekStart && measurementDate < tomorrow
    }).length

    // 오늘 발행된 리포트 수 (전체 데이터 기준)
    const todayReports = measurementDataList.reduce((sum, data) => {
      const todayReportsForData = (data.availableReports || []).filter((report: any) => {
        const reportDate = new Date(report.createdAt)
        return reportDate >= today && reportDate < tomorrow
      }).length
      return sum + todayReportsForData
    }, 0)

    // 이번주 발행된 리포트 수 (전체 데이터 기준)
    const thisWeekReports = measurementDataList.reduce((sum, data) => {
      const thisWeekReportsForData = (data.availableReports || []).filter((report: any) => {
        const reportDate = new Date(report.createdAt)
        return reportDate >= thisWeekStart && reportDate < tomorrow
      }).length
      return sum + thisWeekReportsForData
    }, 0)

    // 총 크레딧 사용량 (전체 데이터 기준)
    const totalCreditsUsed = measurementDataList.reduce((sum, data) => {
      const dataCredits = (data.availableReports || []).reduce((reportSum: number, report: any) => {
        return reportSum + (report.costUsed || 0)
      }, 0)
      return sum + dataCredits
    }, 0)

    // 오늘 사용한 크레딧 사용량 (전체 데이터 기준)
    const todayCreditsUsed = measurementDataList.reduce((sum, data) => {
      const todayCreditsForData = (data.availableReports || [])
        .filter((report: any) => {
          const reportDate = new Date(report.createdAt)
          return reportDate >= today && reportDate < tomorrow
        })
        .reduce((reportSum: number, report: any) => {
          return reportSum + (report.costUsed || 0)
        }, 0)
      return sum + todayCreditsForData
    }, 0)

    // 이번주 사용한 크레딧 사용량 (전체 데이터 기준)
    const thisWeekCreditsUsed = measurementDataList.reduce((sum, data) => {
      const thisWeekCreditsForData = (data.availableReports || [])
        .filter((report: any) => {
          const reportDate = new Date(report.createdAt)
          return reportDate >= thisWeekStart && reportDate < tomorrow
        })
        .reduce((reportSum: number, report: any) => {
          return reportSum + (report.costUsed || 0)
        }, 0)
      return sum + thisWeekCreditsForData
    }, 0)

    return {
      totalMeasurements,
      totalReports,
      todayMeasurements,
      thisWeekMeasurements,
      todayReports,
      thisWeekReports,
      totalCreditsUsed,
      todayCreditsUsed,
      thisWeekCreditsUsed
    }
  }, [measurementDataList])

  const renderMeasurementDataList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">측정 데이터 및 AI 분석 리포트</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadMeasurementData} className="text-gray-900 border-gray-300 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button variant="outline" size="sm" onClick={createTestMeasurementSession} className="text-gray-900 border-gray-300 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-2" />
              테스트 데이터 생성
            </Button>
          )}
        </div>
      </div>

      {/* 검색 및 필터 섹션 */}
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
        
        {/* 정렬 옵션 */}
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된 순</option>
        </select>
        
        {/* 기간 필터 */}
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">전체 기간</option>
          <option value="today">오늘</option>
          <option value="week">지난 1주일</option>
          <option value="month">지난 1개월</option>
        </select>
      </div>

      {loadingMeasurementData ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">측정 데이터를 불러오는 중...</span>
        </div>
      ) : filteredMeasurementData.length === 0 ? (
        <Card className="p-8 bg-white border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {measurementDataList.length === 0 ? '측정 데이터가 없습니다' : '필터 조건에 맞는 데이터가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {measurementDataList.length === 0 
                  ? (error ? error : '아직 생성된 측정 세션이 없습니다.')
                  : '검색어나 필터 조건을 변경해보세요.'
                }
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
        <div className="space-y-6">
          {currentItems.map((data) => (
            <div key={data.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* 사용자 정보 헤더 */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-900">{data.userName}</span>
                    </div>
                    
                    {/* 개인정보 Badge들 */}
                    <div className="flex items-center space-x-2">
                      {data.userAge && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          만 {data.userAge}세
                        </Badge>
                      )}
                      
                      {data.userGender && data.userGender !== '미지정' && (
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">
                          {data.userGender === 'MALE' ? '남성' : data.userGender === 'FEMALE' ? '여성' : data.userGender}
                        </Badge>
                      )}
                      
                      {data.userOccupation && data.userOccupation !== '미지정' && (
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">
                          {data.userOccupation}
                        </Badge>
                      )}
                      
                      {data.userDepartment && data.userDepartment !== '미지정' && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {data.userDepartment}
                        </Badge>
                      )}
                      
                      {data.userEmail && data.userEmail !== '' && (
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-gray-50 text-gray-700 border-gray-200 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleEmailCopy(data.id, data.userEmail)}
                        >
                          {copiedEmails[data.id] ? '복사됨!' : data.userEmail}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {data.managerInfo && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">담당자</div>
                        <div className="text-sm text-gray-700">
                          {data.managerInfo.name}{data.managerInfo.department !== '미지정' ? `(${data.managerInfo.department})` : ''}
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">측정일시</div>
                      <div className="text-sm text-gray-700">
                        {new Date(data.timestamp).toLocaleDateString('ko-KR')} {new Date(data.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleViewMeasurementData(data.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        데이터 보기
                      </Button>
                      <Button 
                        className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
                        disabled={generatingReports[data.id]?.isLoading || configLoading}
                        onClick={() => handleGenerateReportFromData(data.id, 'basic-gemini-v1')}
                      >
                        {generatingReports[data.id]?.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            AI 분석 생성
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            AI 분석 생성
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 연결된 분석 리스트 */}
              {data.hasReports && data.availableReports && data.availableReports.length > 0 ? (
                <div className="p-6">
                  <h4 className="text-sm font-medium text-purple-900 mb-4 flex items-center">
                    <Brain className="w-4 h-4 mr-2 text-purple-600" />
                    연결된 분석 리스트 ({data.availableReports.length}개)
                  </h4>
                  
                  <div className="space-y-3">
                    {data.availableReports.map((report: any) => {
                      const analysisDate = new Date(report.createdAt)
                      return (
                        <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="font-medium text-gray-900">기본 Gemini 분석</span>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">분석 엔진</div>
                                <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded text-gray-700">
                                  {report.engineId || 'basic-gemini-v1'}
                                </span>
                              </div>
                              
                                                             <div className="text-center">
                                 <div className="text-xs text-gray-500 mb-1">분석일시</div>
                                 <div className="text-sm text-gray-700">
                                   {analysisDate.toLocaleDateString('ko-KR', {
                                     year: 'numeric',
                                     month: 'numeric', 
                                     day: 'numeric'
                                   }).replace(/\//g, '. ') + '.'} {analysisDate.toLocaleTimeString('ko-KR', {
                                     hour: '2-digit',
                                     minute: '2-digit',
                                     hour12: true
                                   })}
                                 </div>
                               </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateShareLink(report)}
                                disabled={creatingShareLinks[report.id]}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                {creatingShareLinks[report.id] ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Share2 className="w-4 h-4 mr-1" />
                                )}
                                공유하기
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    리포트보기
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {getCompatibleViewers(report.engineId || 'unknown').map(viewer => (
                                    <DropdownMenuItem 
                                      key={viewer.id}
                                      onClick={() => handleViewReportWithViewer(report, viewer.id, viewer.name)}
                                      className="text-gray-900 hover:text-gray-900"
                                    >
                                      {viewer.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPDF(report.id, report)}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF 보기
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteReport(report.id, report.engineName || '분석 결과')}
                                disabled={deletingReports[report.id]}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {deletingReports[report.id] ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                삭제
                              </Button>
                            </div>
                          </div>
                          
                          {/* 공유 성공/에러 메시지 */}
                          {shareSuccess[report.id] && (
                            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                              <div className="flex items-center gap-1">
                                <Copy className="w-4 h-4" />
                                공유 링크가 클립보드에 복사되었습니다!
                              </div>
                            </div>
                          )}
                          
                          {shareError[report.id] && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                              {shareError[report.id]}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50">
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-2">아직 생성된 AI 분석 리포트가 없습니다.</p>
                    <p className="text-sm text-gray-400">위의 "AI 분석 생성" 버튼을 클릭하여 분석을 시작하세요.</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
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
                >
                  다음
                </Button>
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
      return
    }

    try {
      
      // 삭제 상태 시작
      setDeletingReports(prev => ({ ...prev, [reportId]: true }))

      // Firestore에서 분석 결과 삭제
      await FirebaseService.deleteDocument('ai_analysis_results', reportId)

      // 데이터 새로고침
      await loadMeasurementData()
      
      setError(null)

    } catch (error) {
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
      return
    }

    try {
      
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
        
        
        // 모든 AI 분석 결과 삭제
        for (const analysis of analysisResults) {
          await FirebaseService.deleteDocument('ai_analysis_results', analysis.id)
        }
      }

      // 2. 측정 세션 삭제
      await FirebaseService.deleteMeasurementSession(dataId)

      // 3. 데이터 새로고침
      await loadMeasurementData()
      
      setError(null)

    } catch (error) {
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

      {/* 측정 데이터 상세 보기 모달 */}
      {measurementDetailModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMeasurementDetailModal({
            isOpen: false,
            dataId: '',
            data: null
          })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex-shrink-0 p-6 pb-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">측정 데이터 상세 정보</h2>
                  {measurementDetailModal.data && (
                    <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                      {measurementDetailModal.data.userName || measurementDetailModal.data.subjectName || 'Unknown'}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMeasurementDetailModal({
                    isOpen: false,
                    dataId: '',
                    data: null
                  })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {measurementDetailModal.data ? (
                <MeasurementDataDetailView data={measurementDetailModal.data} />
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 