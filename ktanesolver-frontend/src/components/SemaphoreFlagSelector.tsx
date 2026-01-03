import { useState } from 'react';

interface SemaphoreFlagSelectorProps {
  onPositionSelect: (character: string, leftFlagAngle: number, rightFlagAngle: number) => void;
  disabled?: boolean;
}

export default function SemaphoreFlagSelector({ onPositionSelect, disabled = false }: SemaphoreFlagSelectorProps) {
  // Define merged semaphore positions with their angles and characters
  const positions = [
    // Control characters
    { id: 'NUMERALS', leftFlagAngle: 0, rightFlagAngle: 45, character: '§', isControl: true },
    { id: 'LETTERS', leftFlagAngle: 0, rightFlagAngle: 90, character: '§', isControl: true },
    // Merged positions (angles, letter, number)
    { id: '225-180', leftFlagAngle: 225, rightFlagAngle: 180, letter: 'A', number: '1' },
    { id: '270-180', leftFlagAngle: 270, rightFlagAngle: 180, letter: 'B', number: '2' },
    { id: '315-180', leftFlagAngle: 315, rightFlagAngle: 180, letter: 'C', number: '3' },
    { id: '0-180', leftFlagAngle: 0, rightFlagAngle: 180, letter: 'D', number: '4' },
    { id: '180-45', leftFlagAngle: 180, rightFlagAngle: 45, letter: 'E', number: '5' },
    { id: '180-90', leftFlagAngle: 180, rightFlagAngle: 90, letter: 'F', number: '6' },
    { id: '180-135', leftFlagAngle: 180, rightFlagAngle: 135, letter: 'G', number: '7' },
    { id: '270-225', leftFlagAngle: 270, rightFlagAngle: 225, letter: 'H', number: '8' },
    { id: '315-225', leftFlagAngle: 315, rightFlagAngle: 225, letter: 'I', number: '9' },
    { id: '225-0', leftFlagAngle: 225, rightFlagAngle: 0, letter: 'K', number: '0' },
    // Letters only
    { id: '0-90', leftFlagAngle: 0, rightFlagAngle: 90, letter: 'J', number: null },
    { id: '225-45', leftFlagAngle: 225, rightFlagAngle: 45, letter: 'L', number: null },
    { id: '225-90', leftFlagAngle: 225, rightFlagAngle: 90, letter: 'M', number: null },
    { id: '225-135', leftFlagAngle: 225, rightFlagAngle: 135, letter: 'N', number: null },
    { id: '270-315', leftFlagAngle: 270, rightFlagAngle: 315, letter: 'O', number: null },
    { id: '270-0', leftFlagAngle: 270, rightFlagAngle: 0, letter: 'P', number: null },
    { id: '270-45', leftFlagAngle: 270, rightFlagAngle: 45, letter: 'Q', number: null },
    { id: '270-90', leftFlagAngle: 270, rightFlagAngle: 90, letter: 'R', number: null },
    { id: '270-135', leftFlagAngle: 270, rightFlagAngle: 135, letter: 'S', number: null },
    { id: '315-0', leftFlagAngle: 315, rightFlagAngle: 0, letter: 'T', number: null },
    { id: '315-45', leftFlagAngle: 315, rightFlagAngle: 45, letter: 'U', number: null },
    { id: '0-135', leftFlagAngle: 0, rightFlagAngle: 135, letter: 'V', number: null },
    { id: '45-90', leftFlagAngle: 45, rightFlagAngle: 90, letter: 'W', number: null },
    { id: '45-135', leftFlagAngle: 45, rightFlagAngle: 135, letter: 'X', number: null },
    { id: '315-90', leftFlagAngle: 315, rightFlagAngle: 90, letter: 'Y', number: null },
    { id: '135-90', leftFlagAngle: 135, rightFlagAngle: 90, letter: 'Z', number: null },
  ];

  const [mode, setMode] = useState<'letters' | 'numerals'>('letters');

  const renderFlag = (angle: number, isLeft: boolean) => {
    const flagColor = isLeft ? 'bg-red-500' : 'bg-yellow-500';
    const rotationClass = `rotate-${angle}`;

    return (
      <div
        className={`absolute w-1 h-8 ${flagColor} origin-bottom`}
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'bottom center'
        }}
      >
        <div className={`absolute -top-2 -left-2 w-0 h-0 border-l-4 border-r-4 border-b-8 ${isLeft ? 'border-l-transparent border-r-transparent border-b-red-500' : 'border-l-transparent border-r-transparent border-b-yellow-500'}`}></div>
      </div>
    );
  };

  const handlePositionClick = (pos: any) => {
    if (pos.isControl) {
      // Handle control characters
      if (pos.id === 'NUMERALS') {
        setMode('numerals');
      } else if (pos.id === 'LETTERS') {
        setMode('letters');
      }
      onPositionSelect(pos.character, pos.leftFlagAngle, pos.rightFlagAngle);
    } else {
      // Handle regular positions
      const character = mode === 'numerals' && pos.number !== null ? pos.number : pos.letter;
      onPositionSelect(character, pos.leftFlagAngle, pos.rightFlagAngle);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 text-sm font-medium">SELECT SEMAPHORE POSITION</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <span className={`text-xs font-bold ${mode === 'letters' ? 'text-blue-400' : 'text-green-400'}`}>
            {mode.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-4">
        {positions.map((pos) => (
          <button
            key={pos.id}
            onClick={() => handlePositionClick(pos)}
            disabled={disabled}
            className={`relative rounded-lg p-3 transition-colors ${
              pos.isControl
                ? 'bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800'
                : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800'
            } disabled:opacity-50`}
            title={`${pos.isControl ? pos.id : (mode === 'numerals' && pos.number !== null ? pos.number : pos.letter)} (${pos.leftFlagAngle}°, ${pos.rightFlagAngle}°)`}
          >
            <div className="relative w-full h-20 flex items-start justify-center overflow-hidden">
              {/* Center person */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full z-10"></div>

              {/* Flags - positioned from center */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                {renderFlag(pos.leftFlagAngle, true)}
                {renderFlag(pos.rightFlagAngle, false)}
              </div>
            </div>
            <div className="text-xs mt-2 text-center">
              {pos.isControl ? (
                <span className="text-purple-300 font-bold">{pos.id}</span>
              ) : (
                <span className="text-gray-300">
                  {mode === 'numerals' && pos.number !== null ? (
                    <span className="text-green-400">{pos.number}</span>
                  ) : (
                    <span className="text-blue-400">{pos.letter}</span>
                  )}
                  {pos.number !== null && (
                    <span className="text-gray-500 text-xs block">
                      ({pos.letter}/{pos.number})
                    </span>
                  )}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Click on the semaphore position that matches what you see on the module
      </div>
    </div>
  );
}
