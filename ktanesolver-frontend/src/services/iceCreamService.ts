import { solveModule } from "../lib/api";

export interface IceCreamInput {
  customer: string;
  flavors: string[];
  resetStage: boolean;
}

export interface IceCreamOutput {
  stage: number;
  flavor: string;
  flavorIndex: number;
}

export const solveIceCream = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: IceCreamInput,
) => solveModule<IceCreamInput, { output: IceCreamOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
