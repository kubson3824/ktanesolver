import {api, withErrorWrapping} from "../lib/api";

export interface ConnectionCheckSolveRequest {
    input: {
        pairs: {
            one: number;
            two: number;
        }[];
    }
}

export interface ConnectionCheckSolveResponse {
    output: {
        led1: boolean;
        led2: boolean;
        led3: boolean;
        led4: boolean;
    };
}

export const solveConnectionCheck = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: ConnectionCheckSolveRequest
): Promise<ConnectionCheckSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<ConnectionCheckSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
