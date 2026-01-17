import { api, withErrorWrapping } from "../lib/api";

export interface MorsematicsSolveRequest {
    input: {
        letters: string;
    }
}

export interface MorsematicsSolveResponse {
    output: {
        letter: string;
    };
}

export const solveMorsematics = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: MorsematicsSolveRequest
): Promise<MorsematicsSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<MorsematicsSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
