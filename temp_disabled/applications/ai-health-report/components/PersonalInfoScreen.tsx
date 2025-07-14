/**
 * 개인정보 입력 화면 컴포넌트
 * - 이름, 성별, 생년월일, 직업 입력
 * - 개인화된 분석을 위한 정보 수집
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { User, Calendar, Shield, ArrowLeft, ArrowRight, Briefcase, Edit3 } from 'lucide-react';
import { PersonalInfo, OccupationType } from '../types';

interface PersonalInfoScreenProps {
  onNext: (personalInfo: PersonalInfo) => void;
  onBack: () => void;
}

export function PersonalInfoScreen({ onNext, onBack }: PersonalInfoScreenProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    name: '',
    gender: '',
    birthDate: '',
    birthYear: 0,
    birthMonth: 0,
    birthDay: 0,
    age: 0,
    occupation: '' as OccupationType,
    customOccupation: ''
  });

  const [errors, setErrors] = useState<{
    name?: string;
    gender?: string;
    birthDate?: string;
    occupation?: string;
    customOccupation?: string;
  }>({});

  const occupationOptions = [
    { value: 'teacher', label: '교사', icon: '👩‍🏫' },
    { value: 'military_medic', label: '의무병사', icon: '🏥' },
    { value: 'military_career', label: '직업군인', icon: '🪖' },
    { value: 'elementary', label: '초등학생', icon: '🎒' },
    { value: 'middle_school', label: '중학생', icon: '📚' },
    { value: 'high_school', label: '고등학생', icon: '🎓' },
    { value: 'university', label: '대학생', icon: '🏫' },
    { value: 'housewife', label: '전업주부', icon: '🏠' },
    { value: 'parent', label: '학부모', icon: '👨‍👩‍👧‍👦' },
    { value: 'firefighter', label: '소방공무원', icon: '🚒' },
    { value: 'police', label: '경찰공무원', icon: '👮' },
    { value: 'developer', label: '개발자', icon: '💻' },
    { value: 'designer', label: '디자이너', icon: '🎨' },
    { value: 'office_worker', label: '일반 사무직', icon: '📊' },
    { value: 'manager', label: '관리자', icon: '👔' },
    { value: 'general_worker', label: '일반 직장인', icon: '💼' },
    { value: 'entrepreneur', label: '사업가', icon: '🚀' },
    { value: 'other', label: '그외', icon: '✏️' }
  ];

  const handleInputChange = (field: keyof PersonalInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 초기화
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleBirthDateChange = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    setFormData(prev => ({
      ...prev,
      birthDate: value,
      birthYear: year || 0,
      birthMonth: month || 0,
      birthDay: day || 0,
      age: age || 0
    }));
    
    if (errors.birthDate) {
      setErrors(prev => ({
        ...prev,
        birthDate: undefined
      }));
    }
  };

  const handleOccupationChange = (value: OccupationType) => {
    setFormData(prev => ({
      ...prev,
      occupation: value,
      customOccupation: value === 'other' ? prev.customOccupation : '' // "그외"가 아니면 커스텀 입력 초기화
    }));
    
    if (errors.occupation) {
      setErrors(prev => ({
        ...prev,
        occupation: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 선택해주세요.';
    } else {
      const birthYear = new Date(formData.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      if (age < 1 || age > 120) {
        newErrors.birthDate = '올바른 생년월일을 입력해주세요.';
      }
    }
    
    if (!formData.occupation) {
      newErrors.occupation = '직업을 선택해주세요.';
    }
    
    if (formData.occupation === 'other' && !formData.customOccupation?.trim()) {
      newErrors.customOccupation = '직업을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext(formData);
    }
  };

  const getOccupationLabel = (value: OccupationType) => {
    const option = occupationOptions.find(opt => opt.value === value);
    return option ? `${option.icon} ${option.label}` : '';
  };

  return (
    <div className="min-h-full bg-black p-4" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">개인정보 입력</h1>
          <p className="text-gray-300">맞춤형 건강 분석을 위한 기본 정보를 입력해주세요</p>
        </div>

        {/* 개인정보 입력 폼 */}
        <Card className="mb-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-blue-400" />
              기본 정보
            </CardTitle>
            <CardDescription className="text-gray-300">
              입력하신 정보는 개인화된 분석을 위해서만 사용되며, 안전하게 보호됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이름 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">이름</label>
              <Input
                type="text"
                placeholder="이름을 입력해주세요"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 성별 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">성별</label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="성별을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* 생년월일 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">생년월일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className={`pl-10 ${errors.birthDate ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.birthDate && (
                <p className="text-sm text-red-500">{errors.birthDate}</p>
              )}
            </div>

            {/* 직업 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">직업</label>
              <Select value={formData.occupation} onValueChange={handleOccupationChange}>
                <SelectTrigger className={errors.occupation ? 'border-red-500' : ''}>
                  <SelectValue placeholder="직업을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {occupationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occupation && (
                <p className="text-sm text-red-500">{errors.occupation}</p>
              )}
            </div>

            {/* 커스텀 직업 입력 (그외 선택 시) */}
            {formData.occupation === 'other' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">직업 입력</label>
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="직업을 입력해주세요"
                    value={formData.customOccupation || ''}
                    onChange={(e) => handleInputChange('customOccupation', e.target.value)}
                    className={`pl-10 ${errors.customOccupation ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.customOccupation && (
                  <p className="text-sm text-red-500">{errors.customOccupation}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 개인정보 보호 안내 */}
        <Card className="bg-gray-800 border-gray-600 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-100 mb-1">개인정보 보호</h3>
                <p className="text-sm text-gray-300">
                  입력하신 모든 정보는 개인화된 건강 분석을 위해서만 사용되며, 
                  외부로 전송되지 않고 브라우저에서만 안전하게 처리됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </Button>
          <Button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            다음
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 