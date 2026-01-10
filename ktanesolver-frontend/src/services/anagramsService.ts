import {api, withErrorWrapping} from "../lib/api";

export interface AnagramsSolveRequest {
    input: {
        displayWord: string;
    }
}

export interface AnagramsSolveResponse {
    output: {
        possibleSolutions: string[];
    };
}

export const solveAnagrams = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: {
        input: {
            displayWord: string;
        }
    }
): Promise<AnagramsSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<AnagramsSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
