# 기업 관리 페이지 Quick Start Guide

## 🚀 즉시 시작하기

### Step 1: 프로젝트 구조 생성 (10분)

```bash
# 디렉토리 구조 생성
mkdir -p src/domains/organization/components/UnifiedAdmin/contents/OrganizationManagement/{components,forms,tabs,hooks}
mkdir -p src/domains/organization/services/management
mkdir -p src/domains/organization/types/management
```

### Step 2: 타입 정의 생성 (20분)

```typescript
// src/domains/organization/types/management/organization-management.ts
export interface Organization {
  id: string
  organizationCode: string
  organizationName: string
  businessNumber?: string
  industry: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'
  contactEmail: string
  contactPhone: string
  address: string
  website?: string
  description?: string
  logoUrl?: string
  establishedDate?: Date
  
  // 관리 정보
  adminUserId: string
  adminEmail: string
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  paymentStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED'
  
  // 통계
  totalMembers: number
  activeMembers: number
  totalDepartments: number
  
  // 메타데이터
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  id: string
  parentId?: string
  name: string
  code: string
  description?: string
  level: number
  managerId?: string
  managerName?: string
  managerEmail?: string
  memberCount: number
  childDepartmentCount: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface OrganizationMember {
  id: string
  userId: string
  employeeId: string
  displayName: string
  email: string
  phone?: string
  profilePhotoUrl?: string
  departmentId?: string
  departmentName?: string
  position: string
  jobTitle?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  permissions: string[]
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'RESIGNED'
  invitationToken?: string
  invitationExpiry?: Date
  joinedAt: Date
  lastActiveAt?: Date
  resignedAt?: Date
}
```

### Step 3: 서비스 스켈레톤 생성 (15분)

```typescript
// src/domains/organization/services/management/OrganizationManagementService.ts
import { BaseService } from '@core/services/BaseService'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore'
import { db } from '@core/services/firebase'
import type { 
  Organization, 
  Department, 
  OrganizationMember 
} from '../../types/management/organization-management'

class OrganizationManagementService extends BaseService {
  constructor() {
    super()
  }

  // 조직 정보 관리
  async updateOrganizationInfo(
    organizationId: string, 
    data: Partial<Organization>
  ): Promise<void> {
    return this.measureAndLog('updateOrganizationInfo', async () => {
      try {
        // TODO: 구현
        this.log('조직 정보 업데이트', { organizationId })
      } catch (error) {
        this.error('조직 정보 업데이트 실패', error as Error)
        throw error
      }
    })
  }

  // 부서 관리
  async createDepartment(
    organizationId: string, 
    data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Department> {
    return this.measureAndLog('createDepartment', async () => {
      try {
        // TODO: 구현
        this.log('부서 생성', { organizationId })
        return {} as Department
      } catch (error) {
        this.error('부서 생성 실패', error as Error)
        throw error
      }
    })
  }

  // 구성원 관리
  async inviteMember(
    organizationId: string, 
    data: Partial<OrganizationMember>
  ): Promise<void> {
    return this.measureAndLog('inviteMember', async () => {
      try {
        // TODO: 구현
        this.log('구성원 초대', { organizationId })
      } catch (error) {
        this.error('구성원 초대 실패', error as Error)
        throw error
      }
    })
  }
}

export default new OrganizationManagementService()
```

### Step 4: 메인 컴포넌트 생성 (20분)

```typescript
// src/domains/organization/components/UnifiedAdmin/contents/OrganizationManagement/index.tsx
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  Building2, 
  Users, 
  Network, 
  Shield 
} from 'lucide-react'
import CompanyInfoTab from './tabs/CompanyInfoTab'
import OrganizationStructureTab from './tabs/OrganizationStructureTab'
import MemberManagementTab from './tabs/MemberManagementTab'
import PermissionSettingsTab from './tabs/PermissionSettingsTab'
import OrganizationHero from './components/OrganizationHero'

export default function OrganizationManagementContent() {
  const [activeTab, setActiveTab] = useState('company-info')

  const tabs = [
    {
      id: 'company-info',
      label: '기업 정보',
      icon: Building2,
      description: '기업 기본 정보 관리'
    },
    {
      id: 'organization-structure', 
      label: '조직 구조',
      icon: Network,
      description: '부서 및 조직도 관리'
    },
    {
      id: 'member-management',
      label: '구성원 관리', 
      icon: Users,
      description: '구성원 초대 및 관리'
    },
    {
      id: 'permission-settings',
      label: '권한 설정',
      icon: Shield,
      description: '역할 및 권한 관리'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Hero Section */}
        <OrganizationHero />

        {/* 탭 인터페이스 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-50 rounded-t-2xl p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-slate-500 hidden sm:block">
                        {tab.description}
                      </div>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <div className="p-6">
              <TabsContent value="company-info">
                <CompanyInfoTab />
              </TabsContent>

              <TabsContent value="organization-structure">
                <OrganizationStructureTab />
              </TabsContent>

              <TabsContent value="member-management">
                <MemberManagementTab />
              </TabsContent>

              <TabsContent value="permission-settings">
                <PermissionSettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
```

### Step 5: Hero 컴포넌트 구현 (15분)

```typescript
// src/domains/organization/components/UnifiedAdmin/contents/OrganizationManagement/components/OrganizationHero.tsx
import React from 'react'
import { Building2, Users, TrendingUp, CreditCard } from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'

export default function OrganizationHero() {
  // TODO: 실제 데이터 연동
  const stats = [
    { label: '전체 구성원', value: '125명', icon: Users, trend: '+12%' },
    { label: '부서', value: '8개', icon: Building2, trend: '+2' },
    { label: '활성률', value: '92%', icon: TrendingUp, trend: '+5%' },
    { label: '서비스 플랜', value: 'Premium', icon: CreditCard, trend: null }
  ]

  return (
    <div className="text-center space-y-6">
      {/* 기업 정보 헤더 */}
      <div>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">로옥시드랩스</h1>
        <p className="text-lg text-slate-600">혁신적인 브레인테크 전문 기업</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600">{stat.trend}</p>
                  )}
                </div>
                <Icon className="w-8 h-8 text-slate-400" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* 빠른 액션 */}
      <div className="flex justify-center gap-4">
        <Button>구성원 초대</Button>
        <Button variant="outline">부서 추가</Button>
        <Button variant="outline">조직도 보기</Button>
      </div>
    </div>
  )
}
```

### Step 6: 탭 컴포넌트 스켈레톤 (각 5분)

```typescript
// src/domains/organization/components/UnifiedAdmin/contents/OrganizationManagement/tabs/CompanyInfoTab.tsx
import React from 'react'

export default function CompanyInfoTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">기업 정보</h2>
      {/* TODO: 구현 */}
      <p className="text-slate-600">기업 정보 폼이 여기에 표시됩니다.</p>
    </div>
  )
}
```

## 🔧 다음 단계 체크리스트

### 즉시 구현 가능 (Day 1)
- [ ] Firestore 보안 규칙 작성
- [ ] 기본 CRUD 메서드 구현
- [ ] 폼 컴포넌트 생성

### 준비 필요 (Day 2-3)
- [ ] 조직도 시각화 라이브러리 선택
- [ ] 파일 업로드 컴포넌트
- [ ] 권한 매트릭스 UI

### 통합 및 테스트 (Day 4+)
- [ ] 서비스 연동
- [ ] 에러 핸들링
- [ ] 로딩 상태 관리

## 📚 참고 코드 스니펫

### 유효성 검증 훅
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const organizationSchema = z.object({
  organizationName: z.string().min(2, '기업명은 2자 이상'),
  contactEmail: z.string().email('올바른 이메일 형식'),
  contactPhone: z.string().regex(/^[\d-]+$/, '올바른 전화번호 형식'),
  // ...
})

export function useOrganizationForm() {
  return useForm({
    resolver: zodResolver(organizationSchema)
  })
}
```

### 실시간 구독 예제
```typescript
import { useEffect, useState } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@core/services/firebase'

export function useOrganization(organizationId: string) {
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organizationId),
      (doc) => {
        if (doc.exists()) {
          setOrganization({ id: doc.id, ...doc.data() })
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [organizationId])

  return { organization, loading }
}
```

## 🎯 성공을 위한 팁

1. **작은 단위로 시작**: 기업 정보 탭부터 완성
2. **Mock 데이터 활용**: 백엔드 완성 전 UI 개발
3. **컴포넌트 재사용**: 공통 컴포넌트 먼저 개발
4. **점진적 통합**: 한 번에 하나씩 연결
5. **테스트 주도 개발**: 각 기능별 테스트 작성

## 🚨 주의사항

1. **Firestore 인덱스**: 복합 쿼리 사용 시 인덱스 생성 필요
2. **권한 검증**: 모든 작업에 권한 체크 필수
3. **성능 최적화**: 대량 데이터 처리 시 페이지네이션
4. **에러 처리**: 사용자 친화적인 에러 메시지

## 🔗 관련 문서

- [설계서](./ORGANIZATION_MANAGEMENT_DESIGN.md)
- [워크플로우](./ORGANIZATION_MANAGEMENT_WORKFLOW.md)
- [태스크보드](./ORGANIZATION_MANAGEMENT_TASKBOARD.md)