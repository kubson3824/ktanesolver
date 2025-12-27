import React from 'react';
import { useRoundStore } from '../store/useRoundStore';
import { BombStatus } from '../types';

interface StrikeButtonProps {
  bombId?: string;
  className?: string;
  children?: React.ReactNode;
}

export const StrikeButton: React.FC<StrikeButtonProps> = ({ 
  bombId, 
  className = '', 
  children = 'Add Strike' 
}) => {
  const { currentBomb, addStrike, loading } = useRoundStore();

  const handleStrike = async () => {
    const targetBombId = bombId || currentBomb?.id;
    if (!targetBombId) {
      console.error('No bomb selected');
      return;
    }

    try {
      await addStrike(targetBombId);
    } catch (error) {
      console.error('Failed to add strike:', error);
    }
  };

  const bomb = bombId 
    ? useRoundStore.getState().round?.bombs.find(b => b.id === bombId)
    : currentBomb;

  const isDisabled = loading || (!bombId && !currentBomb);

  return (
    <button
      onClick={handleStrike}
      disabled={isDisabled}
      className={`btn ${className} btn-error`}
    >
      {children}
    </button>
  );
};
