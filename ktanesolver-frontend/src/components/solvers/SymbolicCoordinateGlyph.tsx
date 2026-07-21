import type { SVGProps } from "react";
import { SYMBOLIC_COORDINATE_SYMBOL_LABELS, type SymbolicCoordinateSymbol } from "../../services/symbolicCoordinatesService";

export function SymbolicCoordinateGlyph({ symbol, ...props }: { symbol: SymbolicCoordinateSymbol } & SVGProps<SVGSVGElement>) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const };
  return <svg viewBox="0 0 100 100" role="img" aria-label={`${SYMBOLIC_COORDINATE_SYMBOL_LABELS[symbol]} symbol`} {...props}>
    {symbol === "A" && <path {...common} strokeWidth="12" d="M91 48C91 25 73 8 50 8S9 26 9 50s19 42 42 42c20 0 36-15 36-34 0-17-13-30-30-30-15 0-26 11-26 25 0 12 10 22 22 22 10 0 18-8 18-18 0-8-7-15-15-15-7 0-12 5-12 12" />}
    {symbol === "C" && <><path fill="currentColor" d="M16 11c-8 11-12 24-12 39 0 25 20 46 46 46s46-21 46-46c0-15-4-28-12-39v35c0 19-15 34-34 34S16 65 16 46V11Z" /><circle cx="50" cy="35" r="15" fill="currentColor" /></>}
    {symbol === "E" && <g {...common} strokeWidth="10">
      <path d="M11 20c19-9 28 8 43 8s21-16 36-8" />
      <path d="M5 35c22-10 31 9 49 9s23-18 41-8" />
      <path d="M4 51c21-10 31 9 50 9s23-18 42-8" />
      <path d="M7 67c19-9 29 9 47 9s22-16 38-8" />
      <path d="M17 82c15-7 24 7 38 7s18-12 29-7" />
    </g>}
    {symbol === "L" && <g fill="currentColor">{Array.from({ length: 14 }, (_, index) => <path key={index} transform={`rotate(${index * 360 / 14} 50 50)`} d="M50 50C57 27 70 13 92 9 75 25 64 39 50 50Z" />)}</g>}
    {symbol === "P" && <g {...common} strokeWidth="12">
      <path d="M78 16a41 41 0 0 1 3 65 41 41 0 0 1-65-3" />
      <path d="M22 84a41 41 0 0 1-3-65 41 41 0 0 1 65 3" />
      <path strokeWidth="9" d="M64 33a22 22 0 0 1 3 34 22 22 0 0 1-34-3" />
      <path strokeWidth="9" d="M36 67a22 22 0 0 1-3-34 22 22 0 0 1 34 3" />
    </g>}
  </svg>;
}
