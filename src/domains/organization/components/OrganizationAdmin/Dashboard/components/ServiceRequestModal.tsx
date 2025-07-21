/**
 * 🔧 A/S 요청 처리 모달 컴포넌트
 * 판매 기기의 A/S 요청 생성 및 처리를 위한 모달
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { Textarea } from '@ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/dialog'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  X
} from 'lucide-react'
import { 
  SalesListItem, 
  ServiceType, 
  ServiceUrgency,
  CreateServiceRequestData,
  CompleteServiceRequestData,
  getWarrantyStatus
} from '@domains/organization/types/sales'

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  salesItem: SalesListItem | null
  onSubmitRequest?: (data: CreateServiceRequestData) => Promise<void>
  onCompleteService?: (data: CompleteServiceRequestData) => Promise<void>
  loading?: boolean
}

const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  salesItem,
  onSubmitRequest,
  onCompleteService,
  loading = false
}) => {
  const [mode, setMode] = useState<'create' | 'complete'>('create')
  const [formData, setFormData] = useState({
    serviceType: 'REPAIR' as ServiceType,
    urgency: 'MEDIUM' as ServiceUrgency,
    issueDescription: '',
    requestedBy: '',
    // 완료 처리용
    resolutionDescription: '',
    replacementDeviceId: '',
    serviceCost: 0
  })

  useEffect(() => {
    if (salesItem && isOpen) {
      // 진행 중인 A/S가 있으면 완료 모드로, 없으면 생성 모드로
      setMode(salesItem.activeServiceRequests > 0 ? 'complete' : 'create')
      
      // 폼 초기화
      setFormData({
        serviceType: 'REPAIR',
        urgency: 'MEDIUM',
        issueDescription: '',
        requestedBy: salesItem.contactName,
        resolutionDescription: '',
        replacementDeviceId: '',
        serviceCost: 0
      })
    }
  }, [salesItem, isOpen])

  const handleSubmit = async () => {
    if (!salesItem) return

    try {
      if (mode === 'create') {
        await onSubmitRequest?.({
          saleId: salesItem.id,
          serviceType: formData.serviceType,
          urgency: formData.urgency,
          issueDescription: formData.issueDescription,
          requestedBy: formData.requestedBy
        })
      } else {
        await onCompleteService?.({
          serviceRequestId: 'temp-id', // 실제로는 진행 중인 A/S 요청 ID를 전달해야 함
          resolutionDescription: formData.resolutionDescription,
          replacementDeviceId: formData.replacementDeviceId || undefined,
          serviceCost: formData.serviceCost,
          completedBy: 'current-user' // 실제로는 현재 사용자 ID
        })
      }
      onClose()
    } catch (error) {
      console.error('A/S 요청 처리 실패:', error)
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number): string => {
    return `₩${amount.toLocaleString()}`
  }

  const getWarrantyInfo = (item: SalesListItem) => {
    const status = getWarrantyStatus(item.warrantyEndDate)
    const isUnderWarranty = status !== 'EXPIRED'
    
    return {
      status,
      isUnderWarranty,
      remainingDays: item.warrantyRemainingDays,
      endDate: item.warrantyEndDate
    }
  }

  if (!salesItem) return null

  const warrantyInfo = getWarrantyInfo(salesItem)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            A/S {mode === 'create' ? '요청' : '처리 완료'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기기 정보 카드 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">기기 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">디바이스 ID:</span>
                  <span className="font-mono">{salesItem.deviceSerialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">모델:</span>
                  <span>{salesItem.deviceModel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">판매일:</span>
                  <span>{formatDate(salesItem.saleDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">판매가:</span>
                  <span>{formatCurrency(salesItem.salePrice)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">고객사:</span>
                  <span>{salesItem.organizationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">담당자:</span>
                  <span>{salesItem.contactName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{salesItem.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{salesItem.contactEmail}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보증 현황 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                A/S 보증 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {warrantyInfo.isUnderWarranty ? (
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
                  {warrantyInfo.isUnderWarranty && (
                    <p className="text-sm text-gray-600">
                      {warrantyInfo.remainingDays}일 남음
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {warrantyInfo.isUnderWarranty ? '무료 A/S' : '유료 A/S'}
                  </p>
                  {!warrantyInfo.isUnderWarranty && (
                    <p className="text-xs text-red-600">
                      서비스 비용이 발생할 수 있습니다
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* A/S 요청/완료 폼 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                {mode === 'create' ? 'A/S 요청 정보' : 'A/S 완료 처리'}
              </CardTitle>
              {mode === 'create' && salesItem.activeServiceRequests > 0 && (
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-100 text-blue-700">
                    진행 중인 A/S: {salesItem.activeServiceRequests}건
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode('complete')}
                  >
                    완료 처리하기
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'create' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="serviceType" className="text-sm font-medium text-gray-700">서비스 유형</label>
                      <Select
                        value={formData.serviceType}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          serviceType: value as ServiceType 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPAIR">수리</SelectItem>
                          <SelectItem value="REPLACEMENT">교체</SelectItem>
                          <SelectItem value="REFUND">환불</SelectItem>
                          <SelectItem value="INSPECTION">점검</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="urgency" className="text-sm font-medium text-gray-700">긴급도</label>
                      <Select
                        value={formData.urgency}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          urgency: value as ServiceUrgency 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">낮음</SelectItem>
                          <SelectItem value="MEDIUM">보통</SelectItem>
                          <SelectItem value="HIGH">높음</SelectItem>
                          <SelectItem value="CRITICAL">긴급</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="requestedBy" className="text-sm font-medium text-gray-700">요청자</label>
                    <Input
                      id="requestedBy"
                      value={formData.requestedBy}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        requestedBy: e.target.value 
                      }))}
                      placeholder="요청자 이름"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="issueDescription" className="text-sm font-medium text-gray-700">문제 상황</label>
                    <Textarea
                      id="issueDescription"
                      value={formData.issueDescription}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        issueDescription: e.target.value 
                      }))}
                      placeholder="발생한 문제를 상세히 설명해주세요..."
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="resolutionDescription" className="text-sm font-medium text-gray-700">처리 결과</label>
                    <Textarea
                      id="resolutionDescription"
                      value={formData.resolutionDescription}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        resolutionDescription: e.target.value 
                      }))}
                      placeholder="A/S 처리 내용을 입력해주세요..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="replacementDeviceId" className="text-sm font-medium text-gray-700">교체 기기 ID (선택)</label>
                      <Input
                        id="replacementDeviceId"
                        value={formData.replacementDeviceId}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          replacementDeviceId: e.target.value 
                        }))}
                        placeholder="교체된 기기 ID (있는 경우)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="serviceCost" className="text-sm font-medium text-gray-700">서비스 비용</label>
                      <Input
                        id="serviceCost"
                        type="number"
                        value={formData.serviceCost}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          serviceCost: Number(e.target.value) 
                        }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || (mode === 'create' && !formData.issueDescription.trim())}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  처리 중...
                </div>
              ) : (
                mode === 'create' ? 'A/S 요청' : '완료 처리'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ServiceRequestModal