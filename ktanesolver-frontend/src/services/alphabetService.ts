import { api, withErrorWrapping } from "../lib/api";

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
    input: AlphabetSolveRequest
): Promise<AlphabetSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<AlphabetSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
