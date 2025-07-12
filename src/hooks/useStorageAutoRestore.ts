import { useEffect, useState } from 'react';
import { useStorageStore } from '../stores/storageStore';

/**
 * 앱 시작 시 저장소를 자동으로 복원하는 Hook
 */
export const useStorageAutoRestore = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const { checkAndRestoreStorage, isStorageReady } = useStorageStore();

  useEffect(() => {
    let mounted = true;

    const attemptRestore = async () => {
      // 이미 저장소가 준비되어 있거나 복원 중이면 스킵
      if (isStorageReady || isRestoring) {
        return;
      }

      setIsRestoring(true);
      setRestoreError(null);

      try {
        console.log('[AUTO-RESTORE] 🔄 저장소 자동 복원 시도...');

        const success = await checkAndRestoreStorage();

        if (mounted) {
          if (success) {
            console.log('[AUTO-RESTORE] ✅ 저장소 자동 복원 성공');
            setIsRestored(true);
          } else {
            console.log('[AUTO-RESTORE] 📭 복원할 저장소 없음 (정상)');
            setIsRestored(false);
          }
        }
      } catch (error) {
        console.error('[AUTO-RESTORE] ❌ 저장소 자동 복원 실패:', error);

        if (mounted) {
          setRestoreError(error instanceof Error ? error.message : '알 수 없는 오류');
          setIsRestored(false);
        }
      } finally {
        if (mounted) {
          setIsRestoring(false);
        }
      }
    };

    // 컴포넌트 마운트 후 약간 지연을 두고 복원 시도
    const timeoutId = setTimeout(attemptRestore, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [checkAndRestoreStorage, isStorageReady, isRestoring]);

  return {
    isRestoring,
    isRestored,
    restoreError,
    isStorageReady
  };
}; 