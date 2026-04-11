import React from 'react';
import { useRoundStore } from '../store/useRoundStore';
import { BombStatus } from '../types';

interface StrikeIndicatorProps {
  bombId?: string;
  className?: string;
}

export const StrikeIndicator: React.FC<StrikeIndicatorProps> = ({ bombId, className = '' }) => {
  const { round, currentBomb } = useRoundStore();
  const bomb = bombId ? round?.bombs.find(b => b.id === bombId) : currentBomb;

  if (!bomb) return null;

  const isExploded = bomb.status === BombStatus.EXPLODED;
  const strikeCount = bomb.strikes;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: strikeCount }).map((_, i) => (
        <span key={i} className="font-bold text-sm text-destructive" aria-hidden>✕</span>
      ))}
      {strikeCount === 0 && !isExploded && (
        <span className="text-xs text-muted-foreground">No strikes</span>
      )}
      {isExploded && (
        <span className="text-xs font-semibold text-destructive uppercase tracking-wide ml-1">EXPLODED</span>
      )}
    </div>
  );
};
