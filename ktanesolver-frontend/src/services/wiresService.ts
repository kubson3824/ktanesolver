import {api, withErrorWrapping} from "../lib/api";

export interface WiresSolveRequest {
    input: {
        wires: ("red" | "blue" | "black" | "yellow" | "white")[];
    }
}

export interface WiresSolveResponse {
    output: {
        wirePosition: number
        instruction: string;
    };
}

export const solveWires = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: WiresSolveRequest
): Promise<WiresSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<WiresSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
