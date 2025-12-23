import {api, withErrorWrapping} from "../lib/api";

export interface ButtonSolveRequest {
    input: {
        color: "red" | "blue" | "white" | "yellow";
        label: "abort" | "detonate" | "hold" | "press";
        stripColor?: "blue" | "white" | "yellow" | null;
    }
}

export interface ButtonSolveResponse {
    output: {
        hold: boolean;
        instruction: string;
        releaseDigit: number | null;
    };
}

export const solveButton = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: {
        input: {
            color: "RED" | "BLUE" | "WHITE" | "YELLOW";
            label: "ABORT" | "DETONATE" | "HOLD" | "PRESS";
            stripColor: "BLUE" | "WHITE" | "YELLOW" | null | undefined
        }
    }
): Promise<ButtonSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<ButtonSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
