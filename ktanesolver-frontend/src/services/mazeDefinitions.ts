import type { Cell } from "./mazeService";

/** Wall between (r,c) and (r,c+1). verticalWalls[row][col] = right edge of cell (row+1, col+1). 6 rows x 5 cols. */
/** Wall between (r,c) and (r+1,c). horizontalWalls[row][col] = bottom edge of cell (row+1, col+1). 5 rows x 6 cols. */
export interface MazeDefinition {
  markers: [Cell, Cell];
  verticalWalls: boolean[][];
  horizontalWalls: boolean[][];
}

function cellEqual(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

function mazeMarkersMatch(maze: MazeDefinition, m1: Cell, m2: Cell): boolean {
  const [a, b] = maze.markers;
  return (cellEqual(a, m1) && cellEqual(b, m2)) || (cellEqual(a, m2) && cellEqual(b, m1));
}

const MAZES: MazeDefinition[] = [
  {
    markers: [{ row: 2, col: 1 }, { row: 3, col: 6 }],
    verticalWalls: [
      [false, false, true, false, false],
      [true, false, true, false, false],
      [true, false, true, false, false],
      [true, false, false, true, false],
      [false, false, true, false, true],
      [false, true, false, true, false],
    ],
    horizontalWalls: [
      [false, true, false, false, true, true],
      [false, false, true, true, true, false],
      [false, true, false, false, true, false],
      [false, true, true, true, true, false],
      [false, true, false, false, true, false],
    ],
  },
  {
    markers: [{ row: 2, col: 5 }, { row: 4, col: 2 }],
    verticalWalls: [
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, true, false, false],
      [false, true, false, true, true],
      [true, true, true, false, true],
      [true, false, true, false, false],
    ],
    horizontalWalls: [
      [true, false, true, false, false, true],
      [false, true, false, true, true, false],
      [false, false, true, false, true, false],
      [false, true, false, true, false, false],
      [false, false, false, false, true, false],
    ],
  },
  {
    markers: [{ row: 4, col: 4 }, { row: 4, col: 6 }],
    verticalWalls: [
      [false, false, true, true, false],
      [true, true, true, false, true],
      [false, true, true, false, true],
      [true, true, true, true, true],
      [true, false, true, true, true],
      [false, false, false, true, false],
    ],
    horizontalWalls: [
      [false, true, false, false, false, false],
      [true, false, false, true, true, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, true, true, false, false, false],
    ],
  },
  {
    markers: [{ row: 1, col: 1 }, { row: 4, col: 1 }],
    verticalWalls: [
      [false, true, false, false, false],
      [true, true, false, false, false],
      [true, false, true, false, true],
      [true, false, false, false, false],
      [false, false, false, false, true],
      [false, false, true, false, true],
    ],
    horizontalWalls: [
      [false, false, true, true, true, false],
      [false, false, false, true, true, false],
      [false, true, true, false, true, false],
      [false, true, true, true, true, false],
      [false, true, true, true, false, false],
    ],
  },
  {
    markers: [{ row: 3, col: 5 }, { row: 6, col: 4 }],
    verticalWalls: [
      [false, false, false, false, false],
      [false, false, false, false, true],
      [false, true, false, true, false],
      [true, false, false, true, true],
      [true, false, false, false, true],
      [true, false, false, false, false],
    ],
    horizontalWalls: [
      [true, true, true, true, false, false],
      [false, true, true, false, true, true],
      [false, false, true, true, false, false],
      [false, true, true, false, true, false],
      [false, false, true, true, true, false],
    ],
  },
  {
    markers: [{ row: 1, col: 5 }, { row: 5, col: 3 }],
    verticalWalls: [
      [true, false, true, false, false],
      [true, true, true, false, true],
      [false, true, true, true, false],
      [false, true, false, true, true],
      [false, true, true, true, false],
      [false, false, false, true, false],
    ],
    horizontalWalls: [
      [false, false, false, true, false, false],
      [false, false, false, false, true, false],
      [false, true, true, false, false, true],
      [true, false, false, false, false, false],
      [false, true, true, false, true, false],
    ],
  },
  {
    markers: [{ row: 1, col: 2 }, { row: 6, col: 2 }],
    verticalWalls: [
      [false, false, false, true, false],
      [true, false, true, false, true],
      [false, true, false, true, false],
      [false, true, false, false, true],
      [true, true, false, false, true],
      [false, false, false, false, false],
    ],
    horizontalWalls: [
      [false, true, true, false, false, false],
      [false, false, true, true, true, false],
      [true, true, false, true, false, true],
      [false, false, false, true, true, false],
      [false, true, true, true, false, false],
    ],
  },
  {
    markers: [{ row: 1, col: 4 }, { row: 4, col: 3 }],
    verticalWalls: [
      [true, false, false, true, false],
      [false, false, true, false, true],
      [true, false, false, false, true],
      [true, false, true, false, false],
      [true, true, false, false, false],
      [false, false, false, false, false],
    ],
    horizontalWalls: [
      [false, false, true, false, false, false],
      [false, true, true, true, true, false],
      [false, false, true, true, false, false],
      [false, true, false, true, true, true],
      [false, false, true, true, true, true],
    ],
  },
  {
    markers: [{ row: 2, col: 3 }, { row: 5, col: 1 }],
    verticalWalls: [
      [true, false, false, false, false],
      [true, true, false, true, true],
      [false, false, true, false, true],
      [true, true, false, true, false],
      [true, true, true, false, true],
      [false, true, false, true, false],
    ],
    horizontalWalls: [
      [false, false, true, true, false, false],
      [false, false, false, true, false, false],
      [false, true, true, false, true, false],
      [false, false, false, true, true, false],
      [false, false, false, false, false, true],
    ],
  },
];

export function findMaze(marker1: Cell, marker2: Cell): MazeDefinition | null {
  return MAZES.find((m) => mazeMarkersMatch(m, marker1, marker2)) ?? null;
}
