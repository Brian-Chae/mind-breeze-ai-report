/**
 * 🛒 판매기기관리 탭 컴포넌트
 * 판매된 기기의 통계, 목록, A/S 관리를 위한 메인 페이지
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@ui/button'
import { RefreshCw, AlertCircle, Pause, Play, Calendar } from 'lucide-react'
import { toast } from 'sonner'

// 컴포넌트 임포트
import SalesStatisticsCard from './SalesStatisticsCard'
import SalesDeviceTable from './SalesDeviceTable'
import ServiceRequestModal from './ServiceRequestModal'
import SalesDetailModal from './SalesDetailModal'

// 타입 임포트
import { 
  SalesStatistics, 
  SalesListItem,
  CreateServiceRequestData,
  CompleteServiceRequestData 
} from '@domains/organization/types/sales'

// 서비스 임포트
import systemAdminService from '@domains/organization/services/SystemAdminService'

interface SalesManagementTabProps {
  autoRefresh?: boolean
  onAutoRefreshChange?: (enabled: boolean) => void
}

const SalesManagementTab: React.FC<SalesManagementTabProps> = ({
  autoRefresh = false,
  onAutoRefreshChange
}) => {
  // 상태 관리
  const [statistics, setStatistics] = useState<SalesStatistics | null>(null)
  const [salesItems, setSalesItems] = useState<SalesListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SalesListItem | null>(null)

  // 데이터 로드 함수
  const loadSalesData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      console.log('🔄 [SalesManagement] 판매 데이터 로딩 시작')

      // 병렬로 데이터 로드
      const [statsResult, itemsResult] = await Promise.allSettled([
        systemAdminService.getSalesStatistics(),
        systemAdminService.getSalesListItems({}, { page: 1, sortBy: 'saleDate', sortOrder: 'desc', limit: 100 })
      ])

      // 통계 데이터 처리
      if (statsResult.status === 'fulfilled') {
        setStatistics(statsResult.value)
        console.log('📊 [SalesManagement] 통계 데이터 로드 성공:', {
          totalSales: statsResult.value.totalSales,
          monthlyRevenue: statsResult.value.monthlyRevenue
        })
      } else {
        console.error('❌ [SalesManagement] 통계 데이터 로드 실패:', statsResult.reason)
      }

      // 판매 목록 데이터 처리
      if (itemsResult.status === 'fulfilled') {
        setSalesItems(itemsResult.value)
        console.log('📋 [SalesManagement] 판매 목록 데이터 로드 성공:', {
          count: itemsResult.value.length,
          items: itemsResult.value.map(item => ({
            deviceId: item.deviceId,
            organizationName: item.organizationName,
            saleDate: item.saleDate,
            salePrice: item.salePrice
          }))
        })
      } else {
        console.error('❌ [SalesManagement] 판매 목록 데이터 로드 실패:', itemsResult.reason)
      }

      // 에러 체크
      if (statsResult.status === 'rejected' && itemsResult.status === 'rejected') {
        setError('데이터를 불러오는데 실패했습니다.')
        toast.error('판매 데이터 로딩에 실패했습니다.')
      }

    } catch (error) {
      console.error('❌ [SalesManagement] 데이터 로드 중 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      toast.error('데이터 로딩 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 자동 새로고침 효과
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoRefresh) {
      interval = setInterval(() => {
        loadSalesData(true)
      }, 5000) // 5초마다 새로고침
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [autoRefresh])

  // 초기 데이터 로드
  useEffect(() => {
    loadSalesData()
  }, [])

  // A/S 요청 처리
  const handleServiceRequest = async (data: CreateServiceRequestData) => {
    try {
      await systemAdminService.createServiceRequest(data)
      toast.success('A/S 요청이 성공적으로 등록되었습니다.')
      loadSalesData(true) // 데이터 새로고침
    } catch (error) {
      console.error('A/S 요청 생성 실패:', error)
      toast.error('A/S 요청 등록에 실패했습니다.')
    }
  }

  // A/S 완료 처리
  const handleCompleteService = async (data: CompleteServiceRequestData) => {
    try {
      await systemAdminService.completeServiceRequest(data)
      toast.success('A/S 처리가 완료되었습니다.')
      loadSalesData(true) // 데이터 새로고침
    } catch (error) {
      console.error('A/S 완료 처리 실패:', error)
      toast.error('A/S 완료 처리에 실패했습니다.')
    }
  }

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    loadSalesData(true)
  }

  // 자동 새로고침 토글
  const handleAutoRefreshToggle = () => {
    const newValue = !autoRefresh
    onAutoRefreshChange?.(newValue)
    toast.success(newValue ? '자동 새로고침이 활성화되었습니다.' : '자동 새로고침이 비활성화되었습니다.')
  }

  // A/S 요청 모달 열기
  const openServiceModal = (item: SalesListItem) => {
    setSelectedItem(item)
    setServiceModalOpen(true)
  }

  // 상세보기 모달 열기
  const openDetailModal = (item: SalesListItem) => {
    setSelectedItem(item)
    setDetailModalOpen(true)
  }

  // 에러 상태 렌더링
  if (error && !statistics && salesItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">판매기기관리</h2>
            <p className="text-sm text-gray-500 mt-1">디바이스 판매 현황 및 A/S 관리</p>
          </div>
          <Button onClick={() => loadSalesData()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 로딩 실패</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => loadSalesData()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">판매기기관리</h2>
              {autoRefresh && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  5초마다 자동 새로고침
                </div>
              )}
            </div>
            <p className="text-slate-600 mt-1">디바이스 판매 현황 및 A/S 관리</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleAutoRefreshToggle}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                autoRefresh 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-4 h-4" />
                  자동새로고침 중지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  자동새로고침 시작
                </>
              )}
            </button>
            <button 
              onClick={handleRefresh}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              판매 일정 추가
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mr-3" />
            <span className="text-slate-600 text-lg">판매 데이터를 불러오는 중...</span>
          </div>
        ) : (
          <>
          {/* 통계 카드 */}
          <SalesStatisticsCard 
            statistics={statistics || {
              totalSales: 0,
              monthlyTotalSales: 0,
              todayTotalSales: 0,
              totalRevenue: 0,
              monthlyRevenue: 0,
              todayRevenue: 0,
              activeWarranties: 0,
              expiredWarranties: 0,
              pendingServiceRequests: 0,
              averageSalePrice: 0,
              customerSatisfactionRate: 0,
              monthlyTrend: [],
              topCustomers: []
            }}
            salesItems={salesItems}
            loading={loading && !statistics}
          />

          {/* 판매 기기 목록 */}
          <SalesDeviceTable
            salesItems={salesItems}
            loading={loading && salesItems.length === 0}
            onServiceRequest={openServiceModal}
            onViewDetails={openDetailModal}
            onRefresh={handleRefresh}
          />
          </>
        )}
      </div>

      {/* A/S 요청 모달 */}
      <ServiceRequestModal
        isOpen={serviceModalOpen}
        onClose={() => {
          setServiceModalOpen(false)
          setSelectedItem(null)
        }}
        salesItem={selectedItem}
        onSubmitRequest={handleServiceRequest}
        onCompleteService={handleCompleteService}
      />

      {/* 상세보기 모달 */}
      <SalesDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedItem(null)
        }}
        salesItem={selectedItem}
      />
    </div>
  )
}

export default SalesManagementTab