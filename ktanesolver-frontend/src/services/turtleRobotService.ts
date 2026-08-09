import { solveModule } from "../lib/api";

export interface TurtleRobotOutput {
  shape: string;
  bugLines: number[];
}

export const solveTurtleRobot = (
  roundId: string,
  bombId: string,
  moduleId: string,
  commands: string[],
) => solveModule<{ commands: string[] }, { output: TurtleRobotOutput; solved: boolean }>(
  roundId,
  bombId,
  moduleId,
  { commands },
);
