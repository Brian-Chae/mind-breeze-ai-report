/**
 * 통합 고급 분석 결과 JSON 렌더러
 * EEG와 PPG 통합 분석 결과를 JSON 뷰어로 표현
 */

import React from 'react';
import { JsonViewer } from '../components/JsonViewer';
import { IReportRenderer } from '../core/interfaces/IReportRenderer';
import { IntegratedAnalysisResult } from '../ai-engines/IntegratedAdvancedGeminiEngine';

export class IntegratedAdvancedJsonRenderer implements IReportRenderer {
  id = 'integrated-advanced-json-renderer';
  name = '통합 고급 분석 JSON 렌더러';
  supportedEngines = ['integrated-advanced-gemini-v1'];
  
  canRender(engineId: string): boolean {
    return this.supportedEngines.includes(engineId);
  }
  
  render(result: IntegratedAnalysisResult): React.ReactElement {
    return <IntegratedJsonReport result={result} />;
  }
}

interface IntegratedJsonReportProps {
  result: IntegratedAnalysisResult;
}

const IntegratedJsonReport: React.FC<IntegratedJsonReportProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      <JsonViewer 
        data={result} 
        title="통합 Gemini 분석 결과 - JSON 원본"
        className="shadow-lg"
      />
    </div>
  );
};

export default IntegratedAdvancedJsonRenderer;