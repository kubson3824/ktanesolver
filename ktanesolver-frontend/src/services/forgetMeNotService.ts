import { api, withErrorWrapping } from "../lib/api";

export interface ForgetMeNotSolveRequest {
    input: {
        display: number;
        stage: number;
        allModulesCompleted: boolean;
    }
}

export interface ForgetMeNotSolveResponse {
    output: {
        sequence: number[];
    };
}

export const solveForgetMeNot = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: ForgetMeNotSolveRequest
): Promise<ForgetMeNotSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<ForgetMeNotSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
