const SYMBOLS: Record<string, { index: number; path: string }> = {
  A: { index: 90, path: "m 60,1090 a 50,50 0 0 0 0,100 50,50 0 0 0 0,-100 z m 0,10 a 40,40 0 0 1 40,40 H 20 a 40,40 0 0 1 40,-40 z" },
  B: { index: 91, path: "m 180,1090 -50,100 h 100 z" },
  C: { index: 92, path: "M 300.87695,1090.0137 A 30,30 0 0 0 270,1120 a 30,30 0 0 0 60,0 30,30 0 0 0 -29.12305,-29.9863 z M 260,1160 v 30 h 80 v -30 z" },
  D: { index: 93, path: "m 420,1090 -6.4,51.33 -19.5,-47.93 7.11,51.25 L 370,1103.4 c 15,31.6 25,51.6 25,86.6 h 50 c 0,-35 10,-55 25,-86.6 l -31.21,41.25 7.1,-51.25 -19.48,47.93 z" },
  E: { index: 100, path: "m 20,1220 v 80 h 80 v -80 z m 40,10 h 30 v 30 H 60 Z" },
  F: { index: 101, path: "m 200,1210 a 30,30 0 0 0 -27.06,42.94 l -40,40 a 10,10 0 1 0 14.12,14.12 l 40,-40 A 30,30 0 1 0 200,1210 Z" },
  G: { index: 102, path: "m 300,1210 a 20,20 0 0 0 0,40 20,20 0 0 0 0,-40 z m 0,40 a 30,30 0 0 0 0,60 30,30 0 0 0 0,-60 z m 0,10 a 20,20 0 0 1 0,40 20,20 0 0 1 0,-40 z" },
  H: { index: 103, path: "m 380,1220 v 30 h 50 v 50 h 30 v -80 z" },
  X: { index: 110, path: "M 60 1330 L 10 1380 L 60 1380 L 110 1380 L 60 1330 z M 60 1380 L 10 1430 L 110 1430 L 60 1380 z" },
  Y: { index: 111, path: "m 220,1430 v -10 h -30 l 40,-40 -50,-50 -50,50 40,40 h -30 v 10 z" },
  Z: { index: 112, path: "m 250,1330 h 100 l -40,40 v 60 h -20 v -60 z" },
};

export const PATTERN_CUBE_SYMBOLS = Object.keys(SYMBOLS);

export default function PatternCubeSymbol({ symbol, className = "h-10 w-10" }: { symbol: string; className?: string }) {
  const data = SYMBOLS[symbol.toUpperCase()];
  if (!data) return <span className={className}>{symbol}</span>;
  const x = (data.index % 10) * 120;
  const y = Math.floor(data.index / 10) * 120;
  return <svg role="img" aria-label={`Pattern Cube symbol ${symbol.toUpperCase()}`} viewBox={`${x} ${y} 120 120`} className={className}>
    <path d={data.path} fill="currentColor" />
  </svg>;
}
