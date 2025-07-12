/**
 * PDF 리포트 생성 서비스 - 단일 페이지 버전
 * - ReportDetailViewer의 디자인을 그대로 활용
 * - 긴 한 페이지 PDF 생성
 * - 페이지 구분 없이 연속적인 레이아웃
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { marked } from 'marked';
import { StoredReport } from './ReportStorage';
import { AIAnalysisResult, PersonalInfo, MeasurementData } from '../types/index';

export interface PDFReportOptions {
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  includeDetailedAnalysis?: boolean;
  includePersonalInfo?: boolean;
  watermark?: string;
  language?: 'ko' | 'en';
}

export class PDFReportService {
  private static instance: PDFReportService;
  
  public static getInstance(): PDFReportService {
    if (!PDFReportService.instance) {
      PDFReportService.instance = new PDFReportService();
    }
    return PDFReportService.instance;
  }

  /**
   * 마크다운을 HTML로 변환 (간단한 버전)
   */
  private markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    // 기본 마크다운 처리
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)$/gm, '<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 8px 0; color: #374151;">$1</h3>')
      .replace(/## (.*?)$/gm, '<h2 style="font-size: 16px; font-weight: bold; margin: 16px 0 12px 0; color: #1f2937;">$1</h2>')
      .replace(/# (.*?)$/gm, '<h1 style="font-size: 18px; font-weight: bold; margin: 20px 0 16px 0; color: #111827;">$1</h1>')
      .replace(/\n\n/g, '</p><p style="margin: 8px 0; line-height: 1.5; color: #374151;">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p style="margin: 8px 0; line-height: 1.5; color: #374151;">')
      .replace(/$/, '</p>');
  }

  /**
   * 저장된 리포트로부터 PDF 생성 (메인 메서드)
   */
  public async generatePDFFromStoredReport(
    report: StoredReport,
    options: PDFReportOptions = {}
  ): Promise<Blob> {
    try {
      console.log('PDF 생성 시작:', report.personalInfo.name);
      
      // HTML 컨테이너 생성
      const htmlContent = this.createReportHTML(report, options);
      
      // 임시 컨테이너 생성
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px'; // 고정 너비
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.5';
      tempContainer.style.color = '#111827';
      tempContainer.style.padding = '40px';
      tempContainer.style.minHeight = 'auto';
      tempContainer.style.overflow = 'visible';
      
      document.body.appendChild(tempContainer);
      
      // DOM이 완전히 렌더링될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // 실제 콘텐츠 높이 계산 (여백 포함)
        const actualHeight = Math.max(
          tempContainer.scrollHeight,
          tempContainer.offsetHeight,
          tempContainer.clientHeight
        ) + 100; // 추가 여백
        
        console.log('PDF 생성 - 컨테이너 크기:', {
          scrollHeight: tempContainer.scrollHeight,
          offsetHeight: tempContainer.offsetHeight,
          clientHeight: tempContainer.clientHeight,
          actualHeight: actualHeight
        });
        
        // HTML을 이미지로 변환 (최적화된 설정)
        const canvas = await html2canvas(tempContainer, {
          scale: 2, // 고해상도
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: actualHeight, // 계산된 실제 높이 사용
          scrollX: 0,
          scrollY: 0,
          removeContainer: false,
          logging: true, // 디버깅을 위해 로깅 활성화
          imageTimeout: 15000, // 이미지 로딩 타임아웃 증가
          onclone: (clonedDoc) => {
            // 클론된 문서에서 스타일 최적화
            const clonedContainer = clonedDoc.body.firstChild as HTMLElement;
            if (clonedContainer) {
              // 이미지 품질 최적화
              const images = clonedContainer.querySelectorAll('img');
              images.forEach(img => {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
              });
              
              // 콘텐츠가 잘리지 않도록 높이 보장
              clonedContainer.style.minHeight = actualHeight + 'px';
              clonedContainer.style.overflow = 'visible';
            }
          }
        });
        
        // PDF 생성 - 긴 한 페이지로 설정
        const imgData = canvas.toDataURL('image/png', 1.0); // PNG 고품질
        
        // 이미지 크기에 맞춰 PDF 크기 계산
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // 비율에 맞춘 높이
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight], // 커스텀 크기로 긴 페이지 생성
          compress: true
        });
        
        // 전체 이미지를 한 페이지에 추가
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        console.log('PDF 생성 완료 - 단일 페이지, 크기:', pdfWidth, 'x', pdfHeight, 'mm');
        
        // Blob 반환
        return new Blob([pdf.output('blob')], { type: 'application/pdf' });
        
      } finally {
        // 임시 컨테이너 제거
        document.body.removeChild(tempContainer);
      }
      
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      throw new Error('PDF 생성에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * ReportDetailViewer와 동일한 HTML 구조 생성
   */
  private createReportHTML(report: StoredReport, options: PDFReportOptions): string {
    const { personalInfo, analysisResult } = report;
    
    return `
      <div style="max-width: 800px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- 헤더 -->
        <div style="background: white; padding: 32px; margin-bottom: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
          <h1 style="font-size: 32px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
            ${personalInfo.name}님의 건강 리포트
          </h1>
          <div style="display: flex; align-items: center; gap: 8px; color: #6b7280; margin: 0;">
            <span style="font-size: 14px;">📅 ${this.formatDate(report.timestamp)}</span>
          </div>
        </div>

        <!-- 1단계: 전체 건강 개요 -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center;">
                <span style="color: #2563eb; font-weight: 600; font-size: 14px;">1</span>
              </div>
              <div>
                <h2 style="font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 600;">전체 건강 개요</h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">종합 건강 점수 및 개인 정보</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 24px; background: white;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <!-- 개인 정보 -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                  👤 개인 정보
                </h3>
                <div style="space-y: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">이름</span>
                    <span style="color: #111827; font-weight: 500; font-size: 14px;">${personalInfo.name}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">나이</span>
                    <span style="color: #111827; font-size: 14px;">${personalInfo.age}세</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">성별</span>
                    <span style="color: #111827; font-size: 14px;">${personalInfo.gender === 'male' ? '남성' : '여성'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">직업</span>
                    <span style="background: white; border: 1px solid #d1d5db; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      ${this.getOccupationLabel(personalInfo.occupation)}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 전체 점수 -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                  📊 종합 건강 점수
                </h3>
                <div style="text-align: center; margin-bottom: 16px;">
                  <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px; color: ${this.getScoreColor(analysisResult.overallHealth.score)};">
                    ${analysisResult.overallHealth.score}
                  </div>
                  <div style="background: ${this.getRiskColor(analysisResult.overallHealth.score)}; color: white; padding: 4px 12px; border-radius: 16px; display: inline-block; font-size: 12px; font-weight: 500;">
                    ${analysisResult.overallHealth.grade}
                  </div>
                </div>
                
                <!-- 점수 분포 표시 -->
                ${this.createScoreDistributionHTML(analysisResult.overallHealth.score, '종합 건강 점수')}
                
                <div style="margin-top: 16px;">
                  ${this.markdownToHtml(analysisResult.overallHealth.summary)}
                </div>
              </div>
            </div>

            <!-- 종합 분석 결과 -->
            ${analysisResult.overallHealth?.detailedComprehensiveSummary ? `
              <div style="margin-top: 24px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                  📄 종합 분석 결과
                </h3>
                <div style="background: #eff6ff; border-radius: 8px; padding: 16px;">
                  ${this.markdownToHtml(analysisResult.overallHealth.detailedComprehensiveSummary)}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 2단계: 상세 분석 결과 -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
                <span style="color: #16a34a; font-weight: 600; font-size: 14px;">2</span>
              </div>
              <div>
                <h2 style="font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 600;">상세 분석 결과</h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">EEG, PPG 생체신호 분석 결과</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 24px; background: white;">
            <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
              ${this.createDetailedAnalysisHTML(analysisResult)}
            </div>
          </div>
        </div>

        <!-- 3단계: 정신 건강 위험도 분석 -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #f3e8ff; display: flex; align-items: center; justify-content: center;">
                <span style="color: #9333ea; font-weight: 600; font-size: 14px;">3</span>
              </div>
              <div>
                <h2 style="font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 600;">정신 건강 위험도 분석</h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">우울, ADHD, 번아웃, 충동성 위험도 평가</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 24px; background: white;">
            ${this.createMentalHealthRiskHTML(analysisResult)}
          </div>
        </div>

        <!-- 4단계: 의학적 위험도 분석 -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center;">
                <span style="color: #dc2626; font-weight: 600; font-size: 14px;">4</span>
              </div>
              <div>
                <h2 style="font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 600;">의학적 위험도 분석</h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">생체신호 통합 분석 및 병리학적 위험 평가</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 24px; background: white;">
            ${this.createMedicalRiskAnalysisHTML(analysisResult)}
          </div>
        </div>

        <!-- 5단계: 맞춤형 추천사항 -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 24px;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center;">
                <span style="color: #d97706; font-weight: 600; font-size: 14px;">5</span>
              </div>
              <div>
                <h2 style="font-size: 18px; color: #111827; margin: 0 0 4px 0; font-weight: 600;">맞춤형 추천사항</h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">개인 맞춤형 건강 관리 가이드</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 24px; background: white;">
            ${this.createRecommendationsHTML(analysisResult)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 점수 분포 표시 HTML 생성
   */
  private createScoreDistributionHTML(score: number, label: string): string {
    const getScoreLevel = (score: number) => {
      if (score < 5) return { level: '위험', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' };
      if (score < 25) return { level: '경계', color: '#ea580c', bgColor: '#fff7ed', borderColor: '#fed7aa' };
      if (score < 75) return { level: '보통', color: '#ca8a04', bgColor: '#fefce8', borderColor: '#fde68a' };
      if (score < 95) return { level: '양호', color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0' };
      return { level: '우수', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' };
    };

    const { level, color, bgColor, borderColor } = getScoreLevel(score);

    return `
      <div style="margin: 16px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-size: 14px; font-weight: 600; color: #374151;">${label}</span>
          <span style="font-size: 18px; font-weight: bold; color: ${color};">
            ${score.toFixed(1)}/100
          </span>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="position: relative;">
            <!-- 전체 구간 색상 표시 -->
            <div style="width: 100%; height: 16px; border-radius: 8px; overflow: hidden; background: linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6);">
              <!-- 구간 경계선 -->
              <div style="position: absolute; top: 0; left: 5%; width: 1px; height: 16px; background: rgba(255, 255, 255, 0.7);"></div>
              <div style="position: absolute; top: 0; left: 25%; width: 1px; height: 16px; background: rgba(255, 255, 255, 0.7);"></div>
              <div style="position: absolute; top: 0; left: 75%; width: 1px; height: 16px; background: rgba(255, 255, 255, 0.7);"></div>
              <div style="position: absolute; top: 0; left: 95%; width: 1px; height: 16px; background: rgba(255, 255, 255, 0.7);"></div>
            </div>
            
            <!-- 현재 위치 마커 라인 -->
            <div style="position: absolute; top: 0; left: ${score}%; width: 3px; height: 16px; background: ${color}; border-radius: 2px; transform: translateX(-50%);"></div>
            
            <!-- 현재 위치 표시점 -->
            <div style="position: absolute; top: 50%; left: ${score}%; width: 12px; height: 12px; background: white; border: 2px solid ${color}; border-radius: 50%; transform: translate(-50%, -50%);"></div>
            
            <!-- 점수 및 상태 툴팁 -->
            <div style="position: absolute; top: -45px; left: ${score}%; background: ${color}; color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; transform: translateX(-50%); white-space: nowrap; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div>${score.toFixed(1)}점</div>
              <div>${level}</div>
              <div style="position: absolute; top: 100%; left: 50%; width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid ${color}; transform: translateX(-50%);"></div>
            </div>
          </div>
          
          <!-- 구간 라벨 -->
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: #6b7280; font-weight: 500;">
            <span>위험 (0-5)</span>
            <span>경계 (5-25)</span>
            <span>보통 (25-75)</span>
            <span>양호 (75-95)</span>
            <span>우수 (95-100)</span>
          </div>
        </div>
        <div style="display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 600; color: ${color}; background: ${bgColor}; border: 1px solid ${borderColor};">
          ${level}
        </div>
      </div>
    `;
  }

  /**
   * 상세 분석 결과 HTML 생성
   */
  private createDetailedAnalysisHTML(analysisResult: AIAnalysisResult): string {
    let html = '';

    // 정신건강 분석
    if (analysisResult.detailedAnalysis?.mentalHealth) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            🧠 정신건강 분석 결과
          </h3>
          <div style="font-size: 14px; color: #7c3aed; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.mentalHealth.score}점
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealth.score, '정신건강 점수')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.mentalHealth.analysis)}
          </div>
        </div>
      `;
    }

    // 신체건강 분석
    if (analysisResult.detailedAnalysis?.physicalHealth) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            ❤️ 신체건강 분석 결과
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.physicalHealth.score}점
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.physicalHealth.score, '신체건강 점수')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.physicalHealth.analysis)}
          </div>
        </div>
      `;
    }

    // 스트레스 분석
    if (analysisResult.detailedAnalysis?.stressLevel) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            ⚡ 스트레스 분석 결과
          </h3>
          <div style="font-size: 14px; color: #ca8a04; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.stressLevel.score}점
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.stressLevel.score, '스트레스 점수')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.stressLevel.analysis)}
          </div>
        </div>
      `;
    }

    return html;
  }



  /**
   * 의학적 위험도 분석 HTML 생성
   */
  private createMedicalRiskAnalysisHTML(analysisResult: AIAnalysisResult): string {
    let html = '';

    // 우울증 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.depression) {
      html += `
        <div style="background: #fef2f2; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            💔 우울증 위험도
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore}점
          </div>
          <div style="margin-bottom: 12px;">
            <span style="background: #fef2f2; border: 1px solid #e5e7eb; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              위험
            </span>
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore, '우울증 위험도')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.mentalHealthRisk.depression.analysis)}
          </div>
        </div>
      `;
    }

    // ADHD 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd) {
      html += `
        <div style="background: #fef2f2; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            🧠 ADHD 위험도
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore}점
          </div>
          <div style="margin-bottom: 12px;">
            <span style="background: #fef2f2; border: 1px solid #e5e7eb; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              위험
            </span>
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore, 'ADHD 위험도')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.mentalHealthRisk.adhd.analysis)}
          </div>
        </div>
      `;
    }

    // 번아웃 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout) {
      html += `
        <div style="background: #fef2f2; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            💤 번아웃 위험도
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore}점
          </div>
          <div style="margin-bottom: 12px;">
            <span style="background: #fef2f2; border: 1px solid #e5e7eb; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              위험
            </span>
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore, '번아웃 위험도')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.mentalHealthRisk.burnout.analysis)}
          </div>
        </div>
      `;
    }

    // 충동성 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity) {
      html += `
        <div style="background: #fef2f2; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            💥 충동성 위험도
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            점수: ${analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore}점
          </div>
          <div style="margin-bottom: 12px;">
            <span style="background: #fef2f2; border: 1px solid #e5e7eb; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              위험
            </span>
          </div>
          
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore, '충동성 위험도')}
          
          <div style="margin-top: 12px;">
            ${this.markdownToHtml(analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.analysis)}
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * 맞춤형 추천사항 HTML 생성
   */
  private createRecommendationsHTML(analysisResult: AIAnalysisResult): string {
    let html = '';

    // 즉시 실행 가능한 생활습관
    if (analysisResult.personalizedRecommendations?.immediate?.lifestyle?.length > 0) {
      html += `
        <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0c4a6e; display: flex; align-items: center; gap: 8px;">
            🚀 즉시 실행 가능한 생활습관
          </h3>
          <div style="font-size: 14px; line-height: 1.6; color: #374151;">
            ${analysisResult.personalizedRecommendations.immediate.lifestyle.map(item => `<div style="margin-bottom: 8px; padding-left: 16px; position: relative;">
              <span style="position: absolute; left: 0; color: #0ea5e9;">•</span>
              ${item}
            </div>`).join('')}
          </div>
        </div>
      `;
    }

    // 단기 목표 (1-3개월)
    if (analysisResult.personalizedRecommendations?.shortTerm?.lifestyle?.length > 0) {
      html += `
        <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #14532d; display: flex; align-items: center; gap: 8px;">
            📅 단기 목표 (1-3개월)
          </h3>
          <div style="font-size: 14px; line-height: 1.6; color: #374151;">
            ${analysisResult.personalizedRecommendations.shortTerm.lifestyle.map(item => `<div style="margin-bottom: 8px; padding-left: 16px; position: relative;">
              <span style="position: absolute; left: 0; color: #22c55e;">•</span>
              ${item}
            </div>`).join('')}
          </div>
        </div>
      `;
    }

    // 장기 목표 (3-12개월)
    if (analysisResult.personalizedRecommendations?.longTerm?.lifestyle?.length > 0) {
      html += `
        <div style="background: #fefce8; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #92400e; display: flex; align-items: center; gap: 8px;">
            🎯 장기 목표 (3-12개월)
          </h3>
          <div style="font-size: 14px; line-height: 1.6; color: #374151;">
            ${analysisResult.personalizedRecommendations.longTerm.lifestyle.map(item => `<div style="margin-bottom: 8px; padding-left: 16px; position: relative;">
              <span style="position: absolute; left: 0; color: #f59e0b;">•</span>
              ${item}
            </div>`).join('')}
          </div>
        </div>
      `;
    }

    // 직업별 맞춤 조언 추가
    if (analysisResult.personalizedRecommendations?.occupationSpecific?.workplaceStrategies?.length > 0) {
      html += `
        <div style="background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #be185d; display: flex; align-items: center; gap: 8px;">
            👨‍⚕️ 직업별 맞춤 조언
          </h3>
          <div style="font-size: 14px; line-height: 1.6; color: #374151;">
            ${analysisResult.personalizedRecommendations.occupationSpecific.workplaceStrategies.map((item: string) => `<div style="margin-bottom: 8px; padding-left: 16px; position: relative;">
              <span style="position: absolute; left: 0; color: #ec4899;">•</span>
              ${item}
            </div>`).join('')}
          </div>
        </div>
      `;
    }

    // 추가 여백 보장
    html += `
      <div style="height: 60px; background: transparent;"></div>
    `;

    return html;
  }

  /**
   * 직업 라벨 변환
   */
  private getOccupationLabel(occupation: string): string {
    const labels: { [key: string]: string } = {
      'teacher': '교사',
      'military_medic': '의무병사',
      'military_career': '직업군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'parent': '학부모',
      'firefighter': '소방공무원',
      'police': '경찰공무원',
      'developer': '개발자',
      'designer': '디자이너',
      'office_worker': '일반 사무직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'other': '그외'
    };
    return labels[occupation] || occupation;
  }

  /**
   * 점수에 따른 색상 반환
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return '#16a34a'; // 녹색
    if (score >= 60) return '#2563eb'; // 파란색
    if (score >= 40) return '#ea580c'; // 주황색
    return '#dc2626'; // 빨간색
  }



  /**
   * 위험도 레벨 반환 - 5단계 정규분포 기준
   */
  private getRiskLevel(score: number): string {
    if (score < 5) return '위험';
    if (score < 25) return '경계';
    if (score < 75) return '보통';
    if (score < 95) return '양호';
    return '우수';
  }

  /**
   * 위험도 색상 반환 - 5단계 정규분포 기준
   */
  private getRiskColor(score: number): string {
    if (score < 5) return '#dc2626'; // 빨간색 - 위험
    if (score < 25) return '#ea580c'; // 주황색 - 경계
    if (score < 75) return '#ca8a04'; // 노란색 - 보통
    if (score < 95) return '#16a34a'; // 녹색 - 양호
    return '#2563eb'; // 파란색 - 우수
  }

  /**
   * 전문가 권장사항 반환 - 5단계 정규분포 기준
   */
  private getExpertRecommendation(score: number): string {
    if (score < 5) {
      return '즉시 전문의 상담을 받으시기 바랍니다. 정신건강 관리가 시급한 상태입니다.';
    } else if (score < 25) {
      return '전문의 상담을 고려해보시기 바랍니다. 스트레스 관리와 충분한 휴식이 필요합니다.';
    } else if (score < 75) {
      return '정기적인 스트레스 관리와 건강한 생활습관 유지를 권장합니다.';
    } else if (score < 95) {
      return '현재 상태를 잘 유지하시고, 꾸준한 자기관리를 계속하시기 바랍니다.';
    } else {
      return '매우 양호한 상태입니다. 현재의 건강한 생활습관을 지속하시기 바랍니다.';
    }
  }

  /**
   * 날짜 포맷
   */
  private formatDate(timestamp: number): string {
    return format(new Date(timestamp), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  }

  /**
   * 정신 건강 위험도 분석 HTML 생성
   */
  private createMentalHealthRiskHTML(analysisResult: AIAnalysisResult): string {
    let html = '';

    // 종합 위험도 평가
    if (analysisResult.detailedAnalysis?.mentalHealthRisk) {
      const riskScores = [
        analysisResult.detailedAnalysis.mentalHealthRisk.depression?.riskScore || 0,
        analysisResult.detailedAnalysis.mentalHealthRisk.adhd?.riskScore || 0,
        analysisResult.detailedAnalysis.mentalHealthRisk.burnout?.riskScore || 0,
        analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity?.riskScore || 0
      ];
      
      const maxRiskScore = Math.max(...riskScores);
      const riskLevel = this.getRiskLevel(100 - maxRiskScore);
      const riskColor = this.getRiskColor(100 - maxRiskScore);
      
      html += `
        <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
            ⚠️ 종합 위험도 평가
          </h3>
          <div style="font-size: 14px; color: #dc2626; font-weight: 500; margin-bottom: 12px;">
            최고 위험도: ${maxRiskScore}점
          </div>
          <div style="margin-bottom: 12px;">
            <span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500;">
              ${riskLevel}
            </span>
          </div>
          
          ${this.createScoreDistributionHTML(100 - maxRiskScore, '종합 위험도')}
          
          <div style="margin-top: 12px; padding: 12px; background: #fef2f2; border-radius: 6px;">
            <div style="font-size: 12px; font-weight: 500; color: #dc2626; margin-bottom: 4px;">전문가 권장사항</div>
            <div style="font-size: 11px; line-height: 1.4; color: #7f1d1d;">
              ${this.getExpertRecommendation(100 - maxRiskScore)}
            </div>
          </div>
        </div>
      `;
    }

    // 개별 위험도 카드들
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">';

    // 우울 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.depression) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
            💔 우울 위험도
          </h3>
          <div style="font-size: 12px; color: #3b82f6; font-weight: 500; margin-bottom: 8px;">
            위험도: ${analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore}점
          </div>
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore, '우울 위험도')}
        </div>
      `;
    }

    // ADHD 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
            🎯 ADHD/집중력 위험도
          </h3>
          <div style="font-size: 12px; color: #ea580c; font-weight: 500; margin-bottom: 8px;">
            위험도: ${analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore}점
          </div>
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore, 'ADHD 위험도')}
        </div>
      `;
    }

    // 번아웃 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
            🔥 번아웃 위험도
          </h3>
          <div style="font-size: 12px; color: #dc2626; font-weight: 500; margin-bottom: 8px;">
            위험도: ${analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore}점
          </div>
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore, '번아웃 위험도')}
        </div>
      `;
    }

    // 충동성 위험도
    if (analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity) {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="display: flex; align-items: center; gap: 8px; color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
            ⚡ 충동성 위험도
          </h3>
          <div style="font-size: 12px; color: #ca8a04; font-weight: 500; margin-bottom: 8px;">
            위험도: ${analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore}점
          </div>
          ${this.createScoreDistributionHTML(analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore, '충동성 위험도')}
        </div>
      `;
    }

    html += '</div>';

    return html;
  }

}

export default PDFReportService; 