import { api, withErrorWrapping } from "../lib/api";

export interface LetterKeysSolveRequest {
    input: {
        number: number;
    }
}

export interface LetterKeysSolveResponse {
    output: {
        letter: string;
    };
}

export const solveLetterKeys = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: LetterKeysSolveRequest
): Promise<LetterKeysSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<LetterKeysSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
