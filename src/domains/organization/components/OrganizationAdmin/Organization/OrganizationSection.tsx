import React, { useState, useEffect } from 'react'
import {
  Building2,
  Edit,
  Save,
  Plus,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Globe,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  User,
  Shield,
  Settings,
  MoreHorizontal,
  Loader2,
  X,
  RefreshCw
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'

// Firebase 서비스 import
import { OrganizationService, OrganizationInfo } from '../../../services/CompanyService'
import { memberManagementService } from '../../../services/MemberManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

interface OrganizationSectionProps {
  subSection: string;
  onNavigate: (sectionId: string, subSectionId?: string) => void;
}

interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  establishedDate: string;
  description: string;
  license: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  manager: string;
  memberCount: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface OrganizationNode {
  id: string;
  name: string;
  type: 'company' | 'department' | 'team';
  manager: string;
  memberCount: number;
  children?: OrganizationNode[];
}

export default function OrganizationSection({ subSection, onNavigate }: OrganizationSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false)

  // 실제 데이터 상태
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null)
  const [members, setMembers] = useState<any[]>([]) // MemberManagementData 대신 any[]로 변경
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    size: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    establishedDate: '',
    description: '',
    license: ''
  })

  // 조직 관리 데이터 (실제 데이터 기반)
  const [departments, setDepartments] = useState<Department[]>([])

  // 조직 구조 데이터 생성 (실제 데이터 기반)
  const getOrganizationStructure = (): OrganizationNode => {
    const totalMembers = members.length
    const activeMembers = members.filter(m => m.isActive).length
    
    return {
      id: 'root',
      name: organizationInfo?.organizationName || '조직',
      type: 'company',
      manager: '관리자',
      memberCount: totalMembers,
      children: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        type: 'department' as const,
        manager: dept.manager,
        memberCount: dept.memberCount
      }))
    }
  }

  // 데이터 로드
  useEffect(() => {
    loadOrganizationData()
  }, [subSection])

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.user.organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        return
      }

      const organizationId = currentContext.user.organizationId

      // 서브섹션별로 필요한 데이터만 로드
      switch (subSection) {
        case 'company-info':
          // 기업 정보만 로드
          const organizationData = await OrganizationService.getOrganizationById(organizationId)
          if (organizationData) {
            setOrganizationInfo(organizationData)
            setCompanyInfo({
              name: organizationData.organizationName,
              industry: organizationData.industry,
              size: `${organizationData.initialMemberCount}명`,
              address: organizationData.address,
              phone: organizationData.contactPhone,
              email: organizationData.contactEmail,
              website: organizationData.address,
              establishedDate: organizationData.createdAt?.toDate?.()?.toLocaleDateString() || '',
              description: `${organizationData.organizationName}의 기업 정보`,
              license: organizationData.businessNumber
            })
          }
          break

        case 'departments':
        case 'structure':
          // 조직 관리 및 구조에 필요한 데이터 로드
          const [orgData, membersResponse] = await Promise.all([
            OrganizationService.getOrganizationById(organizationId),
            memberManagementService.getOrganizationMembers(organizationId)
          ])

          if (orgData) {
            setOrganizationInfo(orgData)
          }

          // MemberListResponse에서 members 배열 추출
          const membersData = membersResponse.members
          setMembers(membersData)
          
          // 부서별 멤버 수 계산하여 departments 생성
          const departmentMap = new Map<string, number>()
          membersData.forEach(member => {
            // OrganizationMember는 departments 배열을 가지므로 각 부서별로 카운트
            member.departments?.forEach(departmentId => {
              departmentMap.set(departmentId, (departmentMap.get(departmentId) || 0) + 1)
            })
          })

          const departmentList: Department[] = Array.from(departmentMap.entries()).map(([deptName, count], index) => ({
            id: `dept-${index}`,
            name: deptName,
            description: `${deptName} 부서`,
            manager: '관리자',
            memberCount: count,
            createdAt: new Date().toLocaleDateString(),
            status: 'active' as const
          }))

          setDepartments(departmentList)
          break

        default:
          // 기본값으로 기업 정보 로드
          const defaultOrgData = await OrganizationService.getOrganizationById(organizationId)
          if (defaultOrgData) {
            setOrganizationInfo(defaultOrgData)
            setCompanyInfo({
              name: defaultOrgData.organizationName,
              industry: defaultOrgData.industry,
              size: `${defaultOrgData.initialMemberCount}명`,
              address: defaultOrgData.address,
              phone: defaultOrgData.contactPhone,
              email: defaultOrgData.contactEmail,
              website: defaultOrgData.address,
              establishedDate: defaultOrgData.createdAt?.toDate?.()?.toLocaleDateString() || '',
              description: `${defaultOrgData.organizationName}의 기업 정보`,
              license: defaultOrgData.businessNumber
            })
          }
          break
      }

    } catch (err) {
      console.error('조직 데이터 로드 오류:', err)
      setError('조직 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">조직 데이터를 불러오는 중...</span>
      </div>
    )
  }

  // 오류 발생 시
  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadOrganizationData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  // 기업 정보 렌더링
  const renderCompanyInfo = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">기업 정보</h2>
          <Button
            onClick={() => setEditingCompany(!editingCompany)}
            variant={editingCompany ? 'default' : 'outline'}
          >
            {editingCompany ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                저장
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                수정
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">회사명</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">업종</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.industry}
                      onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.industry}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">규모</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.size}
                      onChange={(e) => setCompanyInfo({...companyInfo, size: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.size}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">설립일</label>
                  {editingCompany ? (
                    <Input
                      type="date"
                      value={companyInfo.establishedDate}
                      onChange={(e) => setCompanyInfo({...companyInfo, establishedDate: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.establishedDate}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">주소</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">전화번호</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">이메일</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">웹사이트</label>
                  {editingCompany ? (
                    <Input
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyInfo.website}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기업 설명</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">회사 소개</label>
              {editingCompany ? (
                <textarea
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo({...companyInfo, description: e.target.value})}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{companyInfo.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">인허가 정보</label>
              {editingCompany ? (
                <Input
                  value={companyInfo.license}
                  onChange={(e) => setCompanyInfo({...companyInfo, license: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{companyInfo.license}</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // 조직 관리 렌더링
  const renderDepartmentManagement = () => {
    const handleAddDepartment = () => {
      if (newDepartmentName.trim()) {
        const newDepartment: Department = {
          id: Date.now().toString(),
          name: newDepartmentName,
          description: '',
          manager: '',
          memberCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active'
        }
        setDepartments([...departments, newDepartment])
        setNewDepartmentName('')
        setShowNewDepartmentForm(false)
      }
    }

    const handleDeleteDepartment = (id: string) => {
      setDepartments(departments.filter(dept => dept.id !== id))
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">조직 관리</h2>
          <Button onClick={() => setShowNewDepartmentForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            조직 추가
          </Button>
        </div>

        {showNewDepartmentForm && (
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 조직 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">조직명</label>
                <Input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="조직명을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddDepartment}>추가</Button>
                <Button variant="outline" onClick={() => setShowNewDepartmentForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-6 bg-white border border-gray-200 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-600">{dept.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={dept.status === 'active' ? 'default' : 'secondary'}>
                    {dept.status === 'active' ? '활성' : '비활성'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingDepartment(dept.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteDepartment(dept.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">관리자</span>
                  <span className="text-sm font-medium text-gray-900">{dept.manager}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">구성원</span>
                  <span className="text-sm font-medium text-gray-900">{dept.memberCount}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">생성일</span>
                  <span className="text-sm font-medium text-gray-900">{dept.createdAt}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 조직 구조 렌더링
  const renderOrganizationStructure = () => {
    const organizationStructure = getOrganizationStructure()
    
    const renderOrgNode = (node: OrganizationNode, level: number = 0) => {
      const colors = {
        company: 'bg-white border-gray-200 text-gray-700',
        department: 'bg-white border-gray-200 text-gray-700',
        team: 'bg-white border-gray-200 text-gray-700'
      }

      const iconColors = {
        company: 'bg-gray-600 text-white',
        department: 'bg-gray-600 text-white',
        team: 'bg-gray-600 text-white'
      }

      return (
        <div key={node.id} className="relative">
          {/* 연결선 (부모-자식 관계 표시) */}
          {level > 0 && (
            <div className="absolute left-0 top-0 w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg -ml-6"></div>
          )}
          
          <div className={`${level > 0 ? 'ml-12' : ''} mb-8`}>
            <Card className={`p-6 border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${colors[node.type]}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* 아이콘 */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md ${iconColors[node.type]}`}>
                    {node.type === 'company' && <Building2 className="w-6 h-6" />}
                    {node.type === 'department' && <Users className="w-6 h-6" />}
                    {node.type === 'team' && <User className="w-6 h-6" />}
                  </div>
                  
                  {/* 정보 */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{node.name}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{node.manager}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{node.memberCount}명</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 타입 배지 */}
                <Badge 
                  variant="outline" 
                  className="font-semibold bg-gray-50 text-gray-700 border-gray-300"
                >
                  {node.type === 'company' ? '회사' : node.type === 'department' ? '부서' : '팀'}
                </Badge>
              </div>
            </Card>
            
            {/* 하위 노드들 */}
            {node.children && node.children.length > 0 && (
              <div className="relative mt-6">
                {/* 수직 연결선 */}
                {level === 0 && (
                  <div className="absolute left-6 top-0 w-0.5 h-full bg-gray-300"></div>
                )}
                
                <div className="space-y-6">
                  {node.children.map((child, index) => (
                    <div key={child.id} className="relative">
                      {/* 수평 연결선 */}
                      {level === 0 && (
                        <div className="absolute left-6 top-6 w-6 h-0.5 bg-gray-300"></div>
                      )}
                      {renderOrgNode(child, level + 1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // 빈 상태 렌더링
    const renderEmptyState = () => (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">조직 구조 데이터가 없습니다</h3>
          <p className="text-gray-600 max-w-md">
            아직 조직 구조가 설정되지 않았습니다. 
            먼저 조직 관리 탭에서 부서를 추가하거나 구성원을 등록해주세요.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('organization', 'departments')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>부서 추가</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onNavigate('members', 'member-list')}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>구성원 관리</span>
          </Button>
        </div>
      </div>
    )

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">조직 구조</h2>
            <p className="text-gray-600 mt-2">조직의 전체 구조를 시각적으로 확인하세요</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>구조도 보기</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>노드 추가</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            {organizationStructure.children && organizationStructure.children.length > 0 ? (
              renderOrgNode(organizationStructure)
            ) : (
              renderEmptyState()
            )}
          </div>
        </div>
      </div>
    )
  }

  // 서브섹션 탭 렌더링
  const renderSubSectionTabs = () => {
    return (
      <div className="bg-white shadow-sm border-b border-gray-200 -mx-6 -mt-6 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => onNavigate('organization', 'company-info')}
            className={`py-4 pl-6 pr-1 border-b-2 font-medium text-sm ${
              subSection === 'company-info' || (!subSection)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            기업 정보
          </button>
          <button
            onClick={() => onNavigate('organization', 'departments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              subSection === 'departments'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            조직 관리
          </button>
          <button
            onClick={() => onNavigate('organization', 'structure')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              subSection === 'structure'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            조직 구조
          </button>
        </div>
      </div>
    )
  }

  // 서브섹션에 따른 렌더링
  const renderContent = () => {
    switch (subSection) {
      case 'company-info':
        return renderCompanyInfo()
      case 'departments':
        return renderDepartmentManagement()
      case 'structure':
        return renderOrganizationStructure()
      default:
        return renderCompanyInfo()
    }
  }

  return (
    <div className="p-6">
      {renderSubSectionTabs()}
      {renderContent()}
    </div>
  )
} 