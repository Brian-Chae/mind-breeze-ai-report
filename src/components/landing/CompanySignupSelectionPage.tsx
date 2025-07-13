/**
 * 기업 회원가입 선택 화면
 * 
 * 사용자가 다음 중 하나를 선택할 수 있습니다:
 * 1. 신규 기업 등록 (ORGANIZATION_ADMIN)
 * 2. 기존 기업 합류 (ORGANIZATION_MEMBER)
 */

import React from 'react';
import { ArrowLeft, Building2, Users, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface CompanySignupSelectionPageProps {
  onNavigate: (page: string) => void;
}

export function CompanySignupSelectionPage({ onNavigate }: CompanySignupSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>홈으로 돌아가기</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">MIND BREEZE AI</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">기업 회원가입</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            기업을 위한 AI 헬스케어 솔루션에 오신 것을 환영합니다.<br />
            회원가입 유형을 선택해 주세요.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 신규 기업 등록 */}
          <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                새로운 계약을 생성하고<br />
                신규 기업 등록을 원하시나요?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <CardDescription className="text-center text-gray-600 mb-8 text-lg">
                최초 기업 관리자로 등록하여 6자리 기업 코드를 받고<br />
                전체 시스템을 관리하실 수 있습니다.
              </CardDescription>
              
              {/* 포함 기능 */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">기업 정보 등록 및 관리</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">6자리 기업 코드 발급</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">전체 조직 데이터 관리</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">결제 및 크레딧 관리</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">현장 담당자 관리</span>
                </div>
              </div>

              <Button
                onClick={() => onNavigate('company-registration')}
                className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg font-semibold"
              >
                신규 기업 등록하기
              </Button>
            </CardContent>
          </Card>

          {/* 기존 기업 합류 */}
          <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                이미 등록된 기업의<br />
                관리자 등록을 원하시나요?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <CardDescription className="text-center text-gray-600 mb-8 text-lg">
                기업 관리자로부터 받은 6자리 기업 코드로<br />
                현장 담당자로 가입하실 수 있습니다.
              </CardDescription>
              
              {/* 포함 기능 */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">6자리 기업 코드로 간편 가입</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">측정 대상자 등록 및 관리</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">자신이 측정한 데이터 조회</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">측정 진행 및 결과 확인</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">리포트 생성 및 관리</span>
                </div>
              </div>

              <Button
                onClick={() => onNavigate('member-registration')}
                className="w-full bg-green-600 hover:bg-green-700 py-4 text-lg font-semibold"
              >
                기존 기업 합류하기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Mind Breeze AI 서비스 특징
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">기업 중심 관리</h3>
              <p className="text-gray-600">
                6자리 기업 코드로 모든 구성원을 체계적으로 관리할 수 있습니다.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">역할별 권한</h3>
              <p className="text-gray-600">
                관리자와 현장 담당자의 역할을 명확히 구분하여 보안을 강화합니다.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">간편한 측정</h3>
              <p className="text-gray-600">
                측정 대상자는 간단한 정보만으로 빠르게 측정에 참여할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              기업 로그인
            </button>
          </p>
          <div className="text-sm text-gray-500">
            <p>MIND BREEZE AI - 기업을 위한 AI 헬스케어 솔루션</p>
            <p className="mt-2">
              <a href="#" className="hover:text-blue-600">개인정보처리방침</a>
              {' · '}
              <a href="#" className="hover:text-blue-600">이용약관</a>
              {' · '}
              <a href="#" className="hover:text-blue-600">고객지원</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanySignupSelectionPage; 