/**
 * 📊 판매 통계 카드 컴포넌트
 * 판매 관리 탭에서 사용되는 통계 정보 표시
 */

import React from 'react'
import { Card, CardContent } from '@ui/card'
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Shield, AlertCircle } from 'lucide-react'
import { SalesStatistics, SalesListItem, getWarrantyStatus } from '@domains/organization/types/sales'

interface SalesStatisticsCardProps {
  statistics: SalesStatistics
  salesItems: SalesListItem[]
  loading?: boolean
}

const SalesStatisticsCard: React.FC<SalesStatisticsCardProps> = ({ 
  statistics, 
  salesItems,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number): string => {
    return `₩${amount.toLocaleString()}`
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // 성장률 계산 (예시 - 실제로는 이전 월 데이터와 비교)
  const monthlyGrowth = statistics.monthlyTrend.length >= 2 
    ? calculateGrowthRate(
        statistics.monthlyTrend[statistics.monthlyTrend.length - 1]?.sales || 0,
        statistics.monthlyTrend[statistics.monthlyTrend.length - 2]?.sales || 0
      )
    : 0

  const revenueGrowth = statistics.monthlyTrend.length >= 2 
    ? calculateGrowthRate(
        statistics.monthlyTrend[statistics.monthlyTrend.length - 1]?.revenue || 0,
        statistics.monthlyTrend[statistics.monthlyTrend.length - 2]?.revenue || 0
      )
    : 0

  // 실제 판매기기 목록 데이터를 기반으로 통계 계산
  const calculateRealTimeStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    
    // 총 판매 기기 수
    const totalSales = salesItems.length
    
    // 보증 기간 내 기기 (정상 판매)
    const activeWarranty = salesItems.filter(item => getWarrantyStatus(item.warrantyEndDate) === 'ACTIVE').length
    
    // A/S 요청이 있는 기기
    const hasServiceRequests = salesItems.filter(item => item.activeServiceRequests > 0).length
    
    // 이번 주 판매 (최근 7일)
    const thisWeekSales = salesItems.filter(item => {
      const saleDate = new Date(item.saleDate)
      return saleDate >= weekAgo
    }).length
    
    // 보증 만료 임박 기기 (30일 이내)
    const expiringSoon = salesItems.filter(item => getWarrantyStatus(item.warrantyEndDate) === 'EXPIRING_SOON').length
    
    // 보증 만료된 기기
    const expired = salesItems.filter(item => getWarrantyStatus(item.warrantyEndDate) === 'EXPIRED').length
    
    return {
      totalSales,
      activeWarranty,
      hasServiceRequests,
      thisWeekSales,
      expiringSoon,
      expired
    }
  }
  
  const realStats = calculateRealTimeStats()

  const cards = [
    {
      title: '총 판매',
      value: formatNumber(realStats.totalSales),
      subtitle: '전체 판매기기',
      icon: <RefreshCw className="w-8 h-8 text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      valueColor: 'text-orange-900'
    },
    {
      title: '보증 중', 
      value: formatNumber(realStats.activeWarranty),
      subtitle: '정상 보증기간 내',
      icon: <Shield className="w-8 h-8 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      valueColor: 'text-green-900'
    },
    {
      title: 'A/S 진행중',
      value: formatNumber(realStats.hasServiceRequests),
      subtitle: 'A/S 요청 기기',
      icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      valueColor: 'text-red-900'
    },
    {
      title: '이번 주 판매',
      value: formatNumber(realStats.thisWeekSales),
      subtitle: '최근 7일간',
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      valueColor: 'text-blue-900'
    }
  ]

  return (
    <>
      {/* 메인 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`${card.bgColor} rounded-xl p-4 border ${card.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{card.title}</p>
                <p className={`text-2xl font-bold ${card.valueColor}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-600">{card.subtitle}</p>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 정보 카드 - 실제 데이터 기반 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-green-600">💰</span>
            총 판매 수익
          </h3>
          <div className="text-3xl font-bold text-green-900 mb-2">
            {formatCurrency(salesItems.reduce((sum, item) => sum + item.salePrice, 0))}
          </div>
          <p className="text-sm text-green-700">전체 판매기기 합계</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-blue-600">📊</span>
            평균 판매가
          </h3>
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {formatCurrency(salesItems.length > 0 ? salesItems.reduce((sum, item) => sum + item.salePrice, 0) / salesItems.length : 0)}
          </div>
          <p className="text-sm text-blue-700">기기당 평균 가격</p>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            보증 만료 임박
          </h3>
          <div className="text-3xl font-bold text-amber-900 mb-2">
            {formatNumber(realStats.expiringSoon)}
          </div>
          <p className="text-sm text-amber-700">30일 이내 만료 예정</p>
        </div>
      </div>
    </>
  )
}

export default SalesStatisticsCard