import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useLanguageStore } from '../../stores/languageStore';
import { documentStructure } from '../../docs/structure';
import { FileText, Clock, User, Star } from 'lucide-react';

interface DocumentsContentProps {
  selectedSection: string;
  selectedSubsection: string;
  onNavigate?: (section: string, subsection: string) => void;
}

export const DocumentsContent: React.FC<DocumentsContentProps> = ({
  selectedSection,
  selectedSubsection,
  onNavigate,
}) => {
  const { currentLanguage } = useLanguageStore();

  // 파일 경로에서 섹션과 서브섹션 찾기
  const findSectionAndSubsection = (path: string) => {
    // 경로에서 파일명 추출 (예: "first-steps" from "first-steps.md" or "../first-steps")
    const fileName = path.split('/').pop() || path;
    const cleanFileName = fileName.replace(/^\.\.\//, '').replace(/\.md$/, '');
    
    // documentStructure에서 해당 파일 찾기
    for (const section of documentStructure) {
      for (const subsection of section.subsections) {
        const subsectionFileName = subsection.filePath.split('/').pop()?.replace('.md', '');
        if (subsectionFileName === cleanFileName) {
          return { section: section.id, subsection: subsection.id };
        }
      }
    }
    
    // 찾지 못한 경우 현재 섹션 유지
    return null;
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      const result = findSectionAndSubsection(path);
      if (result) {
        onNavigate(result.section, result.subsection);
      } else {
        console.warn('Could not find section/subsection for path:', path);
      }
    }
  };

  // 선택된 섹션과 서브섹션이 없으면 빈 상태 표시
  if (!selectedSection || !selectedSubsection) {
    return (
      <div className="flex-1 overflow-y-auto bg-black">
        <div className="min-h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-3xl shadow-2xl mb-6 mx-auto">
              <FileText className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-300 mb-4">
              {currentLanguage === 'ko' ? '문서를 선택해주세요' : 'Select a document'}
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {currentLanguage === 'ko' 
                ? '왼쪽 사이드바에서 문서를 선택하여 내용을 확인하세요.' 
                : 'Choose a document from the sidebar to view its content.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // documentStructure에서 실제 파일 경로 찾기
  const getFilePath = () => {
    for (const section of documentStructure) {
      if (section.id === selectedSection) {
        for (const subsection of section.subsections) {
          if (subsection.id === selectedSubsection) {
            return `${currentLanguage}/${subsection.filePath}`;
          }
        }
      }
    }
    // 파일을 찾지 못한 경우 기본값 반환
    return `${currentLanguage}/getting-started/overview.md`;
  };

  // 현재 섹션과 서브섹션 정보 가져오기
  const getCurrentSectionInfo = () => {
    for (const section of documentStructure) {
      if (section.id === selectedSection) {
        for (const subsection of section.subsections) {
          if (subsection.id === selectedSubsection) {
            return {
              sectionTitle: section.title,
              subsectionTitle: subsection.title,
              sectionId: section.id
            };
          }
        }
      }
    }
    return null;
  };

  const filePath = getFilePath();
  const sectionInfo = getCurrentSectionInfo();

  // 섹션별 색상 매핑
  const sectionColors = {
    'getting-started': 'from-emerald-500 via-green-500 to-teal-600',
    'user-guide': 'from-blue-500 via-indigo-500 to-cyan-600',
    'api-reference': 'from-orange-500 via-red-500 to-pink-600',
    'data-management': 'from-purple-500 via-violet-500 to-indigo-600',
    'quick-start': 'from-cyan-500 via-blue-500 to-indigo-600',
    'examples': 'from-pink-500 via-rose-500 to-red-600',
  };

  const colorClass = sectionColors[selectedSection as keyof typeof sectionColors] || 'from-gray-500 to-gray-600';

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      <div className="min-h-full">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Document Header */}
          {sectionInfo && (
            <div className="mb-12 p-8 bg-black border border-gray-500 rounded-3xl shadow-2xl card-hover animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${colorClass} rounded-2xl shadow-2xl card-hover`}>
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent mb-2`}>
                    {sectionInfo.subsectionTitle}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {sectionInfo.sectionTitle}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{currentLanguage === 'ko' ? '읽는 시간' : 'Reading time'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{currentLanguage === 'ko' ? '개발자용' : 'For developers'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{currentLanguage === 'ko' ? '전문가 수준' : 'Expert level'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-black border border-gray-500 rounded-3xl shadow-2xl p-8 card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <MarkdownRenderer 
              filePath={filePath} 
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 