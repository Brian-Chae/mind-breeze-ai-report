export const indexGuides: Record<string, string> = {
  // EEG 지수
  '집중력': `
    <strong>설명:</strong> 집중력 지수는 인지적 집중 수준을 나타내며, 베타파 파워와 알파파 및 세타파 파워의 합의 비율로 계산됩니다. 높은 값은 깊은 집중을, 낮은 값은 주의 분산을 의미합니다.<br/>
    <strong>공식:</strong> 집중력 지수 = 베타파 파워 / (알파파 파워 + 세타파 파워)<br/>
    <strong>정상 범위:</strong> 1.8 - 2.4<br/>
    <strong>해석:</strong><br/>
    • 1.8 - 2.4: 정상적인 집중 수준<br/>
    • 1.8 미만: 주의력 결핍 혹은 졸음<br/>
    • 2.4 이상: 과도한 집중 혹은 스트레스<br/>
    <strong>참고문헌:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance. Brain Research Reviews, 29(2-3), 169-195
  `,
  '이완도': `
    <strong>설명:</strong> 이완도 지수는 상대적 알파파 활동을 기반으로 정신적 이완 상태를 측정합니다. 높은 값일수록 더 이완된 상태를 나타냅니다.<br/>
    <strong>공식:</strong> 이완도 지수 = 알파파 파워 / (알파파 파워 + 베타파 파워)<br/>
    <strong>정상 범위:</strong> 0.18 - 0.22 (정상적인 긴장 상태)<br/>
    <strong>해석:</strong> 0.18 미만: 긴장 및 스트레스 상태; 0.22 초과: 과도한 이완<br/>
    <strong>참고문헌:</strong> Bazanova, O. M., & Vernon, D. (2014). Neuroscience & Biobehavioral Reviews, 44, 94-110
  `,
  '스트레스': `
    <strong>설명:</strong> 스트레스 지수는 정신적 스트레스와 각성 상태를 나타내며, 고주파수(베타파, 감마파) 활동 증가와 함께 상승합니다.<br/>
    <strong>공식:</strong> 스트레스 지수 = (베타파 파워 + 감마파 파워) / (알파파 파워 + 세타파 파워)<br/>
    <strong>정상 범위:</strong> 3.0 - 4.0 (정상 범위)<br/>
    <strong>해석:</strong> 2.0 미만: 매우 낮은 스트레스; 2.0-3.0: 낮은 스트레스; 3.0-4.0: 정상 범위; 4.0-5.0: 높은 스트레스; 5.0 초과: 심각한 스트레스<br/>
    <strong>참고문헌:</strong> Ahn, J. W., et al. (2019). Sensors, 19(21), 4644
  `,
  '좌우뇌 균형': `
    <strong>설명:</strong> 좌우뇌 균형은 좌뇌와 우뇌 간 알파파 활동의 균형을 나타내며, 감정적 및 인지적 편향을 반영합니다.<br/>
    <strong>공식:</strong> (좌뇌 알파파 - 우뇌 알파파) / (좌뇌 알파파 + 우뇌 알파파)<br/>
    <strong>정상 범위:</strong> -0.1 ~ 0.1 (균형 상태)<br/>
    <strong>해석:</strong> -0.1 이하: 창의적 (우뇌 우세); 0.1 이상: 논리적 (좌뇌 우세)<br/>
    <strong>참고문헌:</strong> Davidson, R. J. (2004). Biological Psychology, 67(1-2), 219-234
  `,
  '인지 부하': `
    <strong>설명:</strong> 인지 부하는 세타파/알파파 비율을 기반으로 정신적 작업 부하와 노력을 반영합니다.<br/>
    <strong>공식:</strong> 인지 부하 = 세타파 파워 / 알파파 파워<br/>
    <strong>정상 범위:</strong> 0.3 - 0.8 (최적 부하)<br/>
    <strong>해석:</strong> 0.3 미만: 낮은 참여도; 0.8 초과: 높은 인지 부하; 1.2 초과: 과부하<br/>
    <strong>참고문헌:</strong> Gevins, A., & Smith, M. E. (2003). Theoretical Issues in Ergonomics Science, 4(1-2), 113-131
  `,
  '정서 안정성': `
    <strong>설명:</strong> 정서 안정성은 낮은 주파수와 감마파 파워의 비율을 기반으로 감정 조절 능력을 측정합니다.<br/>
    <strong>공식:</strong> 정서 안정성 = (알파파 파워 + 세타파 파워) / 감마파 파워<br/>
    <strong>정상 범위:</strong> 0.4 - 0.8 (정상 범위)<br/>
    <strong>해석:</strong> 0.4 미만: 정서 불안정, 과도한 각성; 0.8 초과: 정서 둔화, 과도한 억제<br/>
    <strong>참고문헌:</strong> Knyazev, G. G. (2007). Neuroscience & Biobehavioral Reviews, 31(3), 377-395
  `,
  '총 파워': `
    <strong>신경활동성 (Neural Activity)</strong><br/>
    <strong>설명:</strong> 모든 EEG 밴드 파워의 합으로, 전체적인 신경 활동 수준을 나타냅니다.<br/>
    <strong>공식:</strong> 델타파 + 세타파 + 알파파 + 베타파 + 감마파 밴드 파워의 합<br/>
    <strong>정상 범위:</strong> 850-1150 μV²<br/>
    <strong>해석:</strong><br/>
    • 850-1150: 정상적인 신경 활동 수준<br/>
    • 1150 이상: 과도한 신경 활동 (과각성, 스트레스 상태)<br/>
    • 850 미만: 억제된 신경 활동 (저각성, 졸음 상태)<br/>
    <strong>참고문헌:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance
  `,
  
  '신경활동성': `
    <strong>신경활동성 (Neural Activity)</strong><br/>
    <strong>설명:</strong> 모든 EEG 밴드 파워의 합으로, 전체적인 신경 활동 수준을 나타냅니다.<br/>
    <strong>공식:</strong> 델타파 + 세타파 + 알파파 + 베타파 + 감마파 밴드 파워의 합<br/>
    <strong>정상 범위:</strong> 850-1150 μV²<br/>
    <strong>해석:</strong><br/>
    • 850-1150: 정상적인 신경 활동 수준<br/>
    • 1150 이상: 과도한 신경 활동 (과각성, 스트레스 상태)<br/>
    • 850 미만: 억제된 신경 활동 (저각성, 졸음 상태)<br/>
    <strong>참고문헌:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance
  `,

  // 새로운 라벨명에 대한 설명 추가
  '집중력 (Focus)': `
    <strong>설명:</strong> 집중력 지수는 인지적 집중 수준을 나타내며, 베타파 파워와 알파파 및 세타파 파워의 합의 비율로 계산됩니다. 높은 값은 깊은 집중을, 낮은 값은 주의 분산을 의미합니다.<br/>
    <strong>공식:</strong> 집중력 지수 = 베타파 파워 / (알파파 파워 + 세타파 파워)<br/>
    <strong>정상 범위:</strong> 1.8 - 2.4<br/>
    <strong>해석:</strong><br/>
    • 1.8 - 2.4: 정상적인 집중 수준<br/>
    • 1.8 미만: 주의력 결핍 혹은 졸음<br/>
    • 2.4 이상: 과도한 집중 혹은 스트레스<br/>
    <strong>참고문헌:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance. Brain Research Reviews, 29(2-3), 169-195
  `,
  
  '이완및긴장도 (Arousal)': `
    <strong>설명:</strong> 이완 및 긴장도 지수는 상대적 알파파 활동을 기반으로 정신적 각성과 이완 상태를 측정합니다. 높은 값일수록 더 이완된 상태를, 낮은 값일수록 긴장된 상태를 나타냅니다.<br/>
    <strong>공식:</strong> 이완도 지수 = 알파파 파워 / (알파파 파워 + 베타파 파워)<br/>
    <strong>정상 범위:</strong> 0.18 - 0.22 (정상적인 긴장 상태)<br/>
    <strong>해석:</strong> 0.18 미만: 긴장 및 스트레스 상태; 0.22 초과: 과도한 이완<br/>
    <strong>참고문헌:</strong> Bazanova, O. M., & Vernon, D. (2014). Neuroscience & Biobehavioral Reviews, 44, 94-110
  `,
  
  '정서안정성 (Valence)': `
    <strong>설명:</strong> 정서안정성 지수는 낮은 주파수와 감마파 파워의 비율을 기반으로 감정 조절 능력과 정서적 안정성을 측정합니다. 적절한 범위 내의 값일수록 안정된 정서 상태를 나타냅니다.<br/>
    <strong>공식:</strong> 정서 안정성 = (알파파 파워 + 세타파 파워) / 감마파 파워<br/>
    <strong>정상 범위:</strong> 0.4 - 0.8 (정상 범위)<br/>
    <strong>해석:</strong> 0.4 미만: 정서 불안정, 과도한 각성; 0.8 초과: 정서 둔화, 과도한 억제<br/>
    <strong>참고문헌:</strong> Knyazev, G. G. (2007). Neuroscience & Biobehavioral Reviews, 31(3), 377-395
  `,
  
  '스트레스 (Stress)': `
    <strong>설명:</strong> 스트레스 지수는 정신적 스트레스와 각성 상태를 나타내며, 고주파수(베타파, 감마파) 활동 증가와 함께 상승합니다. 높은 값일수록 더 높은 스트레스 수준을 의미합니다.<br/>
    <strong>공식:</strong> 스트레스 지수 = (베타파 파워 + 감마파 파워) / (알파파 파워 + 세타파 파워)<br/>
    <strong>정상 범위:</strong> 3.0 - 4.0 (정상 범위)<br/>
    <strong>해석:</strong> 2.0 미만: 매우 낮은 스트레스; 2.0-3.0: 낮은 스트레스; 3.0-4.0: 정상 범위; 4.0-5.0: 높은 스트레스; 5.0 초과: 심각한 스트레스<br/>
    <strong>참고문헌:</strong> Ahn, J. W., et al. (2019). Sensors, 19(21), 4644
  `,

  // PPG 지수
  'BPM': `
    <strong>BPM (Beats Per Minute)</strong><br/>
    심박수 - 1분당 심장 박동 횟수<br/><br/>
    
    <strong>측정 방법:</strong> PPG 신호에서 피크 간격을 분석하여 계산<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 60-100 BPM: 정상 범위<br/>
    • 60 BPM 미만: 서맥 (낮은 심박수)<br/>
    • 100 BPM 초과: 빈맥 (높은 심박수)<br/><br/>
    
    <strong>해석:</strong> 기본적인 심혈관 건강 지표로, 운동, 스트레스, 약물 등에 영향받음<br/><br/>
    
    <strong>참고문헌:</strong> American Heart Association Guidelines
  `,
  'SpO2': `
    <strong>SpO2 (Oxygen Saturation)</strong><br/>
    산소포화도 - 혈액 내 산소 농도<br/><br/>
    
    <strong>측정 방법:</strong> Red/IR 광흡수 비율을 이용한 Beer-Lambert 법칙 기반 계산<br/>
    • R = (Red_AC/Red_DC) / (IR_AC/IR_DC)<br/>
    • 다단계 보정 공식으로 SpO2 추정<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 98-100%: 정상 산소포화도<br/>
    • 95-98%: 정상 범위 (하한)<br/>
    • 90-95%: 경미한 저산소증<br/>
    • 90% 미만: 심각한 저산소증 (의료진 상담 필요)<br/><br/>
    
    <strong>해석:</strong> 호흡기 및 순환기 기능 평가. 의료기기 대비 정확도 제한적<br/><br/>
    
    <strong>참고문헌:</strong> Pulse Oximetry Principles, IEEE TBME
  `,
  'Stress': `
    <strong>Stress Index (스트레스 지수)</strong><br/>
    HRV 기반 정규화된 스트레스 수준 (0.0-1.0)<br/><br/>
    
    <strong>공식:</strong> 정규화된 SDNN, RMSSD, 심박수의 가중평균<br/>
    • Stress = (정규화SDNN × 0.4) + (정규화RMSSD × 0.4) + (심박수스트레스 × 0.2)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 0.30-0.70: 정상 범위 (균형 상태)<br/>
    • 0.00-0.30: 매우 낮은 스트레스 (과도한 이완)<br/>
    • 0.70-0.90: 높은 스트레스 (긴장 상태)<br/>
    • 0.90-1.00: 매우 높은 스트레스 (심각한 긴장)<br/><br/>
    
    <strong>해석:</strong> 낮음: 이완 상태; 높음: 스트레스나 피로 상태<br/><br/>
    
    <strong>참고문헌:</strong> HRV Analysis Methods, Frontiers in Physiology
  `,
  'SDNN': `
    <strong>SDNN (Standard Deviation of NN intervals)</strong><br/>
    NN간격의 표준편차 - 전체 HRV 수준<br/><br/>
    
    <strong>공식:</strong> SDNN = √(Σ(RRᵢ - RR̄)² / (N-1))<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 30-100 ms: 정상 범위<br/>
    • 30 ms 미만: 심박 리듬 일정함 (스트레스나 피로 상태)<br/>
    • 100 ms 초과: 심박 리듬 유연함 (매우 건강하고 회복력 좋은 상태)<br/><br/>
    
    <strong>해석:</strong> 낮음: 신체 회복력 저하; 높음: 스트레스나 긴장 상태<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996
  `,
  'RMSSD': `
    <strong>RMSSD (Root Mean Square of Successive Differences)</strong><br/>
    연속 RR간격 차이의 제곱근 평균 제곱<br/><br/>
    
    <strong>공식:</strong> RMSSD = √(Σ(RRᵢ₊₁ - RRᵢ)² / (N-1))<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 20-50 ms: 정상 범위<br/>
    • 20 ms 미만: 긴장 상태 (휴식이 필요한 상태)<br/>
    • 50 ms 초과: 매우 편안한 상태 (깊은 휴식 상태)<br/><br/>
    
    <strong>해석:</strong> 낮음: 긴장 상태 (휴식 부족); 높음: 매우 편안한 상태<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996
  `,
  'PNN50': `
    <strong>PNN50 (Percentage of NN50)</strong><br/>
    50ms 초과 차이나는 연속 NN간격의 백분율<br/><br/>
    
    <strong>공식:</strong> PNN50 = (NN50 count / Total NN intervals) × 100%<br/>
    NN50 = |RRᵢ₊₁ - RRᵢ| > 50ms인 간격의 개수<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 10-30%: 정상 범위<br/>
    • 10% 미만: 심박 리듬 규칙적 (긴장이나 피로 상태)<br/>
    • 30% 초과: 심박 리듬 유연함 (건강하고 회복력 좋은 상태)<br/><br/>
    
    <strong>해석:</strong> 부교감신경 활동의 지표. 높을수록 회복력이 좋은 상태<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996
  `,
  'LF': `
    <strong>LF (Low Frequency Power)</strong><br/>
    저주파 대역 파워 (0.04-0.15 Hz) - 교감신경 활동 지표<br/><br/>
    
    <strong>측정 방법:</strong> RR간격의 Welch Periodogram을 통한 파워 스펙트럼 밀도 계산<br/>
    <strong>단위:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 200-1,200 ms²: 적절한 교감신경 활동 (연구 평균: 519±291 ms²)<br/>
    • 200 ms² 미만: 낮은 교감신경 활동 (과도한 휴식)<br/>
    • 1,200 ms² 초과: 높은 교감신경 활동 (스트레스나 긴장)<br/><br/>
    
    <strong>해석:</strong> 교감신경계의 활성도를 반영. 스트레스, 신체 활동, 정신적 각성 상태에서 증가<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'HF': `
    <strong>HF (High Frequency Power)</strong><br/>
    고주파 대역 파워 (0.15-0.4 Hz) - 부교감신경 활동 지표<br/><br/>
    
    <strong>측정 방법:</strong> RR간격의 Welch Periodogram을 통한 파워 스펙트럼 밀도 계산<br/>
    <strong>단위:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 80-4,000 ms²: 적절한 부교감신경 활동 (연구 평균: 657±777 ms²)<br/>
    • 80 ms² 미만: 낮은 부교감신경 활동 (스트레스나 피로)<br/>
    • 4,000 ms² 초과: 높은 부교감신경 활동 (깊은 휴식)<br/><br/>
    
    <strong>해석:</strong> 부교감신경계의 활성도를 반영. 휴식, 소화, 회복 상태에서 증가<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'LF/HF': `
    <strong>LF/HF Ratio</strong><br/>
    저주파/고주파 파워 비율 - 자율신경 균형<br/><br/>
    
    <strong>공식:</strong> LF/HF = LF Power / HF Power<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 1.0-10.0: 정상 범위 (연구 평균: 2.8±2.6, 권장 균형: 1.5-2.5)<br/>
    • 1.0 미만: 부교감신경 우세 (매우 편안한 상태)<br/>
    • 1.5-2.5: 이상적인 균형 상태<br/>
    • 2.5-10.0: 교감신경 우세 (활동/긴장 상태)<br/>
    • 10.0 초과: 심각한 스트레스<br/><br/>
    
    <strong>해석:</strong> 낮음: 휴식/회복 상태; 균형: 건강한 상태; 높음: 스트레스/활동 상태<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'SDSD': `
    <strong>SDSD (Standard Deviation of Successive Differences)</strong><br/>
    심박 변화의 일관성을 나타내는 지표<br/><br/>
    
    <strong>공식:</strong> SDSD = √(Σ((RRᵢ₊₁ - RRᵢ) - mean_diff)² / (N-1))<br/>
    여기서 mean_diff는 연속 차이의 평균<br/><br/>
    
    <strong>건강 상태 해석:</strong><br/>
    • 15-40 ms: 정상적인 심박 변화<br/>
    • 15 ms 미만: 심박 변화 적음 (스트레스나 피로 상태)<br/>
    • 40 ms 초과: 심박 변화 활발함 (회복력 좋은 상태)<br/><br/>
    
    <strong>의미:</strong> RMSSD와 비슷하지만 다른 계산법을 사용합니다. 높을수록 자율신경이 활발하게 반응하여 스트레스 회복력이 좋은 상태입니다.<br/><br/>
    
    <strong>참고문헌:</strong> Heart Rate Variability Analysis Methods
  `,
  'PPG 스트레스': `
    <strong>설명:</strong> 심박변이도 기반 스트레스 지수로, 자율신경계의 균형 상태를 반영합니다.<br/>
    <strong>공식:</strong> 다양한 HRV 지표들의 조합을 통한 스트레스 수준 계산<br/>
    <strong>정상 범위:</strong> 30% - 70% (적절한 스트레스)<br/>
    <strong>해석:</strong> 30% 미만: 스트레스 부족, 낮은 각성; 70% 초과: 과도한 스트레스, 높은 긴장<br/>
    <strong>참고문헌:</strong> 심박변이도 기반 스트레스 측정 연구
  `,

  // ACC 지수
  'Activity State': `
    <strong>Activity State (활동 상태)</strong><br/>
    가속도계 데이터를 기반으로 분류된 신체 활동 수준<br/><br/>
    
    <strong>측정 방법:</strong> 3축 가속도(X, Y, Z)의 합성 벡터 크기를 계산하고 중력 성분(1g)을 제거<br/>
    <strong>공식:</strong> 움직임 크기 = |√(x² + y² + z²) - 1g|<br/><br/>
    
    <strong>분류 기준:</strong><br/>
    • 0.0-0.1g: Stationary (정지 상태)<br/>
    • 0.1-0.3g: Sitting (앉기/가벼운 움직임)<br/>
    • 0.3-0.8g: Walking (걷기/중간 활동)<br/>
    • 0.8g 이상: Running (뛰기/격렬한 활동)<br/><br/>
    
    <strong>해석:</strong> 실시간 신체 활동 강도를 분류하여 대사율, 칼로리 소모, 운동량 평가에 활용<br/><br/>
    
    <strong>참고문헌:</strong> Troiano, R. P., et al. (2008). Medicine & Science in Sports & Exercise, 40(1), 181-188
  `,
  '안정성': `
    <strong>안정성 (Stability Index)</strong><br/>
    자세 안정성과 균형 유지 능력을 나타내는 지표<br/><br/>
    
    <strong>측정 방법:</strong> 가속도 변화의 표준편차를 이용한 안정성 계산<br/>
    <strong>공식:</strong> 안정성 = 100 - (움직임 변동성 × 정규화 계수)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 70-100%: 매우 안정적인 자세<br/>
    • 50-70%: 보통 안정성 (일상적 움직임)<br/>
    • 30-50%: 불안정한 자세 (주의 필요)<br/>
    • 30% 미만: 매우 불안정 (균형 장애 가능성)<br/><br/>
    
    <strong>해석:</strong> 높을수록 자세가 안정적이며, 낙상 위험이 낮고 균형 능력이 우수함을 의미<br/><br/>
    
    <strong>참고문헌:</strong> Mancini, M., & Horak, F. B. (2010). Journal of NeuroEngineering and Rehabilitation, 7(1), 17
  `,
  '강도': `
    <strong>강도 (Intensity Index)</strong><br/>
    움직임의 전반적인 강도와 에너지 소모 수준<br/><br/>
    
    <strong>측정 방법:</strong> 가속도 크기의 평균과 최대값을 이용한 강도 계산<br/>
    <strong>공식:</strong> 강도 = (평균 움직임 크기 / 최대 가능 움직임) × 100<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 0-25%: 저강도 활동 (휴식, 수면)<br/>
    • 25-50%: 중저강도 활동 (일상 생활)<br/>
    • 50-75%: 중고강도 활동 (운동, 작업)<br/>
    • 75-100%: 고강도 활동 (격렬한 운동)<br/><br/>
    
    <strong>해석:</strong> 신체 활동의 강도를 정량화하여 운동량 평가와 건강 관리에 활용<br/><br/>
    
    <strong>참고문헌:</strong> Freedson, P. S., et al. (1998). Medicine & Science in Sports & Exercise, 30(5), 777-781
  `,
  '균형': `
    <strong>균형 (Balance Index)</strong><br/>
    X, Y축 간의 움직임 균형과 좌우/전후 대칭성<br/><br/>
    
    <strong>측정 방법:</strong> X축과 Y축 가속도의 상대적 분포와 균형도 계산<br/>
    <strong>공식:</strong> 균형 = 100 - |X축 움직임 비율 - Y축 움직임 비율| × 200<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 80-100%: 매우 균형잡힌 움직임<br/>
    • 60-80%: 양호한 균형 (정상 범위)<br/>
    • 40-60%: 불균형한 움직임 (주의 필요)<br/>
    • 40% 미만: 심각한 불균형 (재활 필요 가능성)<br/><br/>
    
    <strong>해석:</strong> 좌우 또는 전후 움직임의 대칭성을 평가하여 보행 패턴이나 자세 이상을 감지<br/><br/>
    
    <strong>참고문헌:</strong> Hausdorff, J. M. (2007). Journal of NeuroEngineering and Rehabilitation, 4(1), 14
  `,
  'Average Movement': `
    <strong>Average Movement (평균 움직임)</strong><br/>
    측정 기간 동안의 평균 움직임 크기 (중력 보정)<br/><br/>
    
    <strong>측정 방법:</strong> 모든 샘플의 움직임 크기를 평균하여 계산<br/>
    <strong>공식:</strong> 평균 움직임 = Σ|√(xᵢ² + yᵢ² + zᵢ²) - 1g| / N<br/>
    <strong>단위:</strong> g (중력 가속도 단위, 1g = 9.8 m/s²)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 0.0-0.1g: 정적 상태 (수면, 휴식)<br/>
    • 0.1-0.3g: 경미한 활동 (사무, 독서)<br/>
    • 0.3-0.6g: 보통 활동 (걷기, 가사)<br/>
    • 0.6g 이상: 활발한 활동 (운동, 작업)<br/><br/>
    
    <strong>해석:</strong> 일정 기간의 전반적인 활동 수준을 나타내며, 일일 활동량 평가와 건강 지표로 활용<br/><br/>
    
    <strong>참고문헌:</strong> Sasaki, J. E., et al. (2011). Medicine & Science in Sports & Exercise, 43(8), 1568-1574
  `,
  'Standard Deviation Movement': `
    <strong>Standard Deviation Movement (움직임 표준편차)</strong><br/>
    움직임 크기의 변동성과 불규칙성을 나타내는 지표<br/><br/>
    
    <strong>측정 방법:</strong> 움직임 크기의 표준편차를 계산<br/>
    <strong>공식:</strong> 표준편차 = √(Σ(움직임ᵢ - 평균움직임)² / (N-1))<br/>
    <strong>단위:</strong> g (중력 가속도 단위)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 0.0-0.1g: 매우 일관된 움직임 (정적 상태)<br/>
    • 0.1-0.3g: 일관된 움직임 (규칙적 활동)<br/>
    • 0.3-0.6g: 변동적 움직임 (다양한 활동)<br/>
    • 0.6g 이상: 매우 불규칙한 움직임 (격렬하거나 불안정한 활동)<br/><br/>
    
    <strong>해석:</strong> 낮음: 규칙적이고 예측 가능한 움직임; 높음: 불규칙하고 다양한 움직임 패턴<br/><br/>
    
    <strong>참고문헌:</strong> Bussmann, J. B., & van de Berg-Emons, R. J. (2013). Gait & Posture, 37(3), 340-347
  `,
  'Max Movement': `
    <strong>Max Movement (최대 움직임)</strong><br/>
    측정 기간 중 감지된 최대 움직임 크기<br/><br/>
    
    <strong>측정 방법:</strong> 모든 샘플 중 가장 큰 움직임 크기를 추출<br/>
    <strong>공식:</strong> 최대 움직임 = max(|√(xᵢ² + yᵢ² + zᵢ²) - 1g|)<br/>
    <strong>단위:</strong> g (중력 가속도 단위)<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 0.0-0.5g: 일상적 움직임 (정상 생활)<br/>
    • 0.5-1.0g: 활발한 움직임 (운동, 작업)<br/>
    • 1.0-2.0g: 격렬한 움직임 (달리기, 점프)<br/>
    • 2.0g 이상: 매우 격렬한 움직임 (충격, 낙상 가능성)<br/><br/>
    
    <strong>해석:</strong> 최대 가속도 이벤트를 감지하여 충격, 낙상, 격렬한 활동 등을 모니터링<br/><br/>
    
    <strong>참고문헌:</strong> Karantonis, D. M., et al. (2006). IEEE Transactions on Information Technology in Biomedicine, 10(1), 156-167
  `,

  // 새로운 HRV 지표들 추가
  'AVNN': `
    <strong>AVNN (Average NN Intervals)</strong><br/>
    평균 심박주기 - 심장 박동 간격의 평균<br/><br/>
    
    <strong>공식:</strong> AVNN = Σ(RRᵢ) / N<br/>
    여기서 RRᵢ는 각 NN간격, N은 총 간격 수<br/><br/>
    
    <strong>건강 상태 해석:</strong><br/>
    • 600-1000 ms: 안정적인 심박 리듬<br/>
    • 600 ms 미만: 빠른 심박 (활동적이거나 긴장 상태)<br/>
    • 1000 ms 초과: 느린 심박 (휴식 상태나 운동선수형)<br/><br/>
    
    <strong>의미:</strong> 심박수가 빠를수록 AVNN은 작아지고, 느릴수록 커집니다. 개인의 기본 심박 상태를 나타내는 중요한 지표입니다.<br/><br/>
    
    <strong>참고문헌:</strong> Task Force of ESC/NASPE, 1996
  `,
  'PNN20': `
    <strong>PNN20 (Percentage of NN20)</strong><br/>
    심박 리듬의 미세한 변화 감지 지표<br/><br/>
    
    <strong>공식:</strong> PNN20 = (NN20 count / Total NN intervals) × 100%<br/>
    NN20 = |RRᵢ₊₁ - RRᵢ| > 20ms인 간격의 개수<br/><br/>
    
    <strong>건강 상태 해석:</strong><br/>
    • 20-60%: 적절한 심박 변화<br/>
    • 20% 미만: 심박 리듬 일정함 (긴장이나 피로 상태)<br/>
    • 60% 초과: 심박 리듬 유연함 (건강한 상태)<br/><br/>
    
    <strong>의미:</strong> PNN50보다 민감하여 작은 스트레스나 회복 상태도 감지할 수 있습니다. 높을수록 자율신경이 유연하게 반응하는 건강한 상태입니다.<br/><br/>
    
    <strong>참고문헌:</strong> HRV Analysis Methods, IEEE TBME
  `,
  'HR Max': `
    <strong>HR Max (Heart Rate Maximum)</strong><br/>
    최근 2분간(120개 샘플) 측정된 심박수 중 최고점<br/><br/>
    
    <strong>계산 방법:</strong> Moving Average Queue(120개)에서 BPM 최대값 추출<br/>
    • 각 시점의 심박수를 BPM으로 변환<br/>
    • 고품질 데이터만 큐에 저장<br/>
    • 큐에서 최고점을 실시간으로 추적<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 80-150 BPM: 정상 최대 심박수<br/>
    • 80 BPM 미만: 낮은 최대 심박수<br/>
    • 150 BPM 초과: 높은 최대 심박수<br/><br/>
    
    <strong>해석:</strong> 최근 2분간 심박수 변동의 상한선. 스트레스 반응이나 활동 강도 평가에 유용<br/><br/>
    
    <strong>참고문헌:</strong> Heart Rate Variability Analysis Guidelines
  `,
  'HR Min': `
    <strong>HR Min (Heart Rate Minimum)</strong><br/>
    최근 2분간(120개 샘플) 측정된 심박수 중 최저점<br/><br/>
    
    <strong>계산 방법:</strong> Moving Average Queue(120개)에서 BPM 최소값 추출<br/>
    • 각 시점의 심박수를 BPM으로 변환<br/>
    • 고품질 데이터만 큐에 저장<br/>
    • 큐에서 최저점을 실시간으로 추적<br/><br/>
    
    <strong>정상 범위:</strong><br/>
    • 50-80 BPM: 정상 최소 심박수<br/>
    • 50 BPM 미만: 낮은 최소 심박수<br/>
    • 80 BPM 초과: 높은 최소 심박수<br/><br/>
    
    <strong>해석:</strong> 최근 2분간 심박수 변동의 하한선. 휴식 시 심혈관 효율성이나 회복 상태 평가에 유용<br/><br/>
    
    <strong>참고문헌:</strong> Heart Rate Variability Analysis Guidelines
  `
}; 