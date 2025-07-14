import React, { useState } from 'react'
import { CreditCard, DollarSign, ShoppingCart, Plus, Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Settings, MoreHorizontal, Download, Eye, Search, Filter, Clock, Receipt, Star, Award, Package } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

interface CreditsSectionProps {
  subSection: string;
}

export default function CreditsSection({ subSection }: CreditsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const renderCreditDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">크레딧 현황</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            사용 내역
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            크레딧 구매
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">잔여 크레딧</p>
              <p className="text-2xl font-bold text-green-600">15,420</p>
              <p className="text-sm text-gray-600">₩ 385,500 상당</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번달 사용량</p>
              <p className="text-2xl font-bold text-blue-600">2,850</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15%</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 일일 사용량</p>
              <p className="text-2xl font-bold text-purple-600">95</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">-5%</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">예상 소진일</p>
              <p className="text-2xl font-bold text-orange-600">162일</p>
              <p className="text-sm text-gray-600">2024-07-25</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">크레딧 패키지</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">베이직 패키지</h4>
                <Badge className="bg-gray-100 text-gray-600">현재 플랜</Badge>
              </div>
              <p className="text-sm text-gray-600">월 5,000 크레딧</p>
              <p className="text-sm font-medium text-gray-900">₩ 125,000 / 월</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">프로 패키지</h4>
                <Badge className="bg-blue-100 text-blue-600">추천</Badge>
              </div>
              <p className="text-sm text-gray-600">월 20,000 크레딧</p>
              <p className="text-sm font-medium text-gray-900">₩ 400,000 / 월</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">엔터프라이즈</h4>
                <Badge className="bg-purple-100 text-purple-600">최고급</Badge>
              </div>
              <p className="text-sm text-gray-600">무제한 크레딧</p>
              <p className="text-sm font-medium text-gray-900">₩ 1,000,000 / 월</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">크레딧 부족 알림</p>
                <p className="text-xs text-gray-600">잔여 크레딧이 20% 이하일 때</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">자동 충전</p>
                <p className="text-xs text-gray-600">잔여 크레딧이 10% 이하일 때</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">사용량 리포트</p>
                <p className="text-xs text-gray-600">월간 사용량 리포트 이메일</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 사용 내역</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <Receipt className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI 리포트 생성</p>
                  <p className="text-xs text-gray-600">2024-01-15 14:30</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">-25 크레딧</p>
                <p className="text-xs text-gray-600">김건강</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderPurchaseHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">구매 내역</h2>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          영수증 다운로드
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="구매 내역 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option>최근 30일</option>
          <option>최근 90일</option>
          <option>최근 1년</option>
          <option>전체</option>
        </select>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          필터
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">베이직 패키지</h3>
                  <p className="text-sm text-gray-600">5,000 크레딧 구매</p>
                  <p className="text-sm text-gray-600">2024-01-{15-i} 결제</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">₩ 125,000</p>
                <Badge className="bg-green-100 text-green-600">결제 완료</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">신용카드 **** 1234</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">결제일: 2024-01-{15-i}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">주문번호: MB{202401}{15-i}001</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">결제 설정</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          결제 수단 추가
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">등록된 결제 수단</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">신용카드</p>
                    <p className="text-xs text-gray-600">**** **** **** 1234</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-600">기본</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">만료일: 12/27</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      기본 설정
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">법인카드</p>
                    <p className="text-xs text-gray-600">**** **** **** 5678</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">만료일: 08/26</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      기본 설정
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">자동 결제 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">자동 결제 활성화</p>
                <p className="text-xs text-gray-600">크레딧 부족 시 자동 충전</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">자동 충전 임계값</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>잔여 크레딧 10% 이하</option>
                <option>잔여 크레딧 20% 이하</option>
                <option>잔여 크레딧 30% 이하</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">자동 충전 금액</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>베이직 패키지 (5,000 크레딧)</option>
                <option>프로 패키지 (20,000 크레딧)</option>
                <option>엔터프라이즈 (무제한)</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">결제 수단</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>신용카드 **** 1234</option>
                <option>법인카드 **** 5678</option>
              </select>
            </div>
            
            <Button className="w-full">설정 저장</Button>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">세금계산서 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">사업자등록번호</label>
            <Input placeholder="000-00-00000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">상호명</label>
            <Input placeholder="회사명" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">대표자명</label>
            <Input placeholder="대표자명" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">업태/종목</label>
            <Input placeholder="업태/종목" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">사업장 주소</label>
            <Input placeholder="사업장 주소" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">담당자 이메일</label>
            <Input placeholder="세금계산서 수신용 이메일" />
          </div>
        </div>
        <Button className="mt-4">설정 저장</Button>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (subSection) {
      case 'credit-dashboard':
        return renderCreditDashboard()
      case 'credit-history':
        return renderPurchaseHistory()
      case 'credit-settings':
        return renderPaymentSettings()
      default:
        return renderCreditDashboard()
    }
  }

  return <div>{renderContent()}</div>
} 