import { useCallback } from 'react';
import { useRoundStore } from '../store/useRoundStore';

export const useStrike = () => {
  const { currentBomb, addStrike, loading } = useRoundStore();

  const triggerStrike = useCallback(async (bombId?: string) => {
    const targetBombId = bombId || currentBomb?.id;
    if (!targetBombId) {
      throw new Error('No bomb selected');
    }

    return await addStrike(targetBombId);
  }, [currentBomb?.id, addStrike]);

  return {
    triggerStrike,
    loading,
    currentBomb,
  };
};
