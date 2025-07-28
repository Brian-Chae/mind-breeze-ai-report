# EEG 분석 프롬프트 실제 예시

## 프롬프트 템플릿 적용 예시

### 입력 데이터 (32세 남성 소프트웨어 개발자)

```json
{
  "personalInfo": {
    "age": 32,
    "gender": "male", 
    "occupation": "software_developer"
  },
  "eegData": {
    "bandPowers": {
      "delta": { "mean": 125.3, "std": 28.4, "min": 85.2, "max": 185.7 },
      "theta": { "mean": 168.9, "std": 35.2, "min": 120.5, "max": 235.8 },
      "alpha": { "mean": 165.4, "std": 42.1, "min": 115.3, "max": 248.9 },
      "beta": { "mean": 342.7, "std": 68.5, "min": 245.2, "max": 465.3 },
      "gamma": { "mean": 58.2, "std": 16.8, "min": 38.4, "max": 89.7 }
    },
    "eegIndices": {
      "focusIndex": 2.85,
      "relaxationIndex": 0.125, 
      "stressIndex": 0.78,
      "hemisphericBalance": 0.18,
      "cognitiveLoad": 2.41,
      "emotionalStability": 0.62
    },
    "qualityMetrics": {
      "signalQuality": 0.87,
      "measurementDuration": 305,
      "dataCompleteness": 0.94
    }
  }
}
```

## 실제 Gemini API 프롬프트

```
# EEG 전문 분석 요청

당신은 세계적 수준의 EEG 분석 전문가이자 신경과 전문의입니다. 
다음 개인의 뇌파 데이터를 의료급 수준으로 분석하여 종합적인 해석을 제공해주세요.

## 개인 정보
- 나이: 32세
- 성별: 남성
- 직업: 소프트웨어 개발자

## 개인별 정상 범위 (32세 남성 기준)
- Delta Power: 60-180 μV² (수면과 깊은 이완 상태)
- Theta Power: 100-220 μV² (창의성과 직관적 사고)  
- Alpha Power: 180-450 μV² (편안한 각성 상태)
- Beta Power: 90-280 μV² (집중과 논리적 사고)
- Gamma Power: 18-75 μV² (고차원적 인지 처리)

## EEG 측정 데이터 통계
### Band Power Analysis (μV²)
- Delta Power (0.5-4Hz): 평균 125.3, 표준편차 28.4, 최소 85.2, 최대 185.7
- Theta Power (4-8Hz): 평균 168.9, 표준편차 35.2, 최소 120.5, 최대 235.8
- Alpha Power (8-13Hz): 평균 165.4, 표준편차 42.1, 최소 115.3, 최대 248.9
- Beta Power (13-30Hz): 평균 342.7, 표준편차 68.5, 최소 245.2, 최대 465.3
- Gamma Power (30-100Hz): 평균 58.2, 표준편차 16.8, 최소 38.4, 최대 89.7

### EEG 지수 분석
- Focus Index: 2.85 (집중력 지수, 정상 1.5-3.0)
- Relaxation Index: 0.125 (이완도 지수, 정상 0.15-0.35)
- Stress Index: 0.78 (스트레스 지수, 정상 0.3-0.7)
- Hemispheric Balance: 0.18 (좌우뇌 균형, 정상 -0.1~+0.1)
- Cognitive Load: 2.41 (인지 부하, 정상 1.0-2.5)
- Emotional Stability: 0.62 (정서 안정성, 정상 0.6-0.9)

### 데이터 품질 정보
- 신호 품질: 0.87 (우수)
- 측정 시간: 305초
- 데이터 완성도: 0.94 (매우 양호)

## 소프트웨어 개발자 직업의 EEG 특성
예상 패턴: 높은 Beta 활성, 좌뇌 우세, 지속적 집중력, 중등도 스트레스 위험
위험 요소: 정신적 피로, 주의력 저하, 스트레스 누적
일반적 권장사항: 규칙적 휴식, 우뇌 활성화 활동, 이완 훈련

## 분석 요구사항

### 1. 3대 핵심 의견 도출 (우선순위 순)

**분석 기준:**
- 32세 남성의 정상 범위 기준 편차 정도
- 소프트웨어 개발자 직업 특성 고려
- 각 지표 간 상관관계 분석
- 임상적 의미와 일상생활 영향도

**우선순위 결정 기준:**
1. 정상 범위 초과 정도와 임상적 중요성
2. 직업적 특성과의 관련성
3. 다른 지표들과의 상관관계 강도

각 우선순위별로 다음을 포함:
- 핵심 의견: 명확하고 구체적인 소견 (제목과 요약)
- 데이터 근거: 
  * 주요 지표들의 실제 값과 정상범위 비교
  * 보조 지표들의 지원 근거
  * 통계적 분석 (상관관계, 인구집단 비교)
- 타당성 의견:
  * 과학적 근거 (신경생리학적 메커니즘)
  * 관련 연구논문 요약 (1-2개)
  * 해석의 한계점 및 주의사항

### 2. 상세 데이터 분석 결과

**Band Power 상세 분석:**
각 주파수 대역별로:
- 해석: 32세 남성 소프트웨어 개발자 기준 의학적 해석
- 근거: 관찰된 값의 임상적 의미와 정상 범위 대비 평가
- 임상적 중요성: 해당 소견이 갖는 의학적 의미

**EEG 지수 상세 분석:**
Focus, Relaxation, Stress, Hemispheric Balance, Cognitive Load, Emotional Stability 각각에 대해:
- 해석: 현재 상태의 의학적 해석
- 근거: 구체적 계산 방식과 정상 범위 비교
- 개선 방안: 개인 특성 고려한 맞춤 권장사항 (3-5개)

**인지 상태 종합 분석:**
- 전반적인 뇌 기능 상태 평가
- 주의력 패턴 분석  
- 정신적 피로도 평가
- 신경학적 지표 해석

## 응답 형식
반드시 다음 JSON 형식으로 응답해주세요:

```json
{
  "analysisResults": [
    {
      "priority": 1,
      "coreOpinion": {
        "title": "핵심 소견 제목",
        "summary": "핵심 의견 요약 (2-3문장)",
        "clinicalSignificance": "정상|경미한 이상|중등도 이상|심각한 이상",
        "personalizedInterpretation": "32세 남성 소프트웨어 개발자 특성을 고려한 개인화된 해석"
      },
      "dataEvidence": {
        "primaryMetrics": [
          {
            "metricName": "지표명",
            "observedValue": 숫자,
            "normalRange": "정상 범위 문자열",
            "deviation": "정상 범위|경미하게 높음|경미하게 낮음|현저히 높음|현저히 낮음",
            "interpretation": "해당 지표의 의학적 의미"
          }
        ],
        "supportingMetrics": [
          {
            "metricName": "보조 지표명",
            "observedValue": 숫자,
            "interpretation": "보조 근거 설명"
          }
        ],
        "statisticalAnalysis": {
          "correlationAnalysis": "지표 간 상관관계 분석",
          "demographicComparison": "동일 연령/성별/직업군 대비 비교 분석"
        }
      },
      "validityOpinion": {
        "scientificBasis": "과학적 근거 설명",
        "clinicalReferences": [
          {
            "referenceType": "연구논문|임상사례|가이드라인|메타분석",
            "summary": "참고자료 요약 (1-2문장)",
            "relevance": "현재 사례와의 연관성 설명"
          }
        ],
        "limitationsAndCaveats": "해석의 한계점 및 주의사항"
      }
    }
    // 우선순위 2, 3도 동일한 구조
  ],
  "detailedDataAnalysis": {
    "bandPowerAnalysis": {
      "delta": {
        "interpretation": "델타파 해석",
        "evidence": "근거 데이터",
        "clinicalSignificance": "임상적 의미"
      },
      "theta": {
        "interpretation": "세타파 해석",
        "evidence": "근거 데이터", 
        "clinicalSignificance": "임상적 의미"
      },
      "alpha": {
        "interpretation": "알파파 해석",
        "evidence": "근거 데이터",
        "clinicalSignificance": "임상적 의미"
      },
      "beta": {
        "interpretation": "베타파 해석",
        "evidence": "근거 데이터",
        "clinicalSignificance": "임상적 의미"
      },
      "gamma": {
        "interpretation": "감마파 해석",
        "evidence": "근거 데이터",
        "clinicalSignificance": "임상적 의미"
      }
    },
    "eegIndicesAnalysis": {
      "focus": {
        "interpretation": "집중력 상태 해석",
        "evidence": "구체적 근거 (지표값 및 계산 방식)",
        "recommendations": ["개선 방안1", "개선 방안2", "개선 방안3"]
      },
      "relaxation": {
        "interpretation": "이완 상태 해석",
        "evidence": "구체적 근거",
        "recommendations": ["개선 방안들"]
      },
      "stress": {
        "interpretation": "스트레스 상태 해석", 
        "evidence": "구체적 근거",
        "recommendations": ["개선 방안들"]
      },
      "hemisphericBalance": {
        "interpretation": "좌우뇌 균형 해석",
        "evidence": "구체적 근거",
        "recommendations": ["개선 방안들"]
      },
      "cognitiveLoad": {
        "interpretation": "인지 부하 해석",
        "evidence": "구체적 근거", 
        "recommendations": ["개선 방안들"]
      },
      "emotionalStability": {
        "interpretation": "정서 안정성 해석",
        "evidence": "구체적 근거",
        "recommendations": ["개선 방안들"]
      }
    },
    "cognitiveStateAnalysis": {
      "overallAssessment": "전반적인 인지 상태 평가",
      "attentionPatterns": "주의력 패턴 분석",
      "mentalFatigue": "정신적 피로도 분석", 
      "neurologicalIndicators": "신경학적 지표 해석"
    }
  }
}
```

## 분석 시 유의사항
1. 모든 해석은 32세 남성의 연령별/성별별 정상 범위를 기준으로 할 것
2. 소프트웨어 개발자 직업의 특성을 반영한 개인화된 해석 제공
3. 과학적 근거가 부족한 추측성 해석 지양
4. 의학적 진단이 아닌 건강 상태 평가임을 명시
5. 모든 수치는 제공된 실측값을 정확히 활용 
6. 임상적 의미와 일상생활 연관성을 함께 설명

특히 이 사례에서 주목할 점:
- Beta Power 342.7 μV²는 정상범위(90-280) 상한 초과 → 과도한 집중/각성 상태 
- Alpha Power 165.4 μV²는 정상범위(180-450) 하한 미달 → 이완 부족
- Stress Index 0.78은 정상범위(0.3-0.7) 초과 → 높은 스트레스 
- Hemispheric Balance 0.18은 좌뇌 편향 → 논리적 사고 과도 활용
- Relaxation Index 0.125는 정상범위(0.15-0.35) 미달 → 이완 능력 저하

이러한 패턴은 소프트웨어 개발자에게 흔한 "과집중-저이완" 패턴으로 보이며, 
뇌피로와 스트레스 누적이 주요 관심사입니다.
```

## 예상 응답 예시 (일부)

```json
{
  "analysisResults": [
    {
      "priority": 1,
      "coreOpinion": {
        "title": "과도한 Beta 활성과 Alpha 저하로 인한 뇌피로 증후군",
        "summary": "Beta Power가 정상범위를 22% 초과하고 Alpha Power가 8% 부족하여, 지속적인 고집중 상태로 인한 뇌피로가 진행되고 있습니다. 이는 소프트웨어 개발자에게 흔한 패턴이지만 현재 수준은 주의가 필요합니다.",
        "clinicalSignificance": "중등도 이상",
        "personalizedInterpretation": "32세 남성 소프트웨어 개발자로서 논리적 사고를 지속적으로 사용하는 직업 특성상 Beta파 과활성은 예상되나, 현재 수준(342.7 μV²)은 동년배 평균(235 μV²)보다 46% 높아 과로와 스트레스 누적을 시사합니다."
      },
      "dataEvidence": {
        "primaryMetrics": [
          {
            "metricName": "Beta Power",
            "observedValue": 342.7,
            "normalRange": "90-280 μV² (32세 남성)",
            "deviation": "현저히 높음",
            "interpretation": "과도한 집중 상태와 정신적 각성을 나타내며, 지속될 경우 뇌피로와 번아웃 위험 증가"
          },
          {
            "metricName": "Alpha Power", 
            "observedValue": 165.4,
            "normalRange": "180-450 μV² (32세 남성)",
            "deviation": "경미하게 낮음",
            "interpretation": "이완 능력 저하와 휴식 시에도 완전한 정신적 안정 상태 달성 어려움"
          }
        ],
        "supportingMetrics": [
          {
            "metricName": "Relaxation Index",
            "observedValue": 0.125,
            "interpretation": "정상 하한(0.15) 미달로 이완 반응 저하 확인"
          },
          {
            "metricName": "Cognitive Load",
            "observedValue": 2.41,
            "interpretation": "정상 상한 근접으로 인지적 부담 증가 상태"
          }
        ],
        "statisticalAnalysis": {
          "correlationAnalysis": "Beta 과활성과 Alpha 저하 간 강한 음의 상관관계(-0.78)로 각성-이완 균형 파괴 확인",
          "demographicComparison": "동일 연령대 소프트웨어 개발자 평균 대비 Beta 23% 높음, Alpha 12% 낮음으로 업계 평균보다도 심한 상태"
        }
      },
      "validityOpinion": {
        "scientificBasis": "Beta파 과활성은 전전두엽 피질의 과도한 활성화를 반영하며, 지속적인 인지적 부하와 관련. Alpha파 저하는 시상-피질 회로의 이완 반응 저하를 시사",
        "clinicalReferences": [
          {
            "referenceType": "연구논문",
            "summary": "Knowledge workers에서 Beta/Alpha 비율 증가가 mental fatigue와 강한 상관관계를 보임 (Ergonomics, 2020)",
            "relevance": "현재 Beta/Alpha 비율 2.07은 연구에서 제시한 피로 임계값 1.8을 초과"
          },
          {
            "referenceType": "임상사례",
            "summary": "IT 업계 종사자 대상 연구에서 유사한 EEG 패턴이 번아웃 증후군과 연관됨 (Occupational Medicine, 2019)",
            "relevance": "직업적 특성과 뇌파 패턴이 일치하며, 예방적 접근 필요성 시사"
          }
        ],
        "limitationsAndCaveats": "단일 시점 측정으로 일시적 상태일 가능성 있음. 수면 상태, 카페인 섭취, 측정 시간대 등이 결과에 영향을 줄 수 있어 추적 관찰 권장"
      }
    }
  ]
}
```

이 프롬프트는 의료급 수준의 정확하고 개인화된 EEG 분석을 위해 설계되었으며, 실제 측정 데이터를 기반으로 과학적 근거가 있는 해석을 제공합니다.