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
  DeviceStatusLabels
} from '../../../types/device';
import companyService from '../../../services/CompanyService';

// 배정을 위한 타입 정의
interface DeviceAssignment {
  deviceId: string;
  organizationId: string;
  organizationName: string;
  assignmentType: 'rental' | 'purchase';
  rentalPeriod?: 1 | 3; // 개월
  salePrice?: number;
  notes?: string;
}

const DeviceInventorySection: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [devices, setDevices] = useState<DeviceInventory[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    available: 0,
    assigned: 0,
    inUse: 0,
    maintenance: 0,
    returned: 0,
    disposed: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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

  // 배정 모달 상태
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInventory | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [assignment, setAssignment] = useState<Partial<DeviceAssignment>>({
    assignmentType: 'rental',
    rentalPeriod: 1,
    salePrice: 297000
  });

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
        deviceInventoryService.getAllInventory(),
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

  const handleAssignDevice = (device: DeviceInventory) => {
    setSelectedDevice(device);
    setAssignment({
      deviceId: device.id,
      assignmentType: 'rental',
      rentalPeriod: 1,
      salePrice: 297000
    });
    setIsAssignModalOpen(true);
    // 모달 열 때 조직 목록 로드
    loadOrganizations();
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('정말로 이 디바이스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: DeviceInventoryService에 deleteDevice 메서드 구현 필요
      // await deviceInventoryService.deleteDevice(deviceId);
      toast.info('삭제 기능은 추후 구현 예정입니다.');
      // await loadData();
    } catch (error) {
      console.error('디바이스 삭제 실패:', error);
      toast.error('디바이스 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignment.organizationId || !selectedDevice) {
      toast.error('조직을 선택해주세요.');
      return;
    }

    try {
      setIsAssigning(true);
      
      // 디바이스 상태를 ASSIGNED로 변경
      await deviceInventoryService.updateDeviceStatus(selectedDevice.id, 'ASSIGNED');
      
      // TODO: 배정 정보를 별도 컬렉션에 저장하는 로직 추가
      // await deviceAssignmentService.createAssignment(assignment);
      
      toast.success(`${selectedDevice.id}가 ${assignment.organizationName}에 성공적으로 배정되었습니다.`);
      
      // 모달 닫기 및 초기화
      setIsAssignModalOpen(false);
      setSelectedDevice(null);
      setAssignment({
        assignmentType: 'rental',
        rentalPeriod: 1,
        salePrice: 297000
      });
      setOrgSearchTerm('');
      
      // 데이터 새로고침
      await loadData();
      
    } catch (error) {
      console.error('디바이스 배정 실패:', error);
      toast.error('디바이스 배정 중 오류가 발생했습니다.');
    } finally {
      setIsAssigning(false);
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
      'ASSIGNED': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: '배정 완료' },
      'IN_USE': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '사용 중' },
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
                <p className="text-sm font-medium text-orange-700">배정됨</p>
                <p className="text-2xl font-bold text-orange-900">{stats.assigned + stats.inUse}</p>
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
                <SelectItem value="ASSIGNED">배정 완료</SelectItem>
                <SelectItem value="IN_USE">사용 중</SelectItem>
                <SelectItem value="MAINTENANCE">점검 중</SelectItem>
                <SelectItem value="RETURNED">반납 완료</SelectItem>
                <SelectItem value="DISPOSED">폐기</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 예쁜 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">조건에 맞는 디바이스가 없습니다</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchTerm || statusFilter !== 'all' 
                            ? '검색 조건을 변경해보세요.' 
                            : '새로운 디바이스를 등록해보세요.'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
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
                          onClick={() => handleAssignDevice(device)}
                          disabled={device.status !== 'AVAILABLE'}
                          className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors px-3 py-1.5 h-auto"
                          title={device.status !== 'AVAILABLE' ? '사용 가능한 디바이스만 배정할 수 있습니다' : '디바이스 배정'}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          배정하기
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteDevice(device.id)}
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

      {/* 디바이스 배정 모달 */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-2 border-slate-300 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'white' }}>
          <DialogHeader className="pb-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">디바이스 배정</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  {selectedDevice?.id}를 조직에 배정합니다
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
                          assignment.organizationId === org.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setAssignment(prev => ({
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
                          {assignment.organizationId === org.id && (
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
                {/* 배정 유형 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    배정 유형 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={assignment.assignmentType}
                    onValueChange={(value: 'rental' | 'purchase') => 
                      setAssignment(prev => ({ ...prev, assignmentType: value }))
                    }
                  >
                    <SelectTrigger className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">렌탈</SelectItem>
                      <SelectItem value="purchase">구매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 렌탈 기간 (렌탈인 경우) */}
                {assignment.assignmentType === 'rental' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      렌탈 기간 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={assignment.rentalPeriod?.toString()}
                      onValueChange={(value) => 
                        setAssignment(prev => ({ ...prev, rentalPeriod: Number(value) as 1 | 3 }))
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

                {/* 판매 가격 (구매인 경우) */}
                {assignment.assignmentType === 'purchase' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      판매 가격 (원) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="297,000"
                      value={assignment.salePrice || ''}
                      onChange={(e) => setAssignment(prev => ({ 
                        ...prev, 
                        salePrice: e.target.value ? Number(e.target.value) : 297000 
                      }))}
                      className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500">기본값: 297,000원</p>
                  </div>
                )}
              </div>

              {/* 배정 메모 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">배정 메모</Label>
                <Textarea
                  placeholder="배정에 대한 특이사항이나 추가 정보를 입력하세요..."
                  value={assignment.notes || ''}
                  onChange={(e) => setAssignment(prev => ({ ...prev, notes: e.target.value }))}
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
              onClick={() => setIsAssignModalOpen(false)}
              disabled={isAssigning}
              className="h-10 px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirmAssignment} 
              disabled={isAssigning || !assignment.organizationId}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-400"
            >
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  배정 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  배정하기
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