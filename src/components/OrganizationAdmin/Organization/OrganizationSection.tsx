import React, { useState } from 'react'
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
  MoreHorizontal
} from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

interface OrganizationSectionProps {
  subSection: string;
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

export default function OrganizationSection({ subSection }: OrganizationSectionProps) {
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false)

  // 기업 정보 데이터
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '스마트헬스케어 주식회사',
    industry: '헬스케어 & 웰니스',
    size: '중소기업 (50-200명)',
    address: '서울특별시 강남구 테헤란로 123 스마트타워 15층',
    phone: '02-1234-5678',
    email: 'contact@smarthealthcare.com',
    website: 'https://smarthealthcare.com',
    establishedDate: '2018-03-15',
    description: '첨단 AI 기술을 활용한 정신건강 관리 솔루션을 제공하는 기업입니다.',
    license: '의료기기 제조업 허가증 제2023-001호'
  })

  // 조직 관리 데이터
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: '경영관리팀',
      description: '전략 수립, 인사, 재무 관리',
      manager: '김대표',
      memberCount: 8,
      createdAt: '2023-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: '연구개발팀',
      description: 'AI 알고리즘 개발 및 연구',
      manager: '이CTO',
      memberCount: 15,
      createdAt: '2023-02-01',
      status: 'active'
    },
    {
      id: '3',
      name: '마케팅팀',
      description: '제품 마케팅 및 홍보',
      manager: '박부장',
      memberCount: 6,
      createdAt: '2023-03-01',
      status: 'active'
    },
    {
      id: '4',
      name: '고객지원팀',
      description: '고객 서비스 및 기술 지원',
      manager: '최팀장',
      memberCount: 12,
      createdAt: '2023-04-01',
      status: 'inactive'
    }
  ])

  // 조직 구조 데이터
  const organizationStructure: OrganizationNode = {
    id: 'root',
    name: '스마트헬스케어',
    type: 'company',
    manager: '김대표',
    memberCount: 41,
    children: [
      {
        id: 'management',
        name: '경영관리팀',
        type: 'department',
        manager: '김대표',
        memberCount: 8,
        children: [
          {
            id: 'hr',
            name: '인사팀',
            type: 'team',
            manager: '정과장',
            memberCount: 3
          },
          {
            id: 'finance',
            name: '재무팀',
            type: 'team',
            manager: '김과장',
            memberCount: 5
          }
        ]
      },
      {
        id: 'rnd',
        name: '연구개발팀',
        type: 'department',
        manager: '이CTO',
        memberCount: 15,
        children: [
          {
            id: 'ai',
            name: 'AI 개발팀',
            type: 'team',
            manager: '박팀장',
            memberCount: 8
          },
          {
            id: 'app',
            name: '앱 개발팀',
            type: 'team',
            manager: '최팀장',
            memberCount: 7
          }
        ]
      },
      {
        id: 'marketing',
        name: '마케팅팀',
        type: 'department',
        manager: '박부장',
        memberCount: 6
      },
      {
        id: 'support',
        name: '고객지원팀',
        type: 'department',
        manager: '최팀장',
        memberCount: 12
      }
    ]
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
          <Card className="p-6">
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

          <Card className="p-6">
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

        <Card className="p-6">
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
          <Card className="p-6">
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
            <Card key={dept.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                    <Building2 className="w-5 h-5 text-blue-600" />
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
    const renderOrgNode = (node: OrganizationNode, level: number = 0) => {
      const colors = {
        company: 'bg-blue-100 text-blue-600',
        department: 'bg-green-100 text-green-600',
        team: 'bg-purple-100 text-purple-600'
      }

      return (
        <div key={node.id} className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors[node.type]}`}>
                  {node.type === 'company' && <Building2 className="w-5 h-5" />}
                  {node.type === 'department' && <Users className="w-5 h-5" />}
                  {node.type === 'team' && <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
                  <p className="text-sm text-gray-600">{node.manager} • {node.memberCount}명</p>
                </div>
              </div>
              <Badge variant="outline">{node.type === 'company' ? '회사' : node.type === 'department' ? '부서' : '팀'}</Badge>
            </div>
          </Card>
          
          {node.children && node.children.map(child => renderOrgNode(child, level + 1))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">조직 구조</h2>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            구조도 보기
          </Button>
        </div>

        <div className="bg-white rounded-lg p-6">
          {renderOrgNode(organizationStructure)}
        </div>
      </div>
    )
  }

  // 서브섹션에 따른 렌더링
  const renderContent = () => {
    switch (subSection) {
      case 'org-info':
        return renderCompanyInfo()
      case 'org-departments':
        return renderDepartmentManagement()
      case 'org-structure':
        return renderOrganizationStructure()
      default:
        return renderCompanyInfo()
    }
  }

  return (
    <div>
      {renderContent()}
    </div>
  )
} 