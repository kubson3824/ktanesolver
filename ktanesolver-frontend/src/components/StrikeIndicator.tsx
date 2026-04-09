import React, { useEffect, useState } from 'react';
import { useRoundStore } from '../store/useRoundStore';
import { BombStatus } from '../types';

interface StrikeIndicatorProps {
  bombId?: string;
  className?: string;
}

export const StrikeIndicator: React.FC<StrikeIndicatorProps> = ({
  bombId,
  className = ''
}) => {
  const { round, currentBomb } = useRoundStore();
  const [previousStrikes, setPreviousStrikes] = useState(0);

  const bomb = bombId
    ? round?.bombs.find(b => b.id === bombId)
    : currentBomb;

  useEffect(() => {
    if (bomb && bomb.strikes > previousStrikes) {
      setPreviousStrikes(bomb.strikes);
      const timer = setTimeout(() => setPreviousStrikes(bomb.strikes), 500);
      return () => clearTimeout(timer);
    }
  }, [bomb, previousStrikes]);

  if (!bomb) return null;

  const isExploded = bomb.status === BombStatus.EXPLODED;
  const strikeCount = bomb.strikes;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: strikeCount }).map((_, i) => (
        <span
          key={i}
          className={`font-bold text-sm ${isExploded ? 'text-error' : 'text-primary'}`}
          aria-hidden="true"
        >
          ✕
        </span>
      ))}
      {strikeCount === 0 && !isExploded && (
        <span className="text-xs text-ink-muted">No strikes</span>
      )}
      {isExploded && (
        <span className="text-xs font-semibold text-error uppercase tracking-wide ml-1">
          EXPLODED
        </span>
      )}
    </div>
  );
};
