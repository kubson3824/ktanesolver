import React from 'react';
import { Plus } from 'lucide-react';
import { useRoundStore } from '../store/useRoundStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface StrikeButtonProps {
  bombId?: string;
  className?: string;
}

export const StrikeButton: React.FC<StrikeButtonProps> = ({ bombId, className = '' }) => {
  const { currentBomb, addStrike, loading } = useRoundStore();

  const handleStrike = async () => {
    const targetBombId = bombId || currentBomb?.id;
    if (!targetBombId) return;
    try {
      await addStrike(targetBombId);
    } catch (error) {
      console.error('Failed to add strike:', error);
    }
  };

  const isDisabled = loading || (!bombId && !currentBomb);
  const strikes = (bombId ? undefined : currentBomb?.strikes) ?? 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="destructive">{strikes}</Badge>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleStrike}
        disabled={isDisabled}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Strike
      </Button>
    </div>
  );
};
