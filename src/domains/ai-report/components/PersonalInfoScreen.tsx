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
    <div className="space-y-8 bg-white">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          사용자 정보 입력
        </h2>
        <p className="text-gray-600">
          정확한 AI 분석을 위해 개인 정보를 입력해주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 기본 정보 */}
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              이름 *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="이름을 입력하세요"
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
              나이 *
            </label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              placeholder="나이를 입력하세요"
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
              성별 *
            </label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female' | 'other') => 
                setFormData(prev => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="male" className="text-gray-900 hover:bg-gray-50">남성</SelectItem>
                <SelectItem value="female" className="text-gray-900 hover:bg-gray-50">여성</SelectItem>
                <SelectItem value="other" className="text-gray-900 hover:bg-gray-50">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 신체 정보 */}
        <div className="space-y-6">
          <div>
            <label htmlFor="height" className="block text-sm font-semibold text-gray-700 mb-2">
              키 (cm)
            </label>
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
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-semibold text-gray-700 mb-2">
              몸무게 (kg)
            </label>
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
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 의료 정보 */}
      <div className="space-y-6">
        <div>
          <label htmlFor="medical-history" className="block text-sm font-semibold text-gray-700 mb-2">
            과거 병력이 있다면 입력하세요 (쉼표로 구분)
          </label>
          <Textarea
            id="medical-history"
            value={medicalHistoryInput}
            onChange={(e) => setMedicalHistoryInput(e.target.value)}
            placeholder="예: 고혈압, 당뇨병, 심장질환 등"
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="medications" className="block text-sm font-semibold text-gray-700 mb-2">
            현재 복용중인 약물이 있다면 입력하세요 (쉼표로 구분)
          </label>
          <Textarea
            id="medications"
            value={medicationsInput}
            onChange={(e) => setMedicationsInput(e.target.value)}
            placeholder="예: 혈압약, 진통제, 비타민 등"
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleSubmit} 
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        >
          다음 단계로
        </Button>
      </div>
    </div>
  );
} 