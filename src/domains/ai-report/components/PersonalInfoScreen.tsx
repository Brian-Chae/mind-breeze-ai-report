import React, { useState, useCallback } from 'react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Textarea } from '@ui/textarea';
import { User, Calendar, Users } from 'lucide-react';

import type { PersonalInfo } from '../types';

interface PersonalInfoScreenProps {
  onComplete: (personalInfo: PersonalInfo) => void;
  onError: (error: string) => void;
  initialData?: PersonalInfo;
}

export function PersonalInfoScreen({ onComplete, onError, initialData }: PersonalInfoScreenProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    name: initialData?.name || '',
    age: initialData?.age || 0,
    gender: initialData?.gender || 'male',
    height: initialData?.height || undefined,
    weight: initialData?.weight || undefined,
    medicalHistory: initialData?.medicalHistory || [],
    currentMedications: initialData?.currentMedications || []
  });

  const [medicalHistoryInput, setMedicalHistoryInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');

  const handleSubmit = useCallback(() => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      onError('이름을 입력해주세요.');
      return;
    }

    if (formData.age < 1 || formData.age > 120) {
      onError('올바른 나이를 입력해주세요.');
      return;
    }

    // 의료 기록 및 약물 정보 파싱
    const finalData: PersonalInfo = {
      ...formData,
      medicalHistory: medicalHistoryInput.trim() 
        ? medicalHistoryInput.split(',').map(item => item.trim()).filter(Boolean)
        : [],
      currentMedications: medicationsInput.trim() 
        ? medicationsInput.split(',').map(item => item.trim()).filter(Boolean)
        : []
    };

    onComplete(finalData);
  }, [formData, medicalHistoryInput, medicationsInput, onComplete, onError]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          사용자 정보 입력
        </h2>
        <p className="text-gray-600">
          정확한 AI 분석을 위해 개인 정보를 입력해주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">이름 *</label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="이름을 입력하세요"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="age" className="text-sm font-medium">나이 *</label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              placeholder="나이를 입력하세요"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="gender" className="text-sm font-medium">성별 *</label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female' | 'other') => 
                setFormData(prev => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 신체 정보 */}
        <div className="space-y-4">
          <div>
            <label htmlFor="height" className="text-sm font-medium">키 (cm)</label>
            <Input
              id="height"
              type="number"
              min="100"
              max="250"
              value={formData.height || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                height: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="키를 입력하세요 (선택사항)"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="weight" className="text-sm font-medium">몸무게 (kg)</label>
            <Input
              id="weight"
              type="number"
              min="30"
              max="200"
              value={formData.weight || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                weight: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="몸무게를 입력하세요 (선택사항)"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* 의료 정보 */}
      <div className="space-y-4">
        <div>
          <label htmlFor="medical-history" className="text-sm font-medium">과거 병력 (선택사항)</label>
          <Textarea
            id="medical-history"
            value={medicalHistoryInput}
            onChange={(e) => setMedicalHistoryInput(e.target.value)}
            placeholder="과거 병력이 있다면 입력하세요 (쉼표로 구분)"
            className="mt-1"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            예: 고혈압, 당뇨병, 심장질환 등
          </p>
        </div>

        <div>
          <label htmlFor="medications" className="text-sm font-medium">현재 복용 약물 (선택사항)</label>
          <Textarea
            id="medications"
            value={medicationsInput}
            onChange={(e) => setMedicationsInput(e.target.value)}
            placeholder="현재 복용중인 약물이 있다면 입력하세요 (쉼표로 구분)"
            className="mt-1"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            예: 혈압약, 진통제, 비타민 등
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="px-8">
          다음 단계로
        </Button>
      </div>
    </div>
  );
} 