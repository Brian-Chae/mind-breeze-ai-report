/**
 * AI 분석 결과 전용 마크다운 렌더러
 * - Gemini AI가 반환하는 마크다운 형식의 분석 결과를 렌더링
 * - 의료 리포트에 최적화된 스타일링
 * - 전체 애플리케이션 디자인과 일관성 유지
 */

import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './AIAnalysisMarkdownRenderer.css';

interface AIAnalysisMarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const AIAnalysisMarkdownRenderer: React.FC<AIAnalysisMarkdownRendererProps> = ({
  content,
  className = '',
  variant = 'default'
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('마크다운 렌더링 시작:', content);

        // 마크다운을 HTML로 변환
        const rawHtml = await marked.parse(content, {
          gfm: true,
          breaks: true
        });
        
        console.log('마크다운 변환 결과:', rawHtml);
        
        // XSS 방지를 위한 HTML 정화
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 'del',
            'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'hr', 'div', 'span'
          ],
          ALLOWED_ATTR: ['class', 'style'],
          ALLOW_DATA_ATTR: false
        });

        console.log('정화된 HTML:', cleanHtml);
        setHtmlContent(cleanHtml);
      } catch (err) {
        console.error('마크다운 렌더링 오류:', err);
        setError('마크다운 렌더링 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    renderMarkdown();
  }, [content]);

  const variantClass = `ai-analysis-renderer-${variant}`;

  if (isLoading) {
    return (
      <div className={`ai-analysis-markdown-renderer ${variantClass} ${className}`}>
        <div className="ai-analysis-loading">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ai-analysis-markdown-renderer ${variantClass} ${className}`}>
        <div className="ai-analysis-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`ai-analysis-markdown-renderer ${variantClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default AIAnalysisMarkdownRenderer; 