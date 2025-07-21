/**
 * 📋 판매 기기 목록 테이블 컴포넌트
 * 판매된 기기들의 상세 정보와 A/S 현황을 표시
 */

import React, { useState } from 'react'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { 
  Settings, 
  Eye, 
  Calendar,
  User,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Package,
  Building2
} from 'lucide-react'
import { SalesListItem, getWarrantyStatus } from '@domains/organization/types/sales'

interface SalesDeviceTableProps {
  salesItems: SalesListItem[]
  loading?: boolean
  onServiceRequest?: (item: SalesListItem) => void
  onViewDetails?: (item: SalesListItem) => void
  onRefresh?: () => void
}

const SalesDeviceTable: React.FC<SalesDeviceTableProps> = ({
  salesItems,
  loading = false,
  onServiceRequest,
  onViewDetails,
  onRefresh
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesListItem
    direction: 'asc' | 'desc'
  }>({ key: 'saleDate', direction: 'desc' })

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number): string => {
    return `₩${amount.toLocaleString()}`
  }

  // 판매 후 경과일 계산
  const getDaysSinceSale = (saleDate: Date): number => {
    const now = new Date()
    const diffTime = now.getTime() - saleDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 판매 후 경과일 표시 정보
  const getSaleDaysInfo = (saleDate: Date) => {
    const daysSinceSale = getDaysSinceSale(saleDate)
    
    if (daysSinceSale === 0) {
      return {
        text: 'D-Day',
        color: 'bg-blue-100 text-blue-700',
        badgeColor: 'bg-blue-500'
      }
    } else {
      return {
        text: `D+${daysSinceSale}`,
        color: daysSinceSale <= 7 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
        badgeColor: daysSinceSale <= 7 ? 'bg-green-500' : 'bg-gray-500'
      }
    }
  }

  const getWarrantyStatusInfo = (item: SalesListItem) => {
    const status = getWarrantyStatus(item.warrantyEndDate)
    const remainingDays = item.warrantyRemainingDays

    switch (status) {
      case 'EXPIRED':
        return {
          text: `만료됨`,
          color: 'bg-red-100 text-red-700',
          icon: <AlertCircle className="w-3 h-3" />
        }
      case 'EXPIRING_SOON':
        return {
          text: `${remainingDays}일 남음`,
          color: 'bg-yellow-100 text-yellow-700',
          icon: <Clock className="w-3 h-3" />
        }
      default:
        return {
          text: `${remainingDays}일 남음`,
          color: 'bg-green-100 text-green-700',
          icon: <Shield className="w-3 h-3" />
        }
    }
  }

  const getServiceStatusInfo = (item: SalesListItem) => {
    if (item.activeServiceRequests > 0) {
      return {
        text: `진행중 ${item.activeServiceRequests}건`,
        color: 'bg-blue-100 text-blue-700',
        icon: <Settings className="w-3 h-3" />
      }
    }
    if (item.totalServiceRequests > 0) {
      return {
        text: `완료 ${item.totalServiceRequests}건`,
        color: 'bg-gray-100 text-gray-700',
        icon: <CheckCircle className="w-3 h-3" />
      }
    }
    return {
      text: 'A/S 이력 없음',
      color: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="w-3 h-3" />
    }
  }

  const handleSort = (key: keyof SalesListItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedItems = [...salesItems].sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                📦 판매 기기 목록
              </h2>
              <div className="animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mt-1"></div>
              </div>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-orange-600" />
        판매 기기 목록 ({salesItems.length}건)
      </h3>
      
      {/* 필터 버튼 */}
      <div className="mb-4 flex gap-2">
        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
          신규 판매 (D-Day) ({salesItems.filter(item => getDaysSinceSale(item.saleDate) === 0).length})
        </button>
        <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          일주일 이내 (D+1~7) ({salesItems.filter(item => {
            const days = getDaysSinceSale(item.saleDate);
            return days >= 1 && days <= 7;
          }).length})
        </button>
        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
          일주일 이상 (D+8+) ({salesItems.filter(item => getDaysSinceSale(item.saleDate) > 7).length})
        </button>
        <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          A/S 요청 ({salesItems.filter(item => item.activeServiceRequests > 0).length})
        </button>
      </div>

      <div className="overflow-x-auto">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>판매 기기가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">판매 경과</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">디바이스 ID</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">고객사</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">담당자 정보</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">디바이스 정보</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">판매 정보</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">보증 기간</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => {
                const warrantyInfo = getWarrantyStatusInfo(item)
                const serviceInfo = getServiceStatusInfo(item)
                const saleDaysInfo = getSaleDaysInfo(item.saleDate)

                return (
                  <tr key={item.id} className={`border-b ${
                    warrantyInfo.text.includes('만료') 
                      ? 'bg-red-50 hover:bg-red-100' 
                      : warrantyInfo.text.includes('임박') 
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-slate-50'
                  } transition-colors`}>
                    {/* 판매 경과일 */}
                    <td className="py-3 px-2">
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${saleDaysInfo.color}`}>
                        {saleDaysInfo.text}
                      </div>
                    </td>

                    {/* 디바이스 ID */}
                    <td className="py-3 px-2">
                      <span className="font-mono text-sm font-medium text-slate-900">{item.deviceSerialNumber}</span>
                    </td>
                    
                    {/* 고객사 */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{item.organizationName}</span>
                      </div>
                    </td>
                    
                    {/* 담당자 정보 */}
                    <td className="py-3 px-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-700">{item.contactName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600">{item.contactPhone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600">{item.contactEmail || 'email@company.com'}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 디바이스 정보 */}
                    <td className="py-3 px-2">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-slate-900">{item.deviceModel}</span>
                      </div>
                    </td>
                    
                    {/* 판매 정보 */}
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        {/* 판매일 */}
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(item.saleDate)}
                        </div>
                        {/* 판매 금액 */}
                        <div className="text-sm text-slate-600">
                          {formatCurrency(item.salePrice)}
                        </div>
                      </div>
                    </td>

                    {/* 보증 기간 */}
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        {/* 보증 만료일 */}
                        <div className="text-sm text-slate-700">
                          만료일: {formatDate(item.warrantyEndDate)}
                        </div>
                        {/* 보증 상태 */}
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${warrantyInfo.color}`}>
                          {warrantyInfo.icon}
                          {warrantyInfo.text}
                        </div>
                      </div>
                    </td>
                    
                    {/* 액션 */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className={`px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors ${
                          warrantyInfo.text.includes('만료') 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-orange-600 hover:bg-orange-700'
                        }`} onClick={() => onServiceRequest?.(item)}>
                          {warrantyInfo.text.includes('만료') ? 'A/S 처리' : 'A/S 처리'}
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                          onClick={() => onViewDetails?.(item)}>
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default SalesDeviceTable