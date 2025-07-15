import React, { useState, useCallback } from 'react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Textarea } from '@ui/textarea';
import { User, Calendar, Briefcase, MessageSquare } from 'lucide-react';

import type { PersonalInfo } from '../types';

interface PersonalInfoScreenProps {
  onComplete: (personalInfo: PersonalInfo) => void;
  onError: (error: string) => void;
  initialData?: PersonalInfo;
}

export function PersonalInfoScreen({ onComplete, onError, initialData }: PersonalInfoScreenProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    name: initialData?.name || '',
    gender: initialData?.gender || 'male',
    birthDate: initialData?.birthDate || '',
    occupation: initialData?.occupation || '',
    workConcerns: initialData?.workConcerns || ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2글자 이상 입력해주세요.';
    }

    // 생년월일 검증
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 선택해주세요.';
    } else {
      const birthYear = new Date(formData.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      if (age < 10 || age > 120) {
        newErrors.birthDate = '올바른 생년월일을 입력해주세요.';
      }
    }

    // 직업 검증
    if (!formData.occupation.trim()) {
      newErrors.occupation = '직업을 입력해주세요.';
    } else if (formData.occupation.trim().length < 2) {
      newErrors.occupation = '직업은 2글자 이상 입력해주세요.';
    }

    // 직업상 고민 검증
    if (!formData.workConcerns.trim()) {
      newErrors.workConcerns = '직업상 고민이나 관심사를 입력해주세요.';
    } else if (formData.workConcerns.trim().length < 10) {
      newErrors.workConcerns = '좀 더 구체적으로 작성해주세요. (10글자 이상)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      onError('입력 정보를 확인해주세요.');
      return;
    }

    try {
      onComplete(formData);
    } catch (error) {
      onError('정보 저장 중 오류가 발생했습니다.');
    }
  }, [formData, validateForm, onComplete, onError]);

  const updateFormData = useCallback((field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 해당 필드의 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">개인 정보 입력</h2>
          <p className="text-gray-600">
            AI Health Report 생성을 위한 기본 정보를 입력해주세요
          </p>
        </div>

        {/* 폼 필드들 */}
        <div className="space-y-8">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              이름 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="이름을 입력해주세요"
                className={`pl-10 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              성별 *
            </label>
            <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value as PersonalInfo['gender'])}>
              <SelectTrigger className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="성별을 선택해주세요" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="male" className="text-gray-900 hover:bg-gray-50">남성</SelectItem>
                <SelectItem value="female" className="text-gray-900 hover:bg-gray-50">여성</SelectItem>
                <SelectItem value="other" className="text-gray-900 hover:bg-gray-50">기타</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-600">{errors.gender}</p>
            )}
          </div>

          {/* 생년월일 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              생년월일 *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateFormData('birthDate', e.target.value)}
                className={`pl-10 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.birthDate ? 'border-red-500' : ''
                }`}
                max={new Date().toISOString().split('T')[0]} // 오늘까지만 선택 가능
              />
            </div>
            {errors.birthDate && (
              <p className="text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* 직업 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              직업 *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={formData.occupation}
                onChange={(e) => updateFormData('occupation', e.target.value)}
                placeholder="예: 개발자, 디자이너, 학생, 교사 등"
                className={`pl-10 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.occupation ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.occupation && (
              <p className="text-sm text-red-600">{errors.occupation}</p>
            )}
          </div>

          {/* 직업상 고민 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              직업상 평소 고민이 되는점 *
            </label>
            <p className="text-sm text-gray-500 mb-2">
              AI Health Report에서 집중적으로 파악하고 싶은 내용을 자세히 적어주세요
            </p>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Textarea
                value={formData.workConcerns}
                onChange={(e) => updateFormData('workConcerns', e.target.value)}
                placeholder="예: 업무 스트레스, 집중력 저하, 야근으로 인한 피로, 발표 불안감, 의사결정의 어려움 등 평소 고민이나 개선하고 싶은 점을 구체적으로 작성해주세요."
                className={`pl-10 pt-3 min-h-[120px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none ${
                  errors.workConcerns ? 'border-red-500' : ''
                }`}
                rows={5}
              />
            </div>
            <div className="flex justify-between items-center">
              {errors.workConcerns && (
                <p className="text-sm text-red-600">{errors.workConcerns}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {formData.workConcerns.length}자
              </p>
            </div>
          </div>
        </div>

        {/* 다음 버튼 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            다음 단계로
          </Button>
        </div>
      </div>
    </div>
  );
} 