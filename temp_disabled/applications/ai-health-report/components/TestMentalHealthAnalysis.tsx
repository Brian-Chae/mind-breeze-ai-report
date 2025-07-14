/**
 * 정신건강 분석 테스트 컴포넌트
 * 우울, ADHD, 번아웃, 충동성 분석 기능 테스트
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { MentalHealthAnalysisService } from '../services/MentalHealthAnalysisService';
import { PersonalInfo, MeasurementData } from '../types';

const TestMentalHealthAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 테스트용 샘플 데이터
  const samplePersonalInfo: PersonalInfo = {
    name: "김테스트",
    gender: "male",
    birthDate: "1990-01-01",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    age: 34,
    occupation: "office_worker",
    healthStatus: "양호"
  };

  const sampleMeasurementData: MeasurementData = {
    personalInfo: JSON.stringify(samplePersonalInfo),
    duration: 60,
    eegData: [],
    ppgData: { red: [], ir: [] },
    accData: { x: [], y: [], z: [] },
    eegMetrics: {
      focusIndex: { value: 2.1, normalRange: "1.8-2.4" },
      relaxationIndex: { value: 0.19, normalRange: "0.18-0.22" },
      cognitiveLoad: { value: 0.65, normalRange: "0.3-0.8" },
      stressIndex: { value: 3.5, normalRange: "3.0-4.0" },
      hemisphericBalance: { value: 0.02, normalRange: "-0.1~0.1" },
      emotionalStability: { value: 0.75, normalRange: "0.6-0.9" }
    },
    ppgMetrics: {
      heartRate: 72,
      spo2: 98,
      rmssd: 35,
      sdnn: 45,
      pnn50: 15,
      lfPower: 1200,
      hfPower: 800,
      lfHfRatio: 1.5
    },
    accMetrics: {
      movementIntensity: 0.3,
      stabilityIndex: 0.8,
      posturalSway: 0.2
    },
    signalQuality: {
      eeg: 85,
      ppg: 90,
      acc: 88,
      overall: 87
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      console.log('🧠 정신건강 분석 시작...');
      
      // MentalHealthAnalysisService를 사용하여 분석 수행
      const biomarkers = MentalHealthAnalysisService.calculateMentalHealthBiomarkers(
        samplePersonalInfo,
        sampleMeasurementData
      );
      
      const riskAssessment = MentalHealthAnalysisService.assessMentalHealthRisks(biomarkers);
      
      setAnalysisResult({
        biomarkers,
        riskAssessment
      });
      
      console.log('✅ 정신건강 분석 완료');
      console.log('📊 분석 결과:', { biomarkers, riskAssessment });
      
    } catch (error) {
      console.error('❌ 정신건강 분석 실패:', error);
      setAnalysisResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🧠 정신건강 분석 테스트
          </CardTitle>
          <p className="text-center text-gray-600">
            우울, ADHD, 번아웃, 충동성 분석 기능 테스트
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <Button 
              onClick={runAnalysis}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              {isLoading ? '분석 중...' : '정신건강 분석 시작'}
            </Button>
          </div>

          {analysisResult && (
            <div className="space-y-6">
              {analysisResult.error ? (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">❌ 분석 오류</h3>
                    <p className="text-red-700">{analysisResult.error}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 바이오마커 결과 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">🔬 정신건강 바이오마커</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 우울 바이오마커 */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">우울 관련 지표</h4>
                          <div className="space-y-1 text-sm">
                            <p>알파 비대칭: {analysisResult.biomarkers.depression.eegMarkers.alphaAsymmetry.toFixed(3)}</p>
                            <p>세타파 파워: {analysisResult.biomarkers.depression.eegMarkers.thetaPower.toFixed(3)}</p>
                            <p>알파/세타 비율: {analysisResult.biomarkers.depression.eegMarkers.alphaTheta.toFixed(3)}</p>
                            <p>HRV 감소: {analysisResult.biomarkers.depression.ppgMarkers.hrvDecrease.toFixed(3)}</p>
                          </div>
                        </div>

                        {/* ADHD 바이오마커 */}
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">ADHD 관련 지표</h4>
                          <div className="space-y-1 text-sm">
                            <p>세타/베타 비율: {analysisResult.biomarkers.adhd.eegMarkers.thetaBetaRatio.toFixed(3)}</p>
                            <p>집중력 지속성: {analysisResult.biomarkers.adhd.eegMarkers.attentionSustainability.toFixed(3)}</p>
                            <p>베타파 과활성: {analysisResult.biomarkers.adhd.eegMarkers.betaHyperactivity.toFixed(3)}</p>
                            <p>자율신경 불안정: {analysisResult.biomarkers.adhd.ppgMarkers.autonomicInstability.toFixed(3)}</p>
                          </div>
                        </div>

                        {/* 번아웃 바이오마커 */}
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-orange-800 mb-2">번아웃 관련 지표</h4>
                          <div className="space-y-1 text-sm">
                            <p>인지 피로도: {analysisResult.biomarkers.burnout.eegMarkers.cognitiveFatigue.toFixed(3)}</p>
                            <p>이완 능력 저하: {analysisResult.biomarkers.burnout.eegMarkers.relaxationImpairment.toFixed(3)}</p>
                            <p>감정 조절 장애: {analysisResult.biomarkers.burnout.eegMarkers.emotionalRegulationDisorder.toFixed(3)}</p>
                            <p>만성 피로: {analysisResult.biomarkers.burnout.ppgMarkers.chronicFatigue.toFixed(3)}</p>
                          </div>
                        </div>

                        {/* 충동성 바이오마커 */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">충동성 관련 지표</h4>
                          <div className="space-y-1 text-sm">
                            <p>억제 기능: {analysisResult.biomarkers.impulsivity.eegMarkers.inhibitionFunction.toFixed(3)}</p>
                            <p>감마파 동기화: {analysisResult.biomarkers.impulsivity.eegMarkers.gammaSynchronization.toFixed(3)}</p>
                            <p>반응 억제: {analysisResult.biomarkers.impulsivity.eegMarkers.responseInhibition.toFixed(3)}</p>
                            <p>감정 반응성: {analysisResult.biomarkers.impulsivity.ppgMarkers.emotionalReactivity.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 위험도 평가 결과 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">⚠️ 정신건강 위험도 평가</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysisResult.riskAssessment.scores).map(([key, score]) => {
                          const labels = {
                            depression: '우울 위험도',
                            adhd: 'ADHD 위험도',
                            burnout: '번아웃 위험도',
                            impulsivity: '충동성 위험도'
                          };
                          
                          const colors = {
                            depression: 'bg-blue-100 text-blue-800',
                            adhd: 'bg-green-100 text-green-800',
                            burnout: 'bg-orange-100 text-orange-800',
                            impulsivity: 'bg-purple-100 text-purple-800'
                          };

                          return (
                            <div key={key} className={`p-4 rounded-lg ${colors[key as keyof typeof colors]}`}>
                              <h4 className="font-semibold mb-2">{labels[key as keyof typeof labels]}</h4>
                              <div className="text-2xl font-bold mb-2">{score.toFixed(1)}/100</div>
                              <div className="w-full bg-white rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    score < 30 ? 'bg-green-500' : 
                                    score < 60 ? 'bg-yellow-500' : 
                                    score < 80 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">📊 종합 평가</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>전체 위험도:</strong> {analysisResult.riskAssessment.overallRisk.toFixed(1)}/100
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>위험 수준:</strong> {analysisResult.riskAssessment.riskLevel}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>주요 위험 요소:</strong> {analysisResult.riskAssessment.primaryRiskFactors.join(', ')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMentalHealthAnalysis; 