/**
 * 👁️ 판매 기기 상세보기 모달 컴포넌트
 * 판매 기기의 모든 정보와 A/S 이력을 표시
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Badge } from '@ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { 
  Calendar,
  User,
  Phone,
  Mail,
  Shield,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Package,
  History
} from 'lucide-react'
import { 
  SalesListItem, 
  getWarrantyStatus,
  SalesStatusLabels,
  ServiceStatusLabels,
  ServiceUrgencyLabels
} from '@domains/organization/types/sales'

interface SalesDetailModalProps {
  isOpen: boolean
  onClose: () => void
  salesItem: SalesListItem | null
}

// 임시 A/S 이력 데이터 (실제로는 API에서 가져와야 함)
const mockServiceHistory = [
  {
    id: '1',
    requestDate: new Date('2024-06-15'),
    serviceType: 'REPAIR',
    issueDescription: '배터리 충전 문제',
    urgency: 'HIGH',
    status: 'COMPLETED',
    resolutionDescription: '배터리 교체 완료',
    completionDate: new Date('2024-06-17'),
    serviceCost: 0,
    isWarrantyService: true
  },
  {
    id: '2',
    requestDate: new Date('2024-07-01'),
    serviceType: 'INSPECTION',
    issueDescription: '정기 점검 요청',
    urgency: 'LOW',
    status: 'COMPLETED',
    resolutionDescription: '정상 작동 확인',
    completionDate: new Date('2024-07-02'),
    serviceCost: 0,
    isWarrantyService: true
  }
]

const SalesDetailModal: React.FC<SalesDetailModalProps> = ({
  isOpen,
  onClose,
  salesItem
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number): string => {
    return `₩${amount.toLocaleString()}`
  }

  const getWarrantyInfo = (item: SalesListItem) => {
    const status = getWarrantyStatus(item.warrantyEndDate)
    return {
      status,
      isActive: status !== 'EXPIRED',
      remainingDays: item.warrantyRemainingDays,
      endDate: item.warrantyEndDate
    }
  }

  const getServiceTypeLabel = (type: string): string => {
    const labels = {
      REPAIR: '수리',
      REPLACEMENT: '교체',
      REFUND: '환불',
      INSPECTION: '점검'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (!salesItem) return null

  const warrantyInfo = getWarrantyInfo(salesItem)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            판매 기기 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측 컬럼 - 기본 정보 */}
          <div className="space-y-6">
            {/* 기기 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  기기 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">디바이스 ID</p>
                    <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                      {salesItem.deviceSerialNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">모델명</p>
                    <p className="text-sm font-semibold">{salesItem.deviceModel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">상태</p>
                    <Badge variant="secondary" className={
                      salesItem.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }>
                      {SalesStatusLabels[salesItem.status] || salesItem.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">내부 ID</p>
                    <p className="text-xs text-gray-500 font-mono">{salesItem.deviceId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 판매 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  판매 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">판매일자</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm">{formatDate(salesItem.saleDate)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">판매가격</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(salesItem.salePrice)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* A/S 보증 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  A/S 보증 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {warrantyInfo.isActive ? (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          보증 기간 내
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 gap-1">
                          <AlertCircle className="w-3 h-3" />
                          보증 만료
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      만료일: {formatDate(warrantyInfo.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    {warrantyInfo.isActive ? (
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {warrantyInfo.remainingDays}
                        </p>
                        <p className="text-sm text-gray-600">일 남음</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-red-600">만료됨</p>
                        <p className="text-xs text-gray-500">유료 A/S</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측 컬럼 - 고객 정보 및 A/S 이력 */}
          <div className="space-y-6">
            {/* 고객사 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  고객사 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">고객사명</p>
                  <p className="text-lg font-semibold">{salesItem.organizationName}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">담당자</p>
                      <p className="text-sm text-gray-600">{salesItem.contactName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">연락처</p>
                      <p className="text-sm text-gray-600">{salesItem.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">이메일</p>
                      <p className="text-sm text-gray-600 break-all">{salesItem.contactEmail}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* A/S 현황 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  A/S 현황 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {salesItem.activeServiceRequests}
                    </p>
                    <p className="text-sm text-gray-600">진행 중인 A/S</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {salesItem.totalServiceRequests}
                    </p>
                    <p className="text-sm text-gray-600">총 A/S 요청</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* A/S 이력 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="w-5 h-5" />
                  A/S 이력
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockServiceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">A/S 이력이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockServiceHistory.map((service) => (
                      <div 
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={
                                service.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : service.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {ServiceStatusLabels[service.status as keyof typeof ServiceStatusLabels] || service.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getServiceTypeLabel(service.serviceType)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                service.urgency === 'CRITICAL'
                                  ? 'border-red-200 text-red-700'
                                  : service.urgency === 'HIGH'
                                  ? 'border-orange-200 text-orange-700'
                                  : 'border-gray-200 text-gray-700'
                              }`}
                            >
                              {ServiceUrgencyLabels[service.urgency as keyof typeof ServiceUrgencyLabels] || service.urgency}
                            </Badge>
                          </div>
                          <div className="text-right">
                            {service.isWarrantyService && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                보증 서비스
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">요청 내용</p>
                          <p className="text-sm text-gray-600">{service.issueDescription}</p>
                        </div>
                        
                        {service.resolutionDescription && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">처리 결과</p>
                            <p className="text-sm text-gray-600">{service.resolutionDescription}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>요청일: {formatDateTime(service.requestDate)}</span>
                            {service.completionDate && (
                              <span>완료일: {formatDateTime(service.completionDate)}</span>
                            )}
                          </div>
                          {service.serviceCost > 0 && (
                            <span className="font-medium">
                              비용: {formatCurrency(service.serviceCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SalesDetailModal