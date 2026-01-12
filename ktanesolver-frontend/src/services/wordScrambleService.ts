import {api, withErrorWrapping} from "../lib/api";

export interface WordScrambleSolveRequest {
    input: {
        letters: string;
    }
}

export interface WordScrambleSolveResponse {
    output: {
        solved: boolean;
        instruction: string;
        solution: string;
    };
}

export const solveWordScramble = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: {
        input: {
            letters: string;
        }
    }
): Promise<WordScrambleSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<WordScrambleSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
