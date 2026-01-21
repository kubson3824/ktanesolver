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
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className={`font-bold text-lg ${
        isExploded ? 'text-red-600' : strikeCount > 0 ? 'text-red-500' : 'text-gray-600'
      }`}>
        {strikeCount}
      </span>
      
      <span className={`font-medium ${
        isExploded ? 'text-red-600' : strikeCount > 0 ? 'text-red-500' : 'text-gray-600'
      }`}>
        {isExploded ? 'EXPLODED!' : strikeCount === 1 ? 'Strike' : 'Strikes'}
      </span>
    </div>
  );
};
