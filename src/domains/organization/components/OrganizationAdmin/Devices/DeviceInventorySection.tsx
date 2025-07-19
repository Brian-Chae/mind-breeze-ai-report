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
import { Plus, Search, Package, AlertCircle, CheckCircle, Settings } from 'lucide-react';
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
  const [newDevice, setNewDevice] = useState<CreateDeviceInventoryRequest>({
    deviceType: 'LINK_BAND_2.0',
    warrantyPeriod: 12
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

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleRegisterDevice = async () => {
    try {
      setIsRegistering(true);
      
      await deviceInventoryService.createDevice(newDevice);
      
      toast.success('새로운 디바이스가 성공적으로 등록되었습니다.');

      // 모달 닫기 및 초기화
      setIsRegisterModalOpen(false);
      setNewDevice({
        deviceType: 'LINK_BAND_2.0',
        warrantyPeriod: 12
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

  // ============================================================================
  // Data Filtering
  // ============================================================================

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ============================================================================
  // Render Helper Functions
  // ============================================================================

  const getStatusBadgeVariant = (status: DeviceInventory['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'ASSIGNED':
        return 'secondary';
      case 'IN_USE':
        return 'default';
      case 'MAINTENANCE':
        return 'destructive';
      case 'RETURNED':
        return 'outline';
      case 'DISPOSED':
        return 'destructive';
      default:
        return 'outline';
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">디바이스 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 재고</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">전체 디바이스</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가능</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">배정 대기중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 중</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
            <p className="text-xs text-muted-foreground">활성 사용</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">점검 필요</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">유지보수</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 액션 바 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="디바이스 ID 또는 타입 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="AVAILABLE">🟢 사용 가능</SelectItem>
              <SelectItem value="ASSIGNED">🔵 배정 완료</SelectItem>
              <SelectItem value="IN_USE">🟡 사용 중</SelectItem>
              <SelectItem value="MAINTENANCE">🔧 점검 중</SelectItem>
              <SelectItem value="RETURNED">🔄 반납 완료</SelectItem>
              <SelectItem value="DISPOSED">❌ 폐기</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsRegisterModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          신규 디바이스 등록
        </Button>
      </div>

      {/* 디바이스 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>디바이스 재고 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>디바이스 ID</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>보증 기간</TableHead>
                <TableHead>공급업체</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono">{device.id}</TableCell>
                  <TableCell>{device.deviceType}</TableCell>
                  <TableCell>{formatDate(device.registrationDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(device.status)}>
                      {DeviceStatusLabels[device.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{device.warrantyPeriod || 12}개월</TableCell>
                  <TableCell>{device.supplier || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={device.status}
                      onValueChange={(value) => handleStatusChange(device.id, value as DeviceInventory['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">🟢 사용 가능</SelectItem>
                        <SelectItem value="ASSIGNED">🔵 배정 완료</SelectItem>
                        <SelectItem value="IN_USE">🟡 사용 중</SelectItem>
                        <SelectItem value="MAINTENANCE">🔧 점검 중</SelectItem>
                        <SelectItem value="RETURNED">🔄 반납 완료</SelectItem>
                        <SelectItem value="DISPOSED">❌ 폐기</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredDevices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    조건에 맞는 디바이스가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 디바이스 등록 모달 */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>📝 신규 디바이스 등록</DialogTitle>
            <DialogDescription>
              새로운 디바이스를 재고에 등록합니다. 디바이스 ID는 자동으로 생성됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="deviceType">디바이스 종류 *</Label>
              <Select
                value={newDevice.deviceType}
                onValueChange={(value) => setNewDevice(prev => ({ ...prev, deviceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINK_BAND_2.0">LINK BAND 2.0</SelectItem>
                  <SelectItem value="LINK_BAND_3.0">LINK BAND 3.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchaseCost">구매 비용 (원)</Label>
              <Input
                id="purchaseCost"
                type="number"
                placeholder="예: 500000"
                value={newDevice.purchaseCost || ''}
                onChange={(e) => setNewDevice(prev => ({ 
                  ...prev, 
                  purchaseCost: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="supplier">공급업체</Label>
              <Input
                id="supplier"
                placeholder="예: LOOXID LABS"
                value={newDevice.supplier || ''}
                onChange={(e) => setNewDevice(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="warrantyPeriod">보증 기간 *</Label>
              <Select
                value={newDevice.warrantyPeriod?.toString()}
                onValueChange={(value) => setNewDevice(prev => ({ ...prev, warrantyPeriod: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6개월</SelectItem>
                  <SelectItem value="12">12개월</SelectItem>
                  <SelectItem value="24">24개월</SelectItem>
                  <SelectItem value="36">36개월</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                placeholder="특이사항이나 메모를 입력하세요..."
                value={newDevice.notes || ''}
                onChange={(e) => setNewDevice(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRegisterModalOpen(false)}
              disabled={isRegistering}
            >
              취소
            </Button>
            <Button onClick={handleRegisterDevice} disabled={isRegistering}>
              {isRegistering ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceInventorySection; 