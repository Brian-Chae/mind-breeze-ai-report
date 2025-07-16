import React, { useState, useCallback } from 'react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Textarea } from '@ui/textarea';
import { User, Calendar, Briefcase, MessageSquare, Mail } from 'lucide-react';

import type { PersonalInfo } from './AIHealthReportApp';

interface PersonalInfoScreenProps {
  onComplete: (personalInfo: PersonalInfo) => void;
  onError: (error: string) => void;
  initialData?: PersonalInfo;
}

export function PersonalInfoScreen({ onComplete, onError, initialData }: PersonalInfoScreenProps) {
  // 🔧 PersonalInfo 타입과 일치하도록 수정
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    gender: initialData?.gender || 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    birthDate: initialData?.birthDate ? initialData.birthDate.toISOString().split('T')[0] : '',
    occupation: initialData?.occupation || '',
    department: initialData?.department || '',
    healthConditions: initialData?.healthConditions || []
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2글자 이상 입력해주세요.';
    }

    // 🔧 이메일 검증 추가
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요.';
      }
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

    // 직업 검증 (필수 입력)
    if (!formData.occupation.trim()) {
      newErrors.occupation = '직업을 입력해주세요.';
    }

    // 부서 검증 (필수 입력)  
    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError('입력 정보를 확인해주세요.');
      return;
    }

    // 🔧 올바른 PersonalInfo 타입으로 변환
    const personalInfo: PersonalInfo = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      gender: formData.gender,
      birthDate: new Date(formData.birthDate), // Date 객체로 변환
      occupation: formData.occupation.trim() || undefined,
      department: formData.department.trim() || undefined,
      healthConditions: formData.healthConditions.length > 0 ? formData.healthConditions : undefined
    };

    console.log('🔧 PersonalInfoScreen에서 전달하는 데이터:', personalInfo);
    onComplete(personalInfo);
  }, [formData, validateForm, onComplete, onError]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          개인정보 입력
        </h2>
        <p className="text-gray-700">
          정확한 분석을 위해 개인정보를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름 *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="이름을 입력하세요"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* 🔧 이메일 필드 추가 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일 *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="이메일을 입력하세요"
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            성별 *
          </label>
          <Select 
            value={formData.gender} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'MALE' | 'FEMALE' | 'OTHER' }))}
          >
            <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
              <SelectValue placeholder="성별을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">남성</SelectItem>
              <SelectItem value="FEMALE">여성</SelectItem>
              <SelectItem value="OTHER">기타</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
          )}
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            생년월일 *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              className={`pl-10 ${errors.birthDate ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* 직업 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            직업 *
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder="직업을 입력하세요"
              className={`pl-10 ${errors.occupation ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.occupation && (
            <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>
          )}
        </div>

        {/* 부서 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            부서 *
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="부서를 입력하세요"
              className={`pl-10 ${errors.department ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.department && (
            <p className="text-red-500 text-sm mt-1">{errors.department}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            다음 단계
          </Button>
        </div>
      </form>
    </div>
  );
} 