import { Language, useLanguageStore } from '../stores/languageStore';
import { landingTexts } from './landing';

// 번역 키 타입 정의
export interface TranslationKeys {
  documents: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
  };
  landing: typeof landingTexts.ko;
}

// 한국어 번역
const ko: TranslationKeys = {
  documents: {
    title: '문서',
    subtitle: 'SDK 개발 관련 문서를 조회하고 볼 수 있습니다.',
    searchPlaceholder: '문서 검색...',
  },
  landing: landingTexts.ko,
};

// 영어 번역
const en: TranslationKeys = {
  documents: {
    title: 'Documents',
    subtitle: 'View and browse SDK development related documentation.',
    searchPlaceholder: 'Search documents...',
  },
  landing: landingTexts.en,
};

// 일본어 번역
const jp: TranslationKeys = {
  documents: {
    title: 'ドキュメント',
    subtitle: 'SDK開発関連ドキュメントを閲覧・参照できます。',
    searchPlaceholder: 'ドキュメント検索...',
  },
  landing: landingTexts.jp,
};

// 번역 객체
const translations = {
  ko,
  en,
  jp,
};

// 번역 훅
export const useTranslation = (language?: Language): TranslationKeys => {
  const { currentLanguage } = useLanguageStore();
  const lang = (language || currentLanguage) as Language;
  return translations[lang];
};

// 랜딩 페이지 번역 훅
export const useLandingTranslation = (language: Language) => {
  return landingTexts[language];
}; 