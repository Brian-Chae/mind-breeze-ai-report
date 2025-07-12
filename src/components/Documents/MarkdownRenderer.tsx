import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import 'github-markdown-css/github-markdown.css';

interface MarkdownRendererProps {
  filePath: string;
  className?: string;
  onNavigate?: (path: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  filePath, 
  className,
  onNavigate 
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 웹 환경에서는 fetch 사용
        const response = await fetch(`/docs/${filePath}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${filePath}`);
        }
        
        const markdown = await response.text();
        
        // marked 설정
        marked.setOptions({
          gfm: true, // GitHub Flavored Markdown 지원
          breaks: true, // 줄바꿈을 <br>로 변환
        });
        
        const html = await marked(markdown);
        setContent(html);
      } catch (err) {
        console.error('Error loading markdown:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      loadMarkdown();
    }
  }, [filePath]);

  // 링크 클릭 이벤트 핸들러
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLAnchorElement;
    if (target && target.tagName === 'A') {
      const href = target.getAttribute('href');
      
      if (href) {
        // 외부 링크인지 확인 (http, https, mailto 등)
        if (href.startsWith('http') || href.startsWith('https') || href.startsWith('mailto:')) {
          event.preventDefault();
          
          // 새 창으로 열기
          try {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          } catch (error) {
            console.warn('Failed to open external link in new window:', error);
          }
        }
        // 내부 링크인지 확인 (.md 파일 또는 상대 경로)
        else if (href.endsWith('.md') || (!href.startsWith('http') && !href.startsWith('mailto:'))) {
          event.preventDefault();
          
          if (onNavigate) {
            // .md 확장자 제거하고 경로 정규화
            const cleanPath = href.replace('.md', '');
            onNavigate(cleanPath);
          } else {
            // onNavigate가 없으면 경고 로그만 출력
            console.warn('Internal link clicked but no navigation handler provided:', href);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">문서를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">문서를 불러올 수 없습니다: {error}</div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      className={`markdown-body custom-table-styles ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        boxSizing: 'border-box',
        minWidth: '200px',
        maxWidth: '100%',
        margin: '0',
        padding: '32px'
      }}
    />
  );
}; 