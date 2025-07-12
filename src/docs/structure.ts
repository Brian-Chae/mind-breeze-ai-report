export interface DocumentSection {
  id: string;
  title: string;
  subsections: DocumentSubsection[];
}

export interface DocumentSubsection {
  id: string;
  title: string;
  filePath: string; // 마크다운 파일 경로 (언어별로 자동 처리)
}

export const documentStructure: DocumentSection[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    subsections: [
      {
        id: 'overview',
        title: '개요',
        filePath: 'getting-started/overview.md'
      },
      {
        id: 'system-requirements',
        title: '시스템 요구사항',
        filePath: 'getting-started/system-requirements.md'
      },
      {
        id: 'first-connection',
        title: '첫 번째 연결',
        filePath: 'getting-started/first-connection.md'
      },
      {
        id: 'interface-tour',
        title: '인터페이스 둘러보기',
        filePath: 'getting-started/interface-tour.md'
      }
    ]
  },
  {
    id: 'user-guide',
    title: '사용자 가이드',
    subsections: [
      {
        id: 'device-manager',
        title: 'Device Manager',
        filePath: 'user-guide/device-manager.md'
      },
      {
        id: 'visualizer',
        title: 'Visualizer',
        filePath: 'user-guide/visualizer.md'
      },
      {
        id: 'data-center',
        title: 'Data Center',
        filePath: 'user-guide/data-center.md'
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        filePath: 'user-guide/dashboard.md'
      }
    ]
  },
  {
    id: 'data-management',
    title: '데이터 관리',
    subsections: [
      {
        id: 'data-formats',
        title: '데이터 형식',
        filePath: 'data-management/data-formats.md'
      },
      {
        id: 'export-options',
        title: '내보내기 옵션',
        filePath: 'data-management/export-options.md'
      },
      {
        id: 'session-management',
        title: '세션 관리',
        filePath: 'data-management/session-management.md'
      },
      {
        id: 'storage-info',
        title: '저장소 정보',
        filePath: 'data-management/storage-info.md'
      }
    ]
  }
];

// 언어별 번역
export const documentTitles = {
  ko: {
    'getting-started': '시작하기',
    'overview': '개요',
    'system-requirements': '시스템 요구사항',
    'first-connection': '첫 번째 연결',
    'interface-tour': '인터페이스 둘러보기',
    'user-guide': '사용자 가이드',
    'device-manager': 'Device Manager',
    'visualizer': 'Visualizer',
    'data-center': 'Data Center',
    'dashboard': 'Dashboard',
    'data-management': '데이터 관리',
    'data-formats': '데이터 형식',
    'export-options': '내보내기 옵션',
    'session-management': '세션 관리',
    'storage-info': '저장소 정보'
  },
  en: {
    'getting-started': 'Getting Started',
    'overview': 'Overview',
    'system-requirements': 'System Requirements',
    'first-connection': 'First Connection',
    'interface-tour': 'Interface Tour',
    'user-guide': 'User Guide',
    'device-manager': 'Device Manager',
    'visualizer': 'Visualizer',
    'data-center': 'Data Center',
    'dashboard': 'Dashboard',
    'data-management': 'Data Management',
    'data-formats': 'Data Formats',
    'export-options': 'Export Options',
    'session-management': 'Session Management',
    'storage-info': 'Storage Info'
  }
}; 