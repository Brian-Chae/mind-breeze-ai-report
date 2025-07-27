/**
 * 🏭 디바이스 재고 관리 섹션
 * 
 * Phase 1 기능:
 * - 신규 디바이스 등록 (Modal)
 * - 재고 현황 테이블
 * - 재고 통계 카드
 * - 검색 및 필터링
 * - 상태 변경
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Download,
  RefreshCw,
  HardDrive,
  Users,
  Activity,
  Smartphone,
  UserPlus,
  UserMinus,
  Trash2,
  Building2
} from 'lucide-react';
import { Button } from '../../../../../shared/components/ui/button';
import { Input } from '../../../../../shared/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../../shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../shared/components/ui/card';
import { Badge } from '../../../../../shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../../../shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../../../shared/components/ui/dialog';
import { Label } from '../../../../../../components/ui/label';
import { Textarea } from '../../../../../shared/components/ui/textarea';
import { toast } from 'sonner';

import { deviceInventoryService } from '../../../services/DeviceInventoryService';
import { 
  DeviceInventory,
  CreateDeviceInventoryRequest,
  InventoryStats,
  DeviceStatusLabels,
  DeviceStatus,
  BusinessType,
  CreateSalesContractRequest
} from '../../../types/device';
import companyService from '../../../services/CompanyService';
import systemAdminService from '../../../services/SystemAdminService';

// 🎯 렌탈/판매 처리를 위한 타입 정의
interface DeviceBusinessAssignment {
  deviceId: string;
  organizationId: string;
  organizationName: string;
  businessType: 'rental' | 'sale'; // 🎯 assignmentType → businessType 변경
  
  // 렌탈 관련 정보
  rentalPeriod?: 1 | 3; // 개월
  monthlyFee?: number;
  depositAmount?: number;
  
  // 판매 관련 정보
  salePrice?: number;
  
  // 공통 정보
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

const DeviceInventorySection: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [devices, setDevices] = useState<DeviceInventory[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    available: 0,
    rented: 0,      // 🎯 assigned → rented 변경
    sold: 0,        // 🎯 새로 추가
    inUse: 0,
    maintenance: 0,
    returned: 0,
    disposed: 0,
    // 🔄 하위 호환성을 위해 assigned 유지
    assigned: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  

  
  // 🎯 렌탈/판매된 조직 정보 조회
  const getBusinessOrganization = (device: DeviceInventory) => {
    // 새로운 데이터 구조 우선 확인
    if (device.businessType === BusinessType.RENTAL && device.rentalOrganizationName) {
      return {
        name: device.rentalOrganizationName,
        code: device.rentalOrganizationCode || '-',
        type: '렌탈' as const
      };
    }
    
    if (device.businessType === BusinessType.SALE && device.soldToOrganizationName) {
      return {
        name: device.soldToOrganizationName,
        code: device.soldToOrganizationCode || '-',
        type: '판매' as const
      };
    }
    
    // 🔄 기존 데이터 구조 (하위 호환성)
    if (device.assignedOrganizationName && device.assignedOrganizationCode) {
      return {
        name: device.assignedOrganizationName,
        code: device.assignedOrganizationCode,
        type: '배정' as const // 임시 - 추후 마이그레이션 필요
      };
    }
    
    // 처리되지 않은 경우
    return { name: '-', code: '-', type: '-' as const };
  };
  
  // 등록 모달 상태
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceIdSuffix, setDeviceIdSuffix] = useState(''); // LXB- 뒤 부분만 저장
  const [newDevice, setNewDevice] = useState<CreateDeviceInventoryRequest & { deviceName: string }>({
    deviceName: '',
    deviceType: 'LINK_BAND_2.0',
    warrantyPeriod: 12,
    registrationDate: new Date(),
    purchaseCost: 297000
  });

  // 🎯 렌탈/판매 처리 모달 상태
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInventory | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [businessAssignment, setBusinessAssignment] = useState<Partial<DeviceBusinessAssignment>>({
    businessType: 'rental', // 🎯 assignmentType → businessType 변경
    rentalPeriod: 1,
    salePrice: 297000,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    monthlyFee: undefined,
    depositAmount: undefined
  });

  // 삭제 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceInventory | null>(null);

  // 🎯 반납/회수 처리 모달 상태
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [deviceToReturn, setDeviceToReturn] = useState<DeviceInventory | null>(null);

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryResponse, inventoryStats] = await Promise.all([
        deviceInventoryService.getDevices(),
        deviceInventoryService.getInventoryStats()
      ]);

      if (inventoryResponse.success && inventoryResponse.data) {
        setDevices(inventoryResponse.data);
      }
      setStats(inventoryStats);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      toast.error('디바이스 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 조직 코드 생성 함수 (ORG2034 형태)
  const generateOrganizationCode = (existingCodes: string[], index: number): string => {
    let code: string;
    let attempts = 0;
    
    do {
      const baseNumber = 2000 + index + attempts;
      code = `ORG${baseNumber.toString().padStart(4, '0')}`;
      attempts++;
    } while (existingCodes.includes(code) && attempts < 100);
    
    return code;
  };

  const loadOrganizations = async () => {
    try {
      // 최근 조직 목록을 가져오기 (임시로 100개 제한)
      const orgs = await companyService.getRecentOrganizations(100);
      console.log('로드된 조직 목록:', orgs);
      
      // 기존 조직 코드 목록 추출
      const existingCodes = orgs
        .map(org => org.organizationCode)
        .filter(code => code !== undefined && code !== null);
      
      // 조직 코드가 없는 경우 고유한 코드 생성
      const orgsWithCodes = orgs.map((org, index) => ({
        ...org,
        organizationCode: org.organizationCode || generateOrganizationCode(existingCodes, index)
      }));
      
      setOrganizations(orgsWithCodes);
      console.log('코드 추가된 조직 목록:', orgsWithCodes);
    } catch (error) {
      console.error('조직 목록 로딩 실패:', error);
      toast.error('조직 목록을 불러올 수 없습니다.');
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleRegisterDevice = async () => {
    try {
      setIsRegistering(true);
      
      // LXB- + 입력한 suffix로 완전한 디바이스 이름 조합
      const fullDeviceName = `LXB-${deviceIdSuffix}`;
      
      // deviceName을 제외한 나머지 데이터만 서비스에 전달
      const { deviceName, ...deviceData } = newDevice;
      await deviceInventoryService.createDevice(deviceData, fullDeviceName);
      
      toast.success('새로운 디바이스가 성공적으로 등록되었습니다.');

      // 모달 닫기 및 초기화
      setIsRegisterModalOpen(false);
      setDeviceIdSuffix('');
      setNewDevice({
        deviceName: '',
        deviceType: 'LINK_BAND_2.0',
        warrantyPeriod: 12,
        registrationDate: new Date(),
        purchaseCost: 297000
      });

      // 데이터 새로고침
      await loadData();

    } catch (error) {
      console.error('디바이스 등록 실패:', error);
      toast.error('디바이스 등록 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStatusChange = async (deviceId: string, newStatus: DeviceInventory['status']) => {
    try {
      await deviceInventoryService.updateDeviceStatus(deviceId, newStatus);
      
      toast.success(`디바이스 상태가 ${DeviceStatusLabels[newStatus]}로 변경되었습니다.`);

      // 데이터 새로고침
      await loadData();

    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('디바이스 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleBusinessDevice = (device: DeviceInventory) => {
    setSelectedDevice(device);
    setBusinessAssignment({
      deviceId: device.id,
      businessType: 'rental',
      rentalPeriod: 1,
      salePrice: 297000,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      monthlyFee: undefined,
      depositAmount: undefined
    });
    setIsBusinessModalOpen(true);
    // 모달 열 때 조직 목록 로드
    loadOrganizations();
  };

  const handleDeleteDevice = (device: DeviceInventory) => {
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      setIsDeleting(true);
      
      await deviceInventoryService.deleteDevice(deviceToDelete.id);
      
      toast.success(`${deviceToDelete.id}가 성공적으로 삭제되었습니다.`);
      
      // 모달 닫기 및 초기화
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);
      
      // 데이터 새로고침
      await loadData();
      
    } catch (error: any) {
      console.error('디바이스 삭제 실패:', error);
      toast.error(error.message || '디바이스 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeviceToDelete(null);
  };

  const handleReturnDevice = (device: DeviceInventory) => {
    setDeviceToReturn(device);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!deviceToReturn) return;

    try {
      setIsReturning(true);
      
      await deviceInventoryService.unassignDevice(deviceToReturn.id);
      
      toast.success(`${deviceToReturn.id}의 반납/회수가 완료되었습니다.`);
      
      // 모달 닫기 및 초기화
      setIsReturnModalOpen(false);
      setDeviceToReturn(null);
      
      // 데이터 새로고침
      await loadData();
      
    } catch (error: any) {
      console.error('디바이스 반납/회수 실패:', error);
      toast.error(error.message || '디바이스 반납/회수 중 오류가 발생했습니다.');
    } finally {
      setIsReturning(false);
    }
  };

  const handleCancelReturn = () => {
    setIsReturnModalOpen(false);
    setDeviceToReturn(null);
  };

  const handleConfirmBusiness = async () => {
    if (!businessAssignment.organizationId || !selectedDevice) {
      toast.error('조직을 선택해주세요.');
      return;
    }

    // 렌탈/판매인 경우 필수 정보 검증
    if (businessAssignment.businessType === 'rental' || businessAssignment.businessType === 'sale') {
      if (!businessAssignment.contactName || !businessAssignment.contactEmail || !businessAssignment.contactPhone) {
        const businessTypeLabel = businessAssignment.businessType === 'rental' ? '렌탈' : '판매';
        toast.error(`${businessTypeLabel} 담당자 정보를 모두 입력해주세요.`);
        return;
      }
    }

    // 선택된 조직 정보 찾기
    const selectedOrganization = organizations.find(org => org.id === businessAssignment.organizationId);
    if (!selectedOrganization) {
      toast.error('선택된 조직 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 디바이스 렌탈/판매 정보 업데이트 (상태 변경 + 조직 정보 저장)
      await deviceInventoryService.updateDeviceAssignment(
        selectedDevice.id,
        selectedOrganization.id,
        selectedOrganization.organizationName,
        selectedOrganization.organizationCode,
        businessAssignment.businessType,
        {
          contactName: businessAssignment.contactName,
          contactEmail: businessAssignment.contactEmail,
          contactPhone: businessAssignment.contactPhone,
          salePrice: businessAssignment.salePrice
        }
      );
      
      // 렌탈인 경우 렌탈 계약 생성
      if (businessAssignment.businessType === 'rental' && businessAssignment.rentalPeriod) {
        try {
          // 월 렌탈료와 보증금 설정 (사용자가 입력한 값 또는 기본값 사용)
          const monthlyFee = businessAssignment.monthlyFee || (businessAssignment.rentalPeriod === 1 ? 50000 : 40000);
          const depositAmount = businessAssignment.depositAmount || 100000;
          
          await systemAdminService.createRental({
            deviceId: selectedDevice.id,
            organizationId: selectedOrganization.id,
            organizationName: selectedOrganization.organizationName,
            contractType: 'RENTAL',
            rentalPeriod: businessAssignment.rentalPeriod,
            monthlyFee: monthlyFee,
            depositAmount: depositAmount,
            contactName: businessAssignment.contactName!,
            contactEmail: businessAssignment.contactEmail!,
            contactPhone: businessAssignment.contactPhone!,
            startDate: new Date(),
            notes: businessAssignment.notes || ''
          });
          
          toast.success(`${selectedDevice.id}가 ${selectedOrganization.organizationName}에 렌탈로 처리되었습니다.`);
        } catch (rentalError) {
          console.error('렌탈 계약 생성 실패:', rentalError);
          toast.error('렌탈 계약 생성 중 오류가 발생했습니다. 관리자에게 문의하세요.');
        }
      } else if (businessAssignment.businessType === 'sale') {
        toast.success(`${selectedDevice.id}가 ${selectedOrganization.organizationName}에 판매로 처리되었습니다.`);
      }
      
      // 모달 닫기 및 초기화
      setIsBusinessModalOpen(false);
      setSelectedDevice(null);
      setBusinessAssignment({
        businessType: 'rental',
        rentalPeriod: 1,
        salePrice: 297000,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        monthlyFee: undefined,
        depositAmount: undefined
      });
      setOrgSearchTerm('');
      
      // 데이터 새로고침
      await loadData();
      
    } catch (error) {
      console.error('디바이스 렌탈/판매 처리 실패:', error);
      toast.error('디바이스 렌탈/판매 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // Data Filtering
  // ============================================================================

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredOrganizations = organizations.filter(org => 
    org.organizationName?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
    org.organizationCode?.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  // ============================================================================
  // Render Helper Functions
  // ============================================================================

  const getStatusBadge = (status: DeviceInventory['status']) => {
    const statusConfig = {
      'AVAILABLE': { color: 'bg-green-50 text-green-700 border-green-200', label: '사용 가능' },
      'RENTED': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: '렌탈중' }, // 🎯 새로 추가
      'SOLD': { color: 'bg-purple-50 text-purple-700 border-purple-200', label: '판매완료' }, // 🎯 새로 추가  
      'ASSIGNED': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: '판매완료' }, // 🎯 하위 호환성: ASSIGNED → 판매완료
      'IN_USE': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '렌탈중' }, // 🎯 수정: 사용중 → 렌탈중
      'MAINTENANCE': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: '점검 중' },
      'RETURNED': { color: 'bg-gray-50 text-gray-700 border-gray-200', label: '반납 완료' },
      'DISPOSED': { color: 'bg-red-50 text-red-700 border-red-200', label: '폐기' }
    };
    
    const config = statusConfig[status] || statusConfig['AVAILABLE'];
    
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">재고 데이터 로드 중</h3>
              <p className="text-slate-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 카드 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">재고 관리</h2>
            <p className="text-slate-600 mt-1">전체 디바이스 재고 현황 및 관리</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              신규 등록
            </button>
            <button 
              onClick={loadData}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
            <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              재고 리포트
            </button>
          </div>
        </div>
        
        {/* 재고 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">총 재고</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <HardDrive className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">사용 가능</p>
                <p className="text-2xl font-bold text-green-900">{stats.available}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">렌탈/판매</p>
                <p className="text-2xl font-bold text-orange-900">{(stats.rented || stats.assigned || 0) + (stats.sold || 0) + stats.inUse}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">점검 필요</p>
                <p className="text-2xl font-bold text-red-900">{stats.maintenance}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 디바이스 목록 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">디바이스 재고 목록</h3>
            <p className="text-sm text-slate-600">등록된 모든 디바이스 현황 ({filteredDevices.length}개)</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="디바이스 ID 또는 타입 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="AVAILABLE">사용 가능</SelectItem>
                <SelectItem value="RENTED">렌탈 중</SelectItem>
                <SelectItem value="SOLD">판매 완료</SelectItem>
                <SelectItem value="ASSIGNED">처리 완료</SelectItem>
                <SelectItem value="IN_USE">사용 중</SelectItem>
                <SelectItem value="MAINTENANCE">점검 중</SelectItem>
                <SelectItem value="RETURNED">반납 완료</SelectItem>
                <SelectItem value="DISPOSED">폐기</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 배정 대기 목록 */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">배정 대기 목록</h3>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {filteredDevices.filter(device => device.status === 'AVAILABLE').length}개
                </Badge>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4">디바이스 ID</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">종류</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">보증 기간</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">상태</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">등록일</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.filter(device => device.status === 'AVAILABLE').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                          <Package className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">배정 대기 중인 디바이스가 없습니다</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm 
                              ? '검색 조건에 맞는 배정 대기 디바이스가 없습니다.' 
                              : '새로운 디바이스를 등록해보세요.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices
                    .filter(device => device.status === 'AVAILABLE')
                    .map((device) => (
                      <TableRow key={device.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                        {/* 디바이스 ID */}
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{device.id}</span>
                          </div>
                        </TableCell>
                        
                        {/* 종류 */}
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {device.deviceType}
                          </Badge>
                        </TableCell>
                        
                        {/* 보증 기간 */}
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-700">
                            {device.warrantyPeriod ? `${device.warrantyPeriod}개월` : '-'}
                          </span>
                        </TableCell>
                        
                        {/* 상태 */}
                        <TableCell className="py-4">
                          {getStatusBadge(device.status)}
                        </TableCell>
                        
                        {/* 등록일 */}
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(device.registrationDate)}
                          </span>
                        </TableCell>
                        
                        {/* 액션 */}
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBusinessDevice(device)}
                              className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors px-3 py-1.5 h-auto"
                              title="디바이스 배정"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              렌탈/판매
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteDevice(device)}
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors px-3 py-1.5 h-auto"
                              title="디바이스 삭제"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 🎯 렌탈/판매 완료 목록 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">렌탈/판매 완료 목록</h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  {filteredDevices.filter(device => device.status !== 'AVAILABLE').length}개
                </Badge>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4">디바이스 ID</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">종류</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">보증 기간</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">상태</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">렌탈/판매 기관</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">등록일</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.filter(device => device.status !== 'AVAILABLE').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">렌탈/판매 완료된 디바이스가 없습니다</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm 
                              ? '검색 조건에 맞는 렌탈/판매 완료 디바이스가 없습니다.' 
                              : '디바이스를 렌탈 또는 판매 처리하면 여기에 표시됩니다.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices
                    .filter(device => device.status !== 'AVAILABLE')
                    .map((device) => (
                      <TableRow key={device.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                        {/* 디바이스 ID */}
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{device.id}</span>
                          </div>
                        </TableCell>
                        
                        {/* 종류 */}
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {device.deviceType}
                          </Badge>
                        </TableCell>
                        
                        {/* 보증 기간 */}
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-700">
                            {device.warrantyPeriod ? `${device.warrantyPeriod}개월` : '-'}
                          </span>
                        </TableCell>
                        
                        {/* 상태 */}
                        <TableCell className="py-4">
                          {getStatusBadge(device.status)}
                        </TableCell>
                        
                        {/* 렌탈/판매 기관 */}
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {getBusinessOrganization(device).name}
                              </span>
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {getBusinessOrganization(device).type}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {getBusinessOrganization(device).code}
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* 등록일 */}
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(device.registrationDate)}
                          </span>
                        </TableCell>
                        
                        {/* 액션 */}
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReturnDevice(device)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400 transition-colors px-3 py-1.5 h-auto"
                              title="디바이스 반납/회수"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              반납/회수
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteDevice(device)}
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors px-3 py-1.5 h-auto"
                              title="디바이스 삭제"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 디바이스 등록 모달 */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-2 border-slate-300 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'white' }}>
          <DialogHeader className="pb-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">신규 디바이스 등록</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  새로운 LINK BAND 디바이스를 재고에 등록합니다
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-8 bg-white">
            {/* 기본 정보 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">기본 정보</h3>
                <span className="text-sm text-slate-500">(필수)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium text-slate-700">
                    디바이스 이름 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium pointer-events-none">
                      LXB-
                    </div>
                    <Input
                      id="deviceName"
                      placeholder="02630003"
                      value={deviceIdSuffix}
                      onChange={(e) => setDeviceIdSuffix(e.target.value)}
                      className="h-10 pl-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    디바이스 고유 번호를 입력하세요 (완성 예: LXB-{deviceIdSuffix || '02630003'})
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceType" className="text-sm font-medium text-slate-700">
                    디바이스 종류 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newDevice.deviceType}
                    onValueChange={(value) => setNewDevice(prev => ({ ...prev, deviceType: value }))}
                  >
                    <SelectTrigger className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINK_BAND_1.0">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-slate-500" />
                          LINK BAND 1.0
                        </div>
                      </SelectItem>
                      <SelectItem value="LINK_BAND_2.0">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-slate-500" />
                          LINK BAND 2.0
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDate" className="text-sm font-medium text-slate-700">
                    등록 일자 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registrationDate"
                    value={newDevice.registrationDate?.toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                    readOnly
                    className="h-10 bg-slate-50 border-slate-300 cursor-not-allowed text-slate-600"
                  />
                  <p className="text-xs text-slate-500">현재 시간으로 자동 설정됩니다</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyPeriod" className="text-sm font-medium text-slate-700">
                    보증 기간 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newDevice.warrantyPeriod?.toString()}
                    onValueChange={(value) => setNewDevice(prev => ({ ...prev, warrantyPeriod: Number(value) }))}
                  >
                    <SelectTrigger className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6개월</SelectItem>
                      <SelectItem value="12">12개월 (권장)</SelectItem>
                      <SelectItem value="24">24개월</SelectItem>
                      <SelectItem value="36">36개월</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 추가 정보 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">추가 정보</h3>
                <span className="text-sm text-slate-500">(선택)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="purchaseCost" className="text-sm font-medium text-slate-700">
                    구매 비용 (원)
                  </Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    placeholder="297,000"
                    value={newDevice.purchaseCost || ''}
                    onChange={(e) => setNewDevice(prev => ({ 
                      ...prev, 
                      purchaseCost: e.target.value ? Number(e.target.value) : 297000 
                    }))}
                    className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">디바이스 구매 비용 (기본값: 297,000원)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-medium text-slate-700">
                    공급업체
                  </Label>
                  <Input
                    id="supplier"
                    placeholder="LOOXID LABS"
                    value={newDevice.supplier || ''}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, supplier: e.target.value }))}
                    className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">디바이스 제조사 또는 공급업체</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                  메모
                </Label>
                <Textarea
                  id="notes"
                  placeholder="디바이스에 대한 특이사항이나 추가 정보를 입력하세요..."
                  value={newDevice.notes || ''}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="bg-slate-50 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus:bg-white resize-none"
                />
                <p className="text-xs text-slate-500">최대 500자까지 입력 가능합니다</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-200 gap-3 bg-white">
            <Button
              variant="outline"
              onClick={() => setIsRegisterModalOpen(false)}
              disabled={isRegistering}
              className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button 
              onClick={handleRegisterDevice} 
              disabled={isRegistering || !deviceIdSuffix.trim()}
              className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-400"
            >
              {isRegistering ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  등록 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  등록하기
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 디바이스 렌탈/판매 처리 모달 */}
      <Dialog open={isBusinessModalOpen} onOpenChange={setIsBusinessModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-2 border-slate-300 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'white' }}>
          <DialogHeader className="pb-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">디바이스 렌탈/판매 처리</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  {selectedDevice?.id}를 조직에 렌탈 또는 판매 처리합니다
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-8 bg-white">
            {/* 조직 선택 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">조직 선택</h3>
                <span className="text-sm text-slate-500">(필수)</span>
              </div>

              {/* 조직 검색 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">조직 검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="조직명 또는 조직코드로 검색..."
                    value={orgSearchTerm}
                    onChange={(e) => setOrgSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 조직 목록 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  등록된 조직 목록 <span className="text-red-500">*</span>
                </Label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredOrganizations.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <div
                        key={org.id}
                        className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                          businessAssignment.organizationId === org.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setBusinessAssignment(prev => ({
                          ...prev,
                          organizationId: org.id,
                          organizationName: org.organizationName
                        }))}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">{org.organizationName}</div>
                            <div className="text-sm text-slate-600">코드: {org.organizationCode || 'N/A'}</div>
                          </div>
                          {businessAssignment.organizationId === org.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 배정 조건 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">배정 조건</h3>
                <span className="text-sm text-slate-500">(필수)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 비즈니스 유형 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    비즈니스 유형 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={businessAssignment.businessType}
                    onValueChange={(value: 'rental' | 'sale') => 
                      setBusinessAssignment(prev => ({ ...prev, businessType: value }))
                    }
                  >
                    <SelectTrigger className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">렌탈</SelectItem>
                      <SelectItem value="sale">판매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 렌탈 기간 (렌탈인 경우) */}
                {businessAssignment.businessType === 'rental' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      렌탈 기간 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={businessAssignment.rentalPeriod?.toString()}
                      onValueChange={(value) => 
                        setBusinessAssignment(prev => ({ ...prev, rentalPeriod: Number(value) as 1 | 3 }))
                      }
                    >
                      <SelectTrigger className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1개월</SelectItem>
                        <SelectItem value="3">3개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 판매 가격 (판매인 경우) */}
                {businessAssignment.businessType === 'sale' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      판매 가격 (원) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="297,000"
                      value={businessAssignment.salePrice || ''}
                      onChange={(e) => setBusinessAssignment(prev => ({ 
                        ...prev, 
                        salePrice: e.target.value ? Number(e.target.value) : 297000 
                      }))}
                      className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500">기본값: 297,000원</p>
                  </div>
                )}
              </div>

              {/* 렌탈/판매 담당자 정보 (렌탈 또는 판매인 경우) */}
              {(businessAssignment.businessType === 'rental' || businessAssignment.businessType === 'sale') && (
                <>
                  <div className="flex items-center gap-2 mb-4 mt-6">
                    <div className={`w-1 h-6 rounded-full ${businessAssignment.businessType === 'rental' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {businessAssignment.businessType === 'rental' ? '렌탈' : '판매'} 담당자 정보
                    </h3>
                    <span className="text-sm text-slate-500">(필수)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 담당자 이름 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        담당자 이름 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="홍길동"
                        value={businessAssignment.contactName || ''}
                        onChange={(e) => setBusinessAssignment(prev => ({ ...prev, contactName: e.target.value }))}
                        className={`h-10 border-slate-300 ${businessAssignment.businessType === 'rental' ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-purple-500 focus:ring-purple-500'}`}
                      />
                    </div>

                    {/* 담당자 이메일 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        담당자 이메일 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="example@company.com"
                        value={businessAssignment.contactEmail || ''}
                        onChange={(e) => setBusinessAssignment(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className={`h-10 border-slate-300 ${businessAssignment.businessType === 'rental' ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-purple-500 focus:ring-purple-500'}`}
                      />
                    </div>

                    {/* 담당자 연락처 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        담당자 연락처 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="010-0000-0000"
                        value={businessAssignment.contactPhone || ''}
                        onChange={(e) => setBusinessAssignment(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className={`h-10 border-slate-300 ${businessAssignment.businessType === 'rental' ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-purple-500 focus:ring-purple-500'}`}
                      />
                    </div>

                    {/* 월 렌탈료 (렌탈인 경우만) */}
                    {businessAssignment.businessType === 'rental' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          월 렌탈료 (원) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder={businessAssignment.rentalPeriod === 1 ? "50,000" : "40,000"}
                          value={businessAssignment.monthlyFee || ''}
                          onChange={(e) => setBusinessAssignment(prev => ({ 
                            ...prev, 
                            monthlyFee: e.target.value ? Number(e.target.value) : undefined 
                          }))}
                          className="h-10 border-slate-300 focus:border-green-500 focus:ring-green-500"
                        />
                        <p className="text-xs text-slate-500">
                          기본값: {businessAssignment.rentalPeriod === 1 ? "50,000원" : "40,000원"}
                        </p>
                      </div>
                    )}

                    {/* 보증금 (렌탈인 경우만) */}
                    {businessAssignment.businessType === 'rental' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          보증금 (원) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="100,000"
                          value={businessAssignment.depositAmount || ''}
                          onChange={(e) => setBusinessAssignment(prev => ({ 
                            ...prev, 
                            depositAmount: e.target.value ? Number(e.target.value) : undefined 
                          }))}
                          className="h-10 border-slate-300 focus:border-green-500 focus:ring-green-500"
                        />
                        <p className="text-xs text-slate-500">기본값: 100,000원</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 처리 메모 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {businessAssignment.businessType === 'rental' ? '렌탈' : '판매'} 메모
                </Label>
                <Textarea
                  placeholder={`${businessAssignment.businessType === 'rental' ? '렌탈' : '판매'}에 대한 특이사항이나 추가 정보를 입력하세요...`}
                  value={businessAssignment.notes || ''}
                  onChange={(e) => setBusinessAssignment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="bg-slate-50 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus:bg-white resize-none"
                />
                <p className="text-xs text-slate-500">최대 500자까지 입력 가능합니다</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-200 gap-3 bg-white">
            <Button
              variant="outline"
              onClick={() => setIsBusinessModalOpen(false)}
              disabled={isProcessing}
              className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirmBusiness} 
              disabled={isProcessing || !businessAssignment.organizationId}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-400"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  처리 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  렌탈/판매 처리
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 디바이스 삭제 확인 모달 */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-300 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'white' }}>
          <DialogHeader className="pb-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">디바이스 삭제</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  이 작업은 되돌릴 수 없습니다
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 bg-white">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium text-slate-900">
                정말로 <span className="font-bold text-red-600">{deviceToDelete?.id}</span>를 삭제하시겠습니까?
              </div>
              <div className="text-sm text-slate-600">
                삭제된 디바이스는 복구할 수 없으며, 모든 관련 데이터가 영구적으로 제거됩니다.
              </div>
              {deviceToDelete?.status === 'ASSIGNED' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">
                    ⚠️ 이 디바이스는 현재 배정된 상태입니다
                  </div>
                  <div className="text-xs text-orange-700 mt-1">
                    배정된 디바이스는 삭제할 수 없습니다
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white pt-4">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting || deviceToDelete?.status === 'ASSIGNED'}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>삭제 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>삭제하기</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 디바이스 반납/회수 확인 모달 */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-slate-300 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'white' }}>
          <DialogHeader className="pb-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <UserMinus className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">디바이스 반납/회수</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  디바이스를 재고 대기 상태로 되돌립니다
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 bg-white">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium text-slate-900">
                <span className="font-bold text-orange-600">{deviceToReturn?.id}</span>의 반납/회수를 진행하시겠습니까?
              </div>
              <div className="text-sm text-slate-600">
                반납/회수 후 디바이스는 다시 재고 대기 목록으로 이동합니다.
              </div>
              {deviceToReturn && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">
                    현재 렌탈/판매 정보
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    기관: {getBusinessOrganization(deviceToReturn).name}
                  </div>
                  <div className="text-xs text-blue-700">
                    코드: {getBusinessOrganization(deviceToReturn).code}
                  </div>
                  <div className="text-xs text-blue-700">
                    유형: {getBusinessOrganization(deviceToReturn).type}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white pt-4">
            <Button
              variant="outline"
              onClick={handleCancelReturn}
              disabled={isReturning}
              className="flex-1 text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmReturn}
              disabled={isReturning}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
            >
              {isReturning ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>처리 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserMinus className="w-4 h-4" />
                  <span>반납/회수</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceInventorySection; 