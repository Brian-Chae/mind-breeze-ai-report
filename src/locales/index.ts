import { Language } from '../stores/languageStore';

// 번역 키 타입 정의
export interface TranslationKeys {
  documents: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
  };
}

// 한국어 번역
const ko: TranslationKeys = {
  documents: {
    title: '문서',
    subtitle: 'SDK 개발 관련 문서를 조회하고 볼 수 있습니다.',
    searchPlaceholder: '문서 검색...',
  },
};

// 영어 번역
const en: TranslationKeys = {
  documents: {
    title: 'Documents',
    subtitle: 'View and browse SDK development related documentation.',
    searchPlaceholder: 'Search documents...',
  },
};

// 번역 객체
const translations = {
  ko,
  en,
};

// 번역 훅
export const useTranslation = (language: Language): TranslationKeys => {
  return translations[language];
}; 