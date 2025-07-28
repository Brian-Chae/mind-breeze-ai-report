export const indexGuides: Record<string, string> = {
  // EEG Band Powers
  'Delta Power': `
    <strong>Delta Power (0.5-4 Hz)</strong><br/>
    Delta wave power in microvolts squared (μV²)<br/><br/>
    
    <strong>Description:</strong> Lowest frequency brain waves, dominant during deep sleep and unconscious states. In healthy awake adults, delta activity is minimal and excessive delta may indicate brain dysfunction.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 50-150 μV²: 깨어있는 성인의 정상 범위<br/>
    • Below 50 μV²: Low delta activity (normal in wakefulness)<br/>
    • Above 150 μV²: Excessive delta (possible brain dysfunction or drowsiness)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 50-150 μV²: 건강한 각성 상태의 뇌 활동<br/>
    • Below 50 μV²: 명료하고 각성된 상태<br/>
    • Above 150 μV²: 졸음 또는 신경학적 문제 가능성<br/>
    
    <strong>Reference:</strong> Electroencephalography Normal Waveforms, StatPearls
  `,
  'Theta Power': `
    <strong>Theta Power (4-7 Hz)</strong><br/>
    Theta wave power in microvolts squared (μV²)<br/><br/>
    
    <strong>Description:</strong> Associated with creativity, intuition, and light sleep. Normal in children but may indicate drowsiness or meditation states in adults.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 80-200 μV²: 성인의 정상 범위<br/>
    • Below 80 μV²: Low theta activity<br/>
    • Above 200 μV²: Elevated theta (creative state or drowsiness)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 80-200 μV²: 창의적이고 직관적인 사고 상태<br/>
    • Below 80 μV²: 명료하고 집중된 상태<br/>
    • Above 200 μV²: 졸음 또는 깊은 명상 상태<br/>
    
    <strong>Reference:</strong> EEG Frequency Bands Clinical Reference
  `,
  'Alpha Power': `
    <strong>Alpha Power (8-13 Hz)</strong><br/>
    Alpha wave power in microvolts squared (μV²)<br/><br/>
    
    <strong>Description:</strong> Dominant rhythm in relaxed wakefulness with eyes closed. Indicates calm, alert state and is associated with creativity and stress reduction.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 200-500 μV²: 건강한 성인의 정상 범위<br/>
    • Below 200 μV²: Low alpha activity (possible stress or overstimulation)<br/>
    • Above 500 μV²: High alpha activity (very relaxed state)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 200-500 μV²: 차분하고 이완된 각성 상태<br/>
    • Below 200 μV²: 정신적 긴장 또는 과자극 상태<br/>
    • Above 500 μV²: 깊은 이완 또는 명상 상태<br/>
    
    <strong>Reference:</strong> Clinical EEG Normal Patterns, NCBI
  `,
  'Beta Power': `
    <strong>Beta Power (13-30 Hz)</strong><br/>
    Beta wave power in microvolts squared (μV²)<br/><br/>
    
    <strong>Description:</strong> Associated with active thinking, problem-solving, and focused mental activity. Dominant during conscious, alert states.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 100-300 μV²: 활동적인 성인의 정상 범위<br/>
    • Below 100 μV²: Low mental activity or relaxed state<br/>
    • Above 300 μV²: High mental activity or possible anxiety<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 100-300 μV²: 활발한 사고와 문제 해결 상태<br/>
    • Below 100 μV²: 정신적 이완 또는 졸음 상태<br/>
    • Above 300 μV²: 높은 정신 활동 또는 불안 가능성<br/>
    
    <strong>Reference:</strong> EEG Clinical Assessment Guidelines
  `,
  'Gamma Power': `
    <strong>Gamma Power (30+ Hz)</strong><br/>
    Gamma wave power in microvolts squared (μV²)<br/><br/>
    
    <strong>Description:</strong> Highest frequency brain waves associated with consciousness, attention, and cognitive processing. Often related to "binding" of different brain regions.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 50-200 μV²: 인지 처리의 정상 범위<br/>
    • Below 50 μV²: Low gamma activity<br/>
    • Above 200 μV²: High gamma activity (intense cognitive processing)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 50-200 μV²: 의식적 인지와 주의력 상태<br/>
    • Below 50 μV²: 감소된 인지 처리 상태<br/>
    • Above 200 μV²: 강한 집중 또는 근육 간섭<br/>
    
    <strong>Reference:</strong> Gamma Oscillations in Cognitive Processing
  `,
  'Hemispheric Balance': `
    <strong>Hemispheric Balance</strong><br/>
    Left-right brain hemisphere activity balance (-1.0 to 1.0)<br/><br/>
    
    <strong>Description:</strong> Asymmetry index measuring the balance between left and right hemisphere EEG activity, often using alpha power ratios.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • -0.1 to 0.1: 균형잡힌 반구 활동<br/>
    • -0.3 to -0.1: 우반구 우세 (창의적, 공간적 처리)<br/>
    • 0.1 to 0.3: 좌반구 우세 (논리적, 언어적 처리)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • -0.1 to 0.1: 균형잡힌 좌우뇌 활동<br/>
    • Below -0.1: 우뇌 우세 (창의적, 공간적 사고)<br/>
    • Above 0.1: 좌뇌 우세 (논리적, 언어적 사고)<br/>
    
    <strong>Reference:</strong> Davidson, R.J. Hemispheric Asymmetry Research
  `,
  'Cognitive Load': `
    <strong>Cognitive Load</strong><br/>
    Mental workload and processing demand (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of mental effort and cognitive resources being used, typically calculated from theta/alpha power ratios.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.3-0.7: 정상적인 인지 부하<br/>
    • Below 0.3: Low mental engagement<br/>
    • Above 0.7: High cognitive load (possible mental overload)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.3-0.7: 최적의 정신적 부하<br/>
    • Below 0.3: 낮은 정신 활동<br/>
    • Above 0.7: 인지 과부하 또는 스트레스<br/><br/>
    
    <strong>Reference:</strong> Cognitive Load Theory, EEG Applications
  `,
  'Emotional Stability': `
    <strong>Emotional Stability</strong><br/>
    Emotional regulation and stability index (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of emotional regulation capacity and stability, derived from various EEG frequency band interactions.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.7-0.9: 우수한 감정 안정성<br/>
    • 0.5-0.7: 보통의 감정 조절<br/>
    • Below 0.5: Poor emotional stability (possible emotional distress)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.7-0.9: 안정적인 감정 상태<br/>
    • 0.5-0.7: 보통의 감정 조절력<br/>
    • Below 0.5: 감정 불안정 또는 스트레스<br/><br/>
    
    <strong>Reference:</strong> Emotional EEG Assessment Research
  `,
  'Signal Quality': `
    <strong>Signal Quality</strong><br/>
    EEG signal reliability and artifact-free ratio (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of EEG signal quality, indicating how much of the recorded signal is free from artifacts and noise.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.8-1.0: 우수한 신호 품질<br/>
    • 0.6-0.8: 양호한 신호 품질<br/>
    • Below 0.6: Poor signal quality (unreliable data)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.8-1.0: 우수한 신호 품질<br/>
    • 0.6-0.8: 양호한 신호 품질<br/>
    • Below 0.6: 신호 개선 필요<br/><br/>
    
    <strong>Reference:</strong> EEG Signal Quality Assessment Standards
  `,
  'Artifact Ratio': `
    <strong>Artifact Ratio</strong><br/>
    Proportion of EEG signal contaminated by artifacts (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Percentage of EEG recording affected by artifacts such as eye movements, muscle activity, or environmental interference.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.1: 최소한의 잡음 (우수한 기록)<br/>
    • 0.1-0.3: 보통의 잡음 (분석 가능한 수준)<br/>
    • Above 0.3: High artifact contamination (poor data quality)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.0-0.1: 매우 깨끗한 신호<br/>
    • 0.1-0.3: 분석 가능한 수준<br/>
    • Above 0.3: 전극 접촉 개선 필요<br/><br/>
    
    <strong>Reference:</strong> EEG Artifact Detection Guidelines
  `,

  // EEG Index
  'Focus': `
    <strong>Description:</strong> The focus index represents cognitive concentration level, calculated as the ratio of beta wave power to the sum of alpha and theta wave power. Higher values indicate deep concentration, while lower values suggest attention dispersion.<br/>
    <strong>Formula:</strong> Focus Index = Beta Power / (Alpha Power + Theta Power)<br/>
    <strong>Normal Range:</strong> 1.8 - 2.4<br/>
    <strong>Interpretation:</strong><br/>
    • 1.8 - 2.4: 최적의 인지 집중력<br/>
    • Below 1.8: 주의력 부족 또는 졸음<br/>
    • Above 2.4: 과도한 집중 또는 스트레스<br/>
    <strong>Reference:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance. Brain Research Reviews, 29(2-3), 169-195
  `,
  'Arousal': `
    <strong>Description:</strong> The arousal index measures mental arousal and relaxation state based on relative alpha wave activity. Higher values indicate a more relaxed state, while lower values indicate tension.<br/>
    <strong>Formula:</strong> Arousal Index = Alpha Power / (Alpha Power + Beta Power)<br/>
    <strong>Normal Range:</strong> 0.18 - 0.22 (normal tension state)<br/>
    <strong>Interpretation:</strong><br/>
    • 0.18 - 0.22: 균형잡힌 각성과 이완 상태<br/>
    • Below 0.18: 긴장과 스트레스 상태<br/>
    • Above 0.22: 과도한 이완<br/>
    <strong>Reference:</strong> Bazanova, O. M., & Vernon, D. (2014). Neuroscience & Biobehavioral Reviews, 44, 94-110
  `,
  'Stress Index': `
    <strong>Description:</strong> The stress index indicates mental stress and arousal state, increasing with elevated high-frequency (beta, gamma) activity. Higher values indicate higher stress levels.<br/>
    <strong>Formula:</strong> Stress Index = (Beta Power + Gamma Power) / (Alpha Power + Theta Power)<br/>
    <strong>Normal Range:</strong> 2.8 - 4.0 (normal range)<br/>
    <strong>Interpretation:</strong><br/>
    • 2.8-4.0: 균형잡힌 정신 상태<br/>
    • Below 2.8: 과도한 이완 또는 낮은 정신 활동<br/>
    • Above 4.0: 스트레스 또는 정신적 긴장 상승<br/>
    <strong>Reference:</strong> Ahn, J. W., et al. (2019). Sensors, 19(21), 4644
  `,
  'L-R Balance': `
    <strong>Description:</strong> Left-right brain balance represents the balance of alpha wave activity between left and right hemispheres, reflecting emotional and cognitive biases.<br/>
    <strong>Formula:</strong> (Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)<br/>
    <strong>Normal Range:</strong> -0.1 ~ 0.1 (balanced state)<br/>
    <strong>Interpretation:</strong> Below -0.1: 창의적 사고 (우뇌 우세); Above 0.1: 논리적 사고 (좌뇌 우세)<br/>
    <strong>Reference:</strong> Davidson, R. J. (2004). Biological Psychology, 67(1-2), 219-234
  `,
  'Cognitive Load': `
    <strong>Description:</strong> Cognitive load reflects mental workload and effort based on theta/alpha ratio.<br/>
    <strong>Formula:</strong> Cognitive Load = Theta Power / Alpha Power<br/>
    <strong>Normal Range:</strong> 0.3 - 0.8 (optimal load)<br/>
    <strong>Interpretation:</strong> Below 0.3: 낮은 참여도; Above 0.8: 높은 인지 부하; Above 1.2: 과부하<br/>
    <strong>Reference:</strong> Gevins, A., & Smith, M. E. (2003). Theoretical Issues in Ergonomics Science, 4(1-2), 113-131
  `,
  'Valence': `
    <strong>Description:</strong> Valence measures emotional regulation ability and emotional stability based on the ratio of low frequency and gamma wave power. Values within appropriate range indicate stable emotional state.<br/>
    <strong>Formula:</strong> Valence = (Alpha Power + Theta Power) / Gamma Power<br/>
    <strong>Normal Range:</strong> 0.4 - 0.8 (normal range)<br/>
    <strong>Interpretation:</strong> Below 0.4: 감정 불안정, 과도한 각성; Above 0.8: 감정 둔화, 과도한 억제<br/>
    <strong>Reference:</strong> Knyazev, G. G. (2007). Neuroscience & Biobehavioral Reviews, 31(3), 377-395
  `,
  'EEG Total Power': `
    <strong>Neural Activity</strong><br/>
    <strong>Description:</strong> Sum of all EEG band powers, indicating overall central nervous system activity level.<br/>
    <strong>Formula:</strong> Sum of Delta + Theta + Alpha + Beta + Gamma band powers<br/>
    <strong>Normal Range:</strong> 850-1150 μV²<br/>
    <strong>Interpretation:</strong><br/>
    • 850-1150: 균형잡힌 전반적 뇌 활동<br/>
    • Above 1150: 과도한 중추신경 활성도 (과각성, 스트레스, 높은 인지 부하)<br/>
    • Below 850: 억제된 중추신경 활성도 (저각성, 졸음, 낮은 인지 참여)<br/>
    <strong>Reference:</strong> Klimesch, W. (1999). EEG alpha and theta oscillations reflect cognitive and memory performance
  `,

  // PPG Index
  'Heart Rate (BPM)': `
    <strong>BPM (Beats Per Minute)</strong><br/>
    Heart rate - Number of heartbeats per minute<br/><br/>
    
    <strong>Measurement Method:</strong> Calculated by analyzing peak intervals in PPG signal<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 60-100 BPM: 정상 범위<br/>
    • Below 60 BPM: Bradycardia (low heart rate)<br/>
    • Above 100 BPM: Tachycardia (high heart rate)<br/><br/>
    
    <strong>Interpretation:</strong> 기본적인 심혈관 건강 지표, 운동, 스트레스, 약물 등의 영향을 받음<br/><br/>
    
    <strong>Reference:</strong> American Heart Association Guidelines
  `,
  'BPM': `
    <strong>BPM (Beats Per Minute)</strong><br/>
    Heart rate - Number of heartbeats per minute<br/><br/>
    
    <strong>Measurement Method:</strong> Calculated by analyzing peak intervals in PPG signal<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 60-100 BPM: 정상 범위<br/>
    • Below 60 BPM: Bradycardia (low heart rate)<br/>
    • Above 100 BPM: Tachycardia (high heart rate)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 60-100 BPM: 건강한 안정시 심박수<br/>
    • Below 60 BPM: 운동선수 수준 또는 서맥 가능성<br/>
    • Above 100 BPM: 스트레스나 활동으로 인한 심박수 상승<br/>
    
    <strong>Reference:</strong> American Heart Association Guidelines
  `,
  'HRV (ms)': `
    <strong>HRV (Heart Rate Variability)</strong><br/>
    Overall heart rate variability in milliseconds (RMSSD)<br/><br/>
    
    <strong>Description:</strong> RMSSD (Root Mean Square of Successive Differences) measure of heart rhythm variation, indicating autonomic nervous system balance and cardiovascular health. Higher values indicate better cardiovascular fitness and stress resilience.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 20-200 ms: Wide normal range varies by age and fitness<br/>
    • 50-100 ms: Young adults<br/>
    • 35-60 ms: Middle-aged adults<br/>
    • 30-50 ms: Older adults<br/>
    • 70-200+ ms: Athletes<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 50-100 ms: 정상적인 심박 변이도 (젊은 성인)<br/>
    • Below 20 ms: 매우 낮은 변이도 (심각한 스트레스 또는 건강 문제)<br/>
    • 20-50 ms: 낮은 변이도 (피로, 스트레스 또는 노화)<br/>
    • Above 100 ms: 우수한 심혈관 건강 및 회복력<br/>
    • Above 150 ms: 매우 우수한 심혈관 건강 (운동선수 수준)<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Standards, European Society of Cardiology
  `,
  'SpO2': `
    <strong>SpO2 (Oxygen Saturation)</strong><br/>
    Oxygen saturation - Oxygen concentration in blood<br/><br/>
    
    <strong>Measurement Method:</strong> Calculated based on Beer-Lambert law using Red/IR light absorption ratio<br/>
    • R = (Red_AC/Red_DC) / (IR_AC/IR_DC)<br/>
    • Multi-stage correction formula for SpO2 estimation<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 98-100%: 정상 산소 포화도<br/>
    • 95-98%: 정상 범위 (하한선)<br/>
    • 90-95%: 경미한 저산소증<br/>
    • Below 90%: Severe hypoxemia (medical consultation needed)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 95-100%: 정상적인 산소 포화도<br/>
    • 90-95%: 경미한 저산소증<br/>
    • Below 90%: 심각한 저산소증 (의료 상담 필요)<br/><br/>
    
    <strong>Reference:</strong> Pulse Oximetry Principles, IEEE TBME
  `,
  'Stress': `
    <strong>Stress Index</strong><br/>
    HRV-based normalized stress level (0.0-1.0)<br/><br/>
    
    <strong>Formula:</strong> Weighted average of normalized SDNN, RMSSD, and heart rate<br/>
    • Stress = (Normalized SDNN × 0.4) + (Normalized RMSSD × 0.4) + (Heart Rate Stress × 0.2)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.30-0.70: 정상 범위 (균형 상태)<br/>
    • 0.00-0.30: 매우 낮은 스트레스 (과도한 이완)<br/>
    • 0.70-0.90: 높은 스트레스 (긴장 상태)<br/>
    • 0.90-1.00: 매우 높은 스트레스 (심한 긴장)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.30-0.70: 균형잡힌 상태<br/>
    • 0.00-0.30: 매우 이완된 상태<br/>
    • 0.70-1.00: 높은 스트레스 상태<br/><br/>
    
    <strong>Reference:</strong> HRV Analysis Methods, Frontiers in Physiology
  `,
  'SDNN': `
    <strong>SDNN (Standard Deviation of NN intervals)</strong><br/>
    Standard deviation of NN intervals - Overall HRV level<br/><br/>
    
    <strong>Formula:</strong> SDNN = √(Σ(RRᵢ - RR̄)² / (N-1))<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 50-100 ms: Young adults<br/>
    • 35-60 ms: Middle-aged adults<br/>
    • 30-50 ms: Older adults<br/>
    • Above 100 ms: Athletes or excellent cardiovascular health<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 50-100 ms: 정상적인 심박 변이도 (젊은 성인)<br/>
    • Below 30 ms: 매우 낮은 변이도 (심각한 회복력 저하)<br/>
    • 30-50 ms: 낮은 변이도 (피로 또는 노화)<br/>
    • Above 100 ms: 우수한 심혈관 건강<br/>
    • Above 150 ms: 매우 우수한 심혈관 건강 (운동선수 수준)<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996
  `,
  'RMSSD': `
    <strong>RMSSD (Root Mean Square of Successive Differences)</strong><br/>
    Root mean square of successive RR interval differences - Primary HRV measure<br/><br/>
    
    <strong>Formula:</strong> RMSSD = √(Σ(RRᵢ₊₁ - RRᵢ)² / (N-1))<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 20-200 ms: Wide normal range varies by age and fitness<br/>
    • 50-100 ms: Young adults<br/>
    • 35-60 ms: Middle-aged adults<br/>
    • 30-50 ms: Older adults<br/>
    • 70-200+ ms: Athletes<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 50-100 ms: 정상적인 심박 변이도 (젊은 성인)<br/>
    • Below 20 ms: 매우 낮은 변이도 (심각한 스트레스 또는 건강 문제)<br/>
    • 20-50 ms: 낮은 변이도 (피로, 스트레스 또는 노화)<br/>
    • Above 100 ms: 우수한 심혈관 건강 및 회복력<br/>
    • Above 150 ms: 매우 우수한 심혈관 건강 (운동선수 수준)<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996
  `,
  'PNN50': `
    <strong>PNN50 (Percentage of NN50)</strong><br/>
    Percentage of successive NN intervals differing by more than 50ms<br/><br/>
    
    <strong>Formula:</strong> PNN50 = (NN50 count / Total NN intervals) × 100%<br/>
    NN50 = Number of intervals where |RRᵢ₊₁ - RRᵢ| > 50ms<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 10-50%: 정상 범위 (건강한 심박수 변이도)<br/>
    • Below 10%: 낮은 심박수 변이도 (긴장 또는 피로 상태)<br/>
    • 20-50%: 우수한 심박수 변이도 (탁월한 회복력)<br/>
    • Above 50%: 매우 높은 심박수 변이도 (엘리트 운동선수 수준)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 10-50%: 정상적이고 건강한 부교감신경 활동<br/>
    • Below 10%: 부교감신경 활동 저하<br/>
    • Above 30%: 우수한 회복력<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996
  `,
  'LF': `
    <strong>LF (Low Frequency Power)</strong><br/>
    Low frequency band power (0.04-0.15 Hz) - Sympathetic nervous activity indicator<br/><br/>
    
    <strong>Measurement Method:</strong> Power spectral density calculation via Welch Periodogram of RR intervals<br/>
    <strong>Unit:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 200-1,200 ms²: 적절한 교감신경 활동 (연구 평균: 519±291 ms²)<br/>
    • Below 200 ms²: Low sympathetic nervous activity (excessive rest)<br/>
    • Above 1,200 ms²: High sympathetic nervous activity (stress or tension)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 200-1,200 ms²: 정상적인 교감신경 활동<br/>
    • Below 200 ms²: 과도한 휴식 상태<br/>
    • Above 1,200 ms²: 스트레스 또는 긴장<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'HF': `
    <strong>HF (High Frequency Power)</strong><br/>
    High frequency band power (0.15-0.4 Hz) - Parasympathetic nervous activity indicator<br/><br/>
    
    <strong>Measurement Method:</strong> Power spectral density calculation via Welch Periodogram of RR intervals<br/>
    <strong>Unit:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 80-4,000 ms²: 적절한 부교감신경 활동 (연구 평균: 657±777 ms²)<br/>
    • Below 80 ms²: Low parasympathetic nervous activity (stress or fatigue)<br/>
    • Above 4,000 ms²: High parasympathetic nervous activity (deep rest)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 80-4,000 ms²: 정상적인 부교감신경 활동<br/>
    • Below 80 ms²: 스트레스 또는 피로<br/>
    • Above 4,000 ms²: 깊은 휴식 상태<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'LF/HF': `
    <strong>LF/HF Ratio</strong><br/>
    Low frequency/High frequency power ratio - Autonomic nervous balance<br/><br/>
    
    <strong>Formula:</strong> LF/HF = LF Power / HF Power<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 1.0-10.0: 정상 범위 (연구 평균: 2.8±2.6, 권장 균형: 1.5-2.5)<br/>
    • Below 1.0: Parasympathetic dominance (very comfortable state)<br/>
    • 1.5-2.5: 이상적인 균형 상태<br/>
    • 2.5-10.0: 교감신경 우세 (활발/긴장 상태)<br/>
    • Above 10.0: Severe stress<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 1.5-2.5: 이상적인 균형 상태<br/>
    • Below 1.5: 부교감신경 우세 (휴식 상태)<br/>
    • Above 2.5: 교감신경 우세 (스트레스/활동 상태)<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'VLF Power': `
    <strong>VLF (Very Low Frequency Power)</strong><br/>
    Very low frequency band power (0.003-0.04 Hz) - Long-term regulatory mechanisms<br/><br/>
    
    <strong>Description:</strong> Reflects long-term regulatory mechanisms including thermoregulation, renin-angiotensin system, and other slow-acting control systems.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 100-300 ms²: Normal VLF power range<br/>
    • Below 100 ms²: Low long-term regulation<br/>
    • Above 300 ms²: High long-term regulatory activity<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 100-300 ms²: 정상적인 장기 조절 기능<br/>
    • Below 100 ms²: 낮은 장기 조절력<br/>
    • Above 300 ms²: 높은 조절 활동<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Analysis Guidelines
  `,
  'LF Power': `
    <strong>LF (Low Frequency Power)</strong><br/>
    Low frequency band power (0.04-0.15 Hz) - Sympathetic nervous activity indicator<br/><br/>
    
    <strong>Measurement Method:</strong> Power spectral density calculation via Welch Periodogram of RR intervals<br/>
    <strong>Unit:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 200-1,200 ms²: 적절한 교감신경 활동 (연구 평균: 519±291 ms²)<br/>
    • Below 200 ms²: Low sympathetic nervous activity (excessive rest)<br/>
    • Above 1,200 ms²: High sympathetic nervous activity (stress or tension)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 200-1,200 ms²: 균형잡힌 교감신경 활동<br/>
    • Below 200 ms²: 과도한 이완 또는 비활동 상태<br/>
    • Above 1,200 ms²: 스트레스 또는 신체적 긴장 상승<br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'HF Power': `
    <strong>HF (High Frequency Power)</strong><br/>
    High frequency band power (0.15-0.4 Hz) - Parasympathetic nervous activity indicator<br/><br/>
    
    <strong>Measurement Method:</strong> Power spectral density calculation via Welch Periodogram of RR intervals<br/>
    <strong>Unit:</strong> ms² (milliseconds squared)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 80-4,000 ms²: 적절한 부교감신경 활동 (연구 평균: 657±777 ms²)<br/>
    • Below 80 ms²: Low parasympathetic nervous activity (stress or fatigue)<br/>
    • Above 4,000 ms²: High parasympathetic nervous activity (deep rest)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 80-4,000 ms²: 정상적인 부교감신경 활동<br/>
    • Below 80 ms²: 스트레스 또는 피로<br/>
    • Above 4,000 ms²: 깊은 휴식 상태<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017
  `,
  'LF Norm': `
    <strong>LF Norm (Normalized Low Frequency Power)</strong><br/>
    Low frequency power normalized to total power (LF/(LF+HF) × 100)<br/><br/>
    
    <strong>Formula:</strong> LF Norm = (LF / (LF + HF)) × 100<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 40-70%: 정상적인 교감신경 균형<br/>
    • Below 40%: Low sympathetic activity (parasympathetic dominance)<br/>
    • Above 70%: High sympathetic activity (stress or activity state)<br/><br/>
    
    <strong>Interpretation:</strong> 자율신경계 균형에 대한 교감신경계의 상대적 기여도를 나타냄<br/><br/>
    
    <strong>Reference:</strong> HRV Analysis Standards
  `,
  'HF Norm': `
    <strong>HF Norm (Normalized High Frequency Power)</strong><br/>
    High frequency power normalized to total power (HF/(LF+HF) × 100)<br/><br/>
    
    <strong>Formula:</strong> HF Norm = (HF / (LF + HF)) × 100<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 30-60%: 정상적인 부교감신경 균형<br/>
    • Below 30%: Low parasympathetic activity (sympathetic dominance)<br/>
    • Above 60%: High parasympathetic activity (rest state)<br/><br/>
    
    <strong>Interpretation:</strong> 자율신경계 균형에 대한 부교감신경계의 상대적 기여도를 나타냄<br/><br/>
    
    <strong>Reference:</strong> HRV Analysis Standards
  `,
  'HRV Total Power': `
    <strong>Total Power (HRV)</strong><br/>
    Total spectral power of HRV across all frequency bands<br/><br/>
    
    <strong>Formula:</strong> Total Power = VLF + LF + HF Power<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 1,000-5,000 ms²: 정상적인 총 HRV 파워<br/>
    • Below 1,000 ms²: Low overall HRV (poor autonomic function)<br/>
    • Above 5,000 ms²: High overall HRV (excellent autonomic function)<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 일반적으로 더 나은 전반적인 자율신경계 기능을 나타냄<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Guidelines
  `,
  'Stress Level': `
    <strong>Stress Level</strong><br/>
    HRV-based normalized stress level (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Composite stress indicator derived from HRV parameters, where lower values indicate better stress management.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.5: 정상 스트레스 (이완~균형 상태)<br/>
    • 0.0-0.2: 매우 낮은 스트레스 (최적 이완 상태)<br/>
    • 0.2-0.5: 균형잡힌 스트레스 (정상 상태)<br/>
    • 0.5-0.7: 보통 스트레스 (경미한 긴장)<br/>
    • Above 0.7: 높은 스트레스 (주의 필요)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.0-0.5: 정상적인 스트레스 관리 상태<br/>
    • Below 0.2: 깊이 이완되고 차분한 상태<br/>
    • Above 0.5: 주의가 필요한 스트레스 또는 불안 상태<br/>
    
    <strong>Reference:</strong> HRV Analysis Methods, Task Force Guidelines
  `,
  'Recovery Index': `
    <strong>Recovery Index</strong><br/>
    HRV 기반 회복 능력 지표 (0-100 scale)<br/><br/>
    
    <strong>Description:</strong> HRV 메트릭, 스트레스 레벨, 자율신경계 균형 매개변수에서 파생된 심혈관 회복 능력.<br/><br/>
    
    <strong>Formula:</strong> HRV 메트릭과 역 스트레스 상관관계 기반<br/>
    • Recovery = f(HRV, 1-StressLevel, AutonomicBalance) × 100<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 70-100: 우수한 회복 능력<br/>
    • 50-70: 양호한 회복 능력<br/>
    • 30-50: 보통의 회복 능력<br/>
    • Below 30: 낮은 회복 능력<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 70-100: 우수한 회복 능력<br/>
    • 50-70: 양호한 회복 능력<br/>
    • Below 50: 회복 능력 저하<br/><br/>
    
    <strong>Reference:</strong> HRV Recovery Assessment Guidelines
  `,
  'Autonomic Balance': `
    <strong>Autonomic Balance</strong><br/>
    Balance between sympathetic and parasympathetic nervous systems (0.0-1.0)<br/><br/>
    
    <strong>Description:</strong> Normalized measure of autonomic nervous system balance derived from HRV frequency domain analysis.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.4-0.8: 균형잡힌 자율신경 기능<br/>
    • Below 0.4: Sympathetic dominance (stress state)<br/>
    • Above 0.8: Parasympathetic dominance (rest state)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.4-0.8: 균형잡힌 자율신경 기능<br/>
    • Below 0.4: 교감신경 우세 (스트레스 상태)<br/>
    • Above 0.8: 부교감신경 우세 (휴식 상태)<br/><br/>
    
    <strong>Reference:</strong> Autonomic Function Assessment Standards
  `,
  'Cardiac Coherence': `
    <strong>Cardiac Coherence</strong><br/>
    Heart rhythm coherence and synchronization (0-100 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of heart rhythm pattern coherence, indicating physiological and emotional balance.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 60-100: 높은 일관성 (균형 상태)<br/>
    • 40-60: 보통 일관성<br/>
    • 20-40: 낮은 일관성<br/>
    • Below 20: Very low coherence (stress or dysfunction)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 60-100: 높은 일관성 (균형 상태)<br/>
    • 40-60: 보통 일관성<br/>
    • Below 40: 낮은 일관성 (스트레스)<br/><br/>
    
    <strong>Reference:</strong> Heart Coherence Analysis Methods
  `,
  'Respiratory Rate': `
    <strong>Respiratory Rate</strong><br/>
    Breathing rate derived from HRV analysis (breaths per minute)<br/><br/>
    
    <strong>Description:</strong> Respiratory rate estimated from HRV patterns, particularly HF power oscillations.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 12-18 breaths/min: 정상 호흡률<br/>
    • Below 12: Bradypnea (slow breathing)<br/>
    • Above 18: Tachypnea (fast breathing)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 12-18 breaths/min: 정상적인 호흡<br/>
    • Below 12: 느린 호흡 (서호흡)<br/>
    • Above 18: 빠른 호흡 (빈호흡)<br/><br/>
    
    <strong>Reference:</strong> Respiratory Physiology Guidelines
  `,
  'Perfusion Index': `
    <strong>Perfusion Index</strong><br/>
    Peripheral perfusion strength indicator (%)<br/><br/>
    
    <strong>Description:</strong> Ratio of pulsatile to non-pulsatile light absorption, indicating peripheral circulation strength.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 2.0-10.0%: 정상 말초 관류<br/>
    • Below 2.0%: Poor peripheral circulation<br/>
    • Above 10.0%: Excellent peripheral circulation<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 더 나은 말초 혈류 및 순환을 나타냄<br/><br/>
    
    <strong>Reference:</strong> Perfusion Index Clinical Guidelines
  `,
  'Vascular Tone': `
    <strong>Vascular Tone</strong><br/>
    Arterial stiffness and vascular health indicator (0-100 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of arterial elasticity and vascular health derived from PPG pulse wave analysis.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 70-90: 좋은 혈관 긴장도<br/>
    • 50-70: 보통의 혈관 긴장도<br/>
    • 30-50: 나쁜 혈관 긴장도<br/>
    • Below 30: Very poor vascular health<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 더 건강하고 탄력적인 혈관을 나타냄<br/><br/>
    
    <strong>Reference:</strong> Vascular Health Assessment Guidelines
  `,
  'SDSD': `
    <strong>SDSD (Standard Deviation of Successive Differences)</strong><br/>
    연속된 RR 간격 차이의 표준편차<br/><br/>
    
    <strong>Formula:</strong> SDSD = √(Σ((RRᵢ₊₁ - RRᵢ) - mean_diff)² / (N-1))<br/>
    Where mean_diff is the average of successive differences<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 20-150 ms: 정상 심박수 변이도 (건강한 자율신경계)<br/>
    • Below 20 ms: 낮은 심박수 변이도 (스트레스 또는 피로 상태)<br/>
    • 50-150 ms: 우수한 심박수 변이도 (탁월한 회복력)<br/>
    • Above 150 ms: 매우 높은 심박수 변이도 (엘리트 운동선수 수준)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 20-150 ms: 정상적이고 건강한 자율신경계 반응<br/>
    • Below 20 ms: 자율신경계 반응 저하<br/>
    • Above 100 ms: 우수한 자율신경계 유연성<br/>
    
    <strong>Meaning:</strong> RMSSD와 유사하지만 다른 계산 방법을 사용. 높은 값은 활발한 자율신경 반응과 우수한 스트레스 회복력을 나타냄.<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Analysis Methods
  `,
  'AVNN': `
    <strong>AVNN (Average NN Intervals)</strong><br/>
    Average heart cycle - Average of heartbeat intervals<br/><br/>
    
    <strong>Formula:</strong> AVNN = Σ(RRᵢ) / N<br/>
    Where RRᵢ is each NN interval, N is total number of intervals<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 600-1000 ms: 안정적인 심장 리듬<br/>
    • Below 600 ms: Fast heart rate (active or tense state)<br/>
    • Above 1000 ms: Slow heart rate (rest state or athlete type)<br/><br/>
    
    <strong>Interpretation:</strong> 평균 심장 주기 길이를 반영; 높은 값은 부교감신경 우세와 우수한 심혈관 건강을 시사<br/><br/>
    
    <strong>Meaning:</strong> AVNN decreases as heart rate increases, and increases as heart rate decreases. Important indicator of individual's basic heart state.<br/><br/>
    
    <strong>Reference:</strong> Task Force of ESC/NASPE, 1996
  `,
  'PNN20': `
    <strong>PNN20 (Percentage of NN20)</strong><br/>
    Indicator for detecting subtle changes in heart rhythm<br/><br/>
    
    <strong>Formula:</strong> PNN20 = (NN20 count / Total NN intervals) × 100%<br/>
    NN20 = Number of intervals where |RRᵢ₊₁ - RRᵢ| > 20ms<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 20-60%: 적절한 심박수 변이도<br/>
    • Below 20%: Consistent heart rhythm (tension or fatigue state)<br/>
    • Above 60%: Flexible heart rhythm (healthy state)<br/><br/>
    
    <strong>Meaning:</strong> More sensitive than PNN50, can detect small stress or recovery states. Higher values indicate healthy state with flexible autonomic nervous response.<br/><br/>
    
    <strong>Reference:</strong> HRV Analysis Methods, IEEE TBME
  `,
  'HR Max': `
    <strong>HR Max (Heart Rate Maximum)</strong><br/>
    Maximum heart rate measured in the last 2 minutes (120 samples)<br/><br/>
    
    <strong>Calculation Method:</strong> Extract maximum BPM from Moving Average Queue (120 samples)<br/>
    • Convert heart rate at each time point to BPM<br/>
    • Store only high-quality data in queue<br/>
    • Real-time tracking of maximum in queue<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 80-150 BPM: 정상 최대 심박수<br/>
    • Below 80 BPM: Low maximum heart rate<br/>
    • Above 150 BPM: High maximum heart rate<br/><br/>
    
    <strong>Interpretation:</strong> 최근 2분간 심박수 변동의 상한선. 스트레스 반응이나 활동 강도 평가에 유용<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Analysis Guidelines
  `,
  'HR Min': `
    <strong>HR Min (Heart Rate Minimum)</strong><br/>
    Minimum heart rate measured in the last 2 minutes (120 samples)<br/><br/>
    
    <strong>Calculation Method:</strong> Extract minimum BPM from Moving Average Queue (120 samples)<br/>
    • Convert heart rate at each time point to BPM<br/>
    • Store only high-quality data in queue<br/>
    • Real-time tracking of minimum in queue<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 50-80 BPM: 정상 최소 심박수<br/>
    • Below 50 BPM: Low minimum heart rate<br/>
    • Above 80 BPM: High minimum heart rate<br/><br/>
    
    <strong>Interpretation:</strong> 최근 2분간 심박수 변동의 하한선. 휴식 중 심혈관 효율성이나 회복 상태 평가에 유용<br/><br/>
    
    <strong>Reference:</strong> Heart Rate Variability Analysis Guidelines
  `,

  // Blood Pressure Metrics
  'Systolic BP': `
    <strong>Systolic BP (Systolic Blood Pressure)</strong><br/>
    Maximum arterial pressure during cardiac contraction<br/><br/>
    
    <strong>Description:</strong> Peak pressure in arteries during heartbeat, measured when the heart muscle contracts and pumps blood from the heart.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 90-120 mmHg: 정상 수축기 혈압<br/>
    • Below 90 mmHg: Hypotension (low blood pressure)<br/>
    • 120-139 mmHg: Prehypertension<br/>
    • Above 140 mmHg: Hypertension (high blood pressure)<br/><br/>
    
    <strong>Interpretation:</strong> 심혈관 건강과 심장 펌프 기능을 나타냄. 높은 값은 심혈관 위험 증가를 시사<br/><br/>
    
    <strong>Reference:</strong> American Heart Association Blood Pressure Guidelines
  `,
  'Diastolic BP': `
    <strong>Diastolic BP (Diastolic Blood Pressure)</strong><br/>
    Minimum arterial pressure during cardiac relaxation<br/><br/>
    
    <strong>Description:</strong> Pressure in arteries when the heart muscle relaxes between beats, indicating peripheral vascular resistance.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 60-80 mmHg: 정상 이완기 혈압<br/>
    • Below 60 mmHg: Hypotension (low blood pressure)<br/>
    • 80-89 mmHg: Prehypertension<br/>
    • Above 90 mmHg: Hypertension (high blood pressure)<br/><br/>
    
    <strong>Interpretation:</strong> 혈관 건강과 동맥 경직도를 반영. 높은 값은 말초 저항 증가를 나타냄<br/><br/>
    
    <strong>Reference:</strong> American Heart Association Blood Pressure Guidelines
  `,

  // Cardiac Efficiency Metrics
  'Cardiac Efficiency': `
    <strong>Cardiac Efficiency</strong><br/>
    Overall cardiac performance and efficiency index (percentage scale)<br/><br/>
    
    <strong>Description:</strong> Composite measure of heart's ability to pump blood effectively with minimal energy expenditure, calculated from HRV and cardiac output indicators.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 70-100%: 높은 심장 효율성 (최적 성능)<br/>
    • 50-70%: 보통의 심장 효율성<br/>
    • 30-50%: 낮은 심장 효율성<br/>
    • Below 30%: Very low cardiac efficiency (potential cardiac dysfunction)<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 더 나은 심혈관 체력과 심장 기능을 나타냄<br/><br/>
    
    <strong>Reference:</strong> Cardiac Performance Assessment Standards
  `,
  'Metabolic Rate': `
    <strong>Metabolic Rate</strong><br/>
    Estimated metabolic rate based on cardiac and respiratory indicators (kcal/day scale)<br/><br/>
    
    <strong>Description:</strong> Calculated metabolic rate derived from heart rate variability, respiratory patterns, and autonomic function indicators.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 1200-2000: 정상 대사율<br/>
    • Below 1200: Low metabolic activity (rest state)<br/>
    • 2000-3000: 상승된 대사율 (활동 상태)<br/>
    • Above 3000: High metabolic rate (stress or intense activity)<br/><br/>
    
    <strong>Interpretation:</strong> 전반적인 대사 활동과 에너지 소비를 반영. 활동 중 높은 값은 정상<br/><br/>
    
    <strong>Reference:</strong> Metabolic Assessment Guidelines
  `,

  // ACC Index
  'Activity Level': `
    <strong>Activity Level</strong><br/>
    Physical activity intensity level based on accelerometer data<br/><br/>
    
    <strong>Description:</strong> Quantified activity level derived from movement magnitude and acceleration patterns, indicating overall physical engagement.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 1.0-3.0: 정상 일상 활동 수준<br/>
    • Below 1.0: Sedentary state (minimal movement)<br/>
    • Above 3.0: Active state (exercise or vigorous activity)<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 신체 활동 증가를 나타냄; 매우 낮은 값은 장시간 앉아있는 행동을 시사할 수 있음<br/><br/>
    
    <strong>Reference:</strong> Physical Activity Assessment Guidelines
  `,
  'Movement Intensity': `
    <strong>Movement Intensity</strong><br/>
    Intensity of physical movement and acceleration patterns<br/><br/>
    
    <strong>Description:</strong> Measure of movement vigor and intensity based on acceleration magnitude variations and frequency analysis.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.1-0.5: 정상 움직임 강도<br/>
    • Below 0.1: Very low intensity (rest or sleep)<br/>
    • Above 0.5: High intensity (exercise or vigorous activity)<br/><br/>
    
    <strong>Interpretation:</strong> 신체 움직임의 활력을 나타냄; 활동 분류와 에너지 소비 추정에 유용<br/><br/>
    
    <strong>Reference:</strong> Accelerometry Movement Analysis Standards
  `,
  'Postural Stability': `
    <strong>Postural Stability</strong><br/>
    Body balance and postural control stability (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of postural control and balance maintenance capability derived from acceleration variance and movement patterns. Higher values indicate better balance and postural control.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.7-1.0: 우수한 자세 안정성<br/>
    • 0.5-0.7: 보통의 안정성 (허용 가능)<br/>
    • Below 0.5: 낮은 안정성 (균형 개선 필요)<br/><br/>
    
    <strong>Interpretation:</strong><br/>
    • 0.7-1.0: 우수한 균형 제어 및 자세 안정성<br/>
    • 0.5-0.7: 보통의 균형 능력<br/>
    • Below 0.5: 균형 훈련이 필요한 상태<br/><br/>
    
    <strong>Reference:</strong> Postural Control Assessment Guidelines
  `,
  'Movement Quality': `
    <strong>Movement Quality</strong><br/>
    Quality and coordination of movement patterns (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Assessment of movement smoothness, coordination, and quality based on acceleration pattern analysis and symmetry measures.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.7-0.9: 좋은 움직임 품질<br/>
    • 0.5-0.7: 보통의 움직임 품질<br/>
    • Below 0.5: Poor movement quality (coordination issues)<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 더 부드럽고 조화로운 움직임을 나타냄; 낮은 값은 움직임 장애를 시사할 수 있음<br/><br/>
    
    <strong>Reference:</strong> Movement Quality Assessment Research
  `,
  'Activity State': `
    <strong>Activity State</strong><br/>
    Physical activity level classified based on accelerometer data<br/><br/>
    
    <strong>Measurement Method:</strong> Calculate composite vector magnitude from 3-axis acceleration (X, Y, Z) and remove gravity component (1g)<br/>
    <strong>Formula:</strong> Movement magnitude = |√(x² + y² + z²) - 1g|<br/><br/>
    
    <strong>Classification Criteria:</strong><br/>
    • 0.0-0.1g: Stationary<br/>
    • 0.1-0.3g: Sitting (light movement)<br/>
    • 0.3-0.8g: Walking (moderate activity)<br/>
    • Above 0.8g: Running (vigorous activity)<br/><br/>
    
    <strong>Interpretation:</strong> 대사율, 칼로리 소비, 운동 평가에 사용하기 위한 실시간 신체 활동 강도 분류<br/><br/>
    
    <strong>Reference:</strong> Troiano, R. P., et al. (2008). Medicine & Science in Sports & Exercise, 40(1), 181-188
  `,
  'Stability': `
    <strong>Stability Index</strong><br/>
    Indicator of postural stability and balance maintenance ability<br/><br/>
    
    <strong>Measurement Method:</strong> Stability calculation using standard deviation of acceleration changes<br/>
    <strong>Formula:</strong> Stability = 100 - (Movement variability × Normalization factor)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 70-100%: 매우 안정적인 자세<br/>
    • 50-70%: 보통의 안정성 (일상 움직임)<br/>
    • 30-50%: 불안정한 자세 (주의 필요)<br/>
    • Below 30%: Very unstable (possible balance disorder)<br/><br/>
    
    <strong>Interpretation:</strong> 높은 값은 낮은 낙상 위험과 우수한 균형 능력을 가진 안정적인 자세를 나타냄<br/><br/>
    
    <strong>Reference:</strong> Mancini, M., & Horak, F. B. (2010). Journal of NeuroEngineering and Rehabilitation, 7(1), 17
  `,
  'Intensity': `
    <strong>Intensity Index</strong><br/>
    Overall intensity and energy expenditure level of movement<br/><br/>
    
    <strong>Measurement Method:</strong> Intensity calculation using average and maximum of acceleration magnitude<br/>
    <strong>Formula:</strong> Intensity = (Average movement magnitude / Maximum possible movement) × 100<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0-25%: 낮은 강도 활동 (휴식, 수면)<br/>
    • 25-50%: Low-moderate intensity activity (daily life)<br/>
    • 50-75%: Moderate-high intensity activity (exercise, work)<br/>
    • 75-100%: 높은 강도 활동 (격렬한 운동)<br/><br/>
    
    <strong>Interpretation:</strong> 운동 평가와 건강 관리에 사용하기 위한 신체 활동 강도 정량화<br/><br/>
    
    <strong>Reference:</strong> Freedson, P. S., et al. (1998). Medicine & Science in Sports & Exercise, 30(5), 777-781
  `,
  'Balance': `
    <strong>Balance Index</strong><br/>
    Movement balance between X, Y axes and left-right/front-back symmetry<br/><br/>
    
    <strong>Measurement Method:</strong> Calculate relative distribution and balance of X-axis and Y-axis acceleration<br/>
    <strong>Formula:</strong> Balance = 100 - |X-axis movement ratio - Y-axis movement ratio| × 200<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 80-100%: 매우 균형잡힌 움직임<br/>
    • 60-80%: 좋은 균형 (정상 범위)<br/>
    • 40-60%: 불균형한 움직임 (주의 필요)<br/>
    • Below 40%: Severe imbalance (possible rehabilitation needed)<br/><br/>
    
    <strong>Interpretation:</strong> 좌우 또는 앞뒤 움직임의 대칭성을 평가하여 보행 패턴이나 자세 이상 감지<br/><br/>
    
    <strong>Reference:</strong> Hausdorff, J. M. (2007). Journal of NeuroEngineering and Rehabilitation, 4(1), 14
  `,
  'Average Movement': `
    <strong>Average Movement</strong><br/>
    Average movement magnitude during measurement period (gravity corrected)<br/><br/>
    
    <strong>Measurement Method:</strong> Calculate by averaging movement magnitude of all samples<br/>
    <strong>Formula:</strong> Average movement = Σ|√(xᵢ² + yᵢ² + zᵢ²) - 1g| / N<br/>
    <strong>Unit:</strong> g (gravity acceleration unit, 1g = 9.8 m/s²)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.1g: 정적 상태 (수면, 휴식)<br/>
    • 0.1-0.3g: 가벼운 활동 (사무 작업, 독서)<br/>
    • 0.3-0.6g: 보통 활동 (걸음, 가사)<br/>
    • Above 0.6g: Active activity (exercise, work)<br/><br/>
    
    <strong>Interpretation:</strong> 일정 기간 동안의 전반적인 활동 수준을 나타냄, 일상 활동 평가와 건강 지표에 사용<br/><br/>
    
    <strong>Reference:</strong> Sasaki, J. E., et al. (2011). Medicine & Science in Sports & Exercise, 43(8), 1568-1574
  `,
  'Standard Deviation Movement': `
    <strong>Standard Deviation Movement</strong><br/>
    Indicator of movement magnitude variability and irregularity<br/><br/>
    
    <strong>Measurement Method:</strong> Calculate standard deviation of movement magnitudes<br/>
    <strong>Formula:</strong> Standard deviation = √(Σ(movementᵢ - average movement)² / (N-1))<br/>
    <strong>Unit:</strong> g (gravity acceleration unit)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.1g: 매우 일관된 움직임 (정적 상태)<br/>
    • 0.1-0.3g: 일관된 움직임 (규칙적인 활동)<br/>
    • 0.3-0.6g: 변화하는 움직임 (다양한 활동)<br/>
    • Above 0.6g: Very irregular movement (vigorous or unstable activity)<br/><br/>
    
    <strong>Interpretation:</strong> 낮음: 규칙적이고 예측 가능한 움직임; 높음: 불규칙하고 다양한 움직임 패턴<br/><br/>
    
    <strong>Reference:</strong> Bussmann, J. B., & van de Berg-Emons, R. J. (2013). Gait & Posture, 37(3), 340-347
  `,
  'Max Movement': `
    <strong>Max Movement</strong><br/>
    Maximum movement magnitude detected during measurement period<br/><br/>
    
    <strong>Measurement Method:</strong> Extract largest movement magnitude among all samples<br/>
    <strong>Formula:</strong> Maximum movement = max(|√(xᵢ² + yᵢ² + zᵢ²) - 1g|)<br/>
    <strong>Unit:</strong> g (gravity acceleration unit)<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.5g: 일상 움직임 (평범한 생활)<br/>
    • 0.5-1.0g: 활발한 움직임 (운동, 작업)<br/>
    • 1.0-2.0g: 격렬한 움직임 (달리기, 점프)<br/>
    • Above 2.0g: Very vigorous movement (impact, possible fall)<br/><br/>
    
    <strong>Interpretation:</strong> 충격, 낙상, 격렬한 활동을 모니터링하기 위한 최대 가속도 이벤트 감지<br/><br/>
    
    <strong>Reference:</strong> Karantonis, D. M., et al. (2006). IEEE Transactions on Information Technology in Biomedicine, 10(1), 156-167
  `,
  'Motion Artifact': `
    <strong>Motion Artifact</strong><br/>
    Motion artifact level in PPG signal measurement (0.0-1.0 scale)<br/><br/>
    
    <strong>Description:</strong> Measure of signal distortion caused by body movement during PPG measurement. Higher values indicate more signal corruption.<br/><br/>
    
    <strong>Normal Range:</strong><br/>
    • 0.0-0.2: 낮은 움직임 잡음 (좋은 신호 품질)<br/>
    • 0.2-0.4: 보통의 움직임 잡음 (허용 가능)<br/>
    • Above 0.4: High motion artifact (signal quality concerns)<br/><br/>
    
    <strong>Interpretation:</strong> 낮은 값은 움직임 간섭이 적은 더 나은 신호 품질을 나타냄<br/><br/>
    
    <strong>Reference:</strong> PPG Signal Quality Assessment Guidelines
  `
};

// 정상 범위 정보 추출 함수
export interface NormalRangeInfo {
  name: string;
  range: string;
  interpretations: {
    normal: string;
    below: string;
    above: string;
  };
}

export const getNormalRangeInfo = (metricName: string): NormalRangeInfo | null => {
  const guide = indexGuides[metricName];
  if (!guide) return null;

  // HTML 태그 제거하고 텍스트만 추출
  const textOnly = guide.replace(/<[^>]*>/g, '');
  
  // Normal Range 추출
  const rangeMatch = textOnly.match(/Normal Range:\s*([^\n]*)/);
  const range = rangeMatch ? rangeMatch[1].trim() : 'Not specified';

  // Interpretation 추출
  const interpretationMatch = textOnly.match(/Interpretation:\s*(.*?)(?=Reference:|$)/s);
  let interpretations = { normal: '', below: '', above: '' };
  
  if (interpretationMatch) {
    const interpText = interpretationMatch[1];
    
    // 새로운 형식의 bullet point 파싱
    const lines = interpText.split(/[•\n]/).filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // 숫자 범위와 콜론(:)으로 구분된 해석 찾기
      const rangeInterpretMatch = cleanLine.match(/^([\d.-]+(?:\s*-\s*[\d.-]+)?[^:]*?):\s*(.+)$/);
      
      if (rangeInterpretMatch) {
        const rangeText = rangeInterpretMatch[1].trim();
        const interpretation = rangeInterpretMatch[2].trim();
        
        if (rangeText.toLowerCase().includes('below')) {
          interpretations.below = interpretation;
        } else if (rangeText.toLowerCase().includes('above')) {
          interpretations.above = interpretation;
        } else if (rangeText.includes('-') || rangeText.includes('to')) {
          // 정상 범위를 나타내는 패턴
          interpretations.normal = interpretation;
        }
      } else if (cleanLine.toLowerCase().includes('below')) {
        interpretations.below = cleanLine.replace(/below[^:]*:/i, '').trim();
      } else if (cleanLine.toLowerCase().includes('above')) {
        interpretations.above = cleanLine.replace(/above[^:]*:/i, '').trim();
      }
    }
    
    // 단순한 해석의 경우 (한 줄로 된 경우)
    if (!interpretations.normal && !interpretations.below && !interpretations.above) {
      interpretations.normal = interpText.trim();
    }
  }

  return {
    name: metricName,
    range,
    interpretations
  };
};

// 값이 정상 범위에 있는지 확인하는 함수
export const getValueStatus = (value: number, metricName: string): 'normal' | 'below' | 'above' | 'unknown' => {
  const rangeInfo = getNormalRangeInfo(metricName);
  if (!rangeInfo) return 'unknown';

  const range = rangeInfo.range;
  
  // 다양한 범위 패턴 매칭
  let minValue: number | null = null;
  let maxValue: number | null = null;

  // 패턴 1: "• 200-1,200 ms²" 또는 "• -0.1 to 0.1" (bullet point with possibly negative numbers)
  const rangePattern1 = /•\s*(-?[\d,]+(?:\.\d+)?)\s*(?:-|to)\s*(-?[\d,]+(?:\.\d+)?)(?:\s*[^\d:]+)?:/;
  const match1 = range.match(rangePattern1);
  if (match1) {
    minValue = parseFloat(match1[1].replace(/,/g, ''));
    maxValue = parseFloat(match1[2].replace(/,/g, ''));
  }

  // 패턴 2: "60-100 BPM", "1.8 - 2.4", 또는 "-0.1 to 0.1" (basic range without bullet, supporting negative numbers)
  if (minValue === null || maxValue === null) {
    const rangePattern2 = /(-?[\d,]+(?:\.\d+)?)\s*(?:-|to)\s*(-?[\d,]+(?:\.\d+)?)/;
    const match2 = range.match(rangePattern2);
    if (match2) {
      minValue = parseFloat(match2[1].replace(/,/g, ''));
      maxValue = parseFloat(match2[2].replace(/,/g, ''));
    }
  }

  if (minValue !== null && maxValue !== null) {
    if (value < minValue) return 'below';
    if (value > maxValue) return 'above';
    return 'normal';
  }

  return 'unknown';
};

// 임상적 해석 메시지 가져오기
export const getClinicalInterpretation = (value: number, metricName: string): string => {
  const status = getValueStatus(value, metricName);
  const rangeInfo = getNormalRangeInfo(metricName);
  
  if (!rangeInfo || status === 'unknown') return '';
  
  switch (status) {
    case 'normal':
      return rangeInfo.interpretations.normal || '정상 범위';
    case 'below':
      return rangeInfo.interpretations.below || '정상 범위 미달';
    case 'above':
      return rangeInfo.interpretations.above || '정상 범위 초과';
    default:
      return '';
  }
};