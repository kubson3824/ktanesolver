import { solveModule } from "../lib/api";

export const POLYHEDRAL_MAZE_SOLIDS = [
  { name: "4-Truncated Deltoidal Icositetrahedron", faces: 42 },
  { name: "Chamfered Dodecahedron", faces: 42 },
  { name: "Chamfered Icosahedron", faces: 50 },
  { name: "Deltoidal Hexecontahedron", faces: 60 },
  { name: "Disdyakis Dodecahedron", faces: 48 },
  { name: "Joined Snub Cube (laevo)", faces: 60 },
  { name: "Joined Rhombicuboctahedron", faces: 48 },
  { name: "Pentagonal Hexecontahedron (laevo)", faces: 60 },
  { name: "Orthokis Propello Cube", faces: 48 },
  { name: "Pentakis Dodecahedron", faces: 60 },
  { name: "Rectified Rhombicuboctahedron", faces: 50 },
  { name: "Triakis Icosahedron", faces: 60 },
  { name: "Rhombicosidodecahedron", faces: 62 },
  { name: "Canonical Rectified Snub Cube (laevo)", faces: 62 },
] as const;

export const POLYHEDRAL_MAZE_START_FACES = [0, 13, 15, 29, 31, 35] as const;

export interface PolyhedralMazeInput {
  polyhedron: string;
  startFace: number;
  destinationFace: number;
}

export interface PolyhedralMazeOutput {
  route: number[];
  relativeDirections: number[];
}

export const solvePolyhedralMaze = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PolyhedralMazeInput,
) => solveModule<PolyhedralMazeInput, { output: PolyhedralMazeOutput; solved: boolean }>(roundId, bombId, moduleId, input);
