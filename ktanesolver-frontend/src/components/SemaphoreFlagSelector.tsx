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

  // Semaphore: 0°=up, 45°=up-right, 90°=right, 135°=down-right, 180°=down, 225°=down-left, 270°=left, 315°=up-left
  const angleToXY = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.sin(rad) * r, y: -Math.cos(rad) * r };
  };

  const renderSemaphoreFigure = (leftAngle: number, rightAngle: number) => {
    const armLength = 16;
    const flagSize = 7;
    const leftShoulder = { x: -2, y: 0 };
    const rightShoulder = { x: 2, y: 0 };
    const leftDir = angleToXY(leftAngle, 1);
    const rightDir = angleToXY(rightAngle, 1);
    const leftEnd = { x: leftShoulder.x + leftDir.x * armLength, y: leftShoulder.y + leftDir.y * armLength };
    const rightEnd = { x: rightShoulder.x + rightDir.x * armLength, y: rightShoulder.y + rightDir.y * armLength };

    // Square flag with diagonal red/yellow split (like reference)
    const FlagSquare = ({ x, y, angle }: { x: number; y: number; angle: number }) => {
      const rot = (angle * Math.PI) / 180; // semaphore angle
      const s = flagSize;
      // Square corners before rotation (center at origin, one corner toward pole)
      const c1 = { x: s * 0.7, y: -s * 0.7 };
      const c2 = { x: -s * 0.7, y: -s * 0.7 };
      const c3 = { x: -s * 0.7, y: s * 0.7 };
      const c4 = { x: s * 0.7, y: s * 0.7 };
      const rotate = (p: { x: number; y: number }) => ({
        x: p.x * Math.cos(rot) - p.y * Math.sin(rot),
        y: p.x * Math.sin(rot) + p.y * Math.cos(rot),
      });
      const r1 = rotate(c1);
      const r2 = rotate(c2);
      const r3 = rotate(c3);
      const r4 = rotate(c4);
      const pts = (p: { x: number; y: number }) => `${x + p.x},${y + p.y}`;
      return (
        <g>
          <polygon points={`${pts(r1)} ${pts(r2)} ${pts(r3)}`} fill="#dc2626" stroke="#1a1a1a" strokeWidth="0.4" />
          <polygon points={`${pts(r1)} ${pts(r3)} ${pts(r4)}`} fill="#eab308" stroke="#1a1a1a" strokeWidth="0.4" />
        </g>
      );
    };

    return (
      <svg viewBox="-24 -24 48 48" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Person body - black silhouette */}
        <ellipse cx="0" cy="4" rx="3" ry="5" fill="#1a1a1a" />
        <circle cx="0" cy="-5" r="4" fill="#1a1a1a" />

        {/* Left arm */}
        <line x1={leftShoulder.x} y1={leftShoulder.y} x2={leftEnd.x} y2={leftEnd.y} stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <FlagSquare x={leftEnd.x} y={leftEnd.y} angle={leftAngle} />

        {/* Right arm */}
        <line x1={rightShoulder.x} y1={rightShoulder.y} x2={rightEnd.x} y2={rightEnd.y} stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <FlagSquare x={rightEnd.x} y={rightEnd.y} angle={rightAngle} />
      </svg>
    );
  };

  const handlePositionClick = (pos: { id: string; leftFlagAngle: number; rightFlagAngle: number; letter?: string; number?: string | null; isControl?: boolean; character?: string }) => {
    if (pos.isControl) {
      // Handle control characters
      if (pos.id === 'NUMERALS') {
        setMode('numerals');
      } else if (pos.id === 'LETTERS') {
        setMode('letters');
      }
      onPositionSelect(pos.character ?? '§', pos.leftFlagAngle, pos.rightFlagAngle);
    } else {
      // Handle regular positions
      const character = mode === 'numerals' && pos.number != null ? pos.number : (pos.letter ?? '');
      onPositionSelect(character, pos.leftFlagAngle, pos.rightFlagAngle);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 flex flex-col min-h-[400px] flex-1">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-gray-400 text-sm font-medium">SELECT SEMAPHORE POSITION</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <span className={`text-xs font-bold ${mode === 'letters' ? 'text-blue-400' : 'text-green-400'}`}>
            {mode.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-4 flex-1 min-h-0 auto-rows-fr">
        {positions.map((pos) => (
          <button
            key={pos.id}
            onClick={() => handlePositionClick(pos)}
            disabled={disabled}
            className={`relative rounded-lg p-2 flex flex-col min-h-0 transition-colors ${
              pos.isControl
                ? 'bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800'
                : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800'
            } disabled:opacity-50`}
            title={`${pos.isControl ? pos.id : (mode === 'numerals' && pos.number !== null ? pos.number : pos.letter)} (${pos.leftFlagAngle}°, ${pos.rightFlagAngle}°)`}
          >
            <div className="flex-1 min-h-0 flex items-center justify-center w-full">
              {renderSemaphoreFigure(pos.leftFlagAngle, pos.rightFlagAngle)}
            </div>
            <div className="text-xs mt-1 text-center flex-shrink-0">
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
