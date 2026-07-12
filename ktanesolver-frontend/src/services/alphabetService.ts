import { solveModule } from "../lib/api";

export interface AlphabetSolveRequest {
    input: {
        letters: string[];
    };
}

export interface AlphabetSolveResponse {
    output: {
        pressOrder: string[];
    };
}

export const solveAlphabet = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: AlphabetSolveRequest["input"]
): Promise<AlphabetSolveResponse> =>
    solveModule<AlphabetSolveRequest["input"], AlphabetSolveResponse>(
        roundId,
        bombId,
        moduleId,
        input,
    );
