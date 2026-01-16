import { api, withErrorWrapping } from "../lib/api";

export interface OrientationCubeSolveRequest {
    input: {
        initialFace: "LEFT" | "RIGHT" | "FRONT" | "BACK";
        updatedFace?: "LEFT" | "RIGHT" | "FRONT" | "BACK" | null;
    }
}

export interface OrientationCubeSolveResponse {
    output: {
        rotations: ("ROTATE_LEFT" | "ROTATE_RIGHT" | "ROTATE_CLOCKWISE" | "ROTATE_COUNTERCLOCKWISE")[];
        needsUpdatedFace: boolean;
    };
}

export const solveOrientationCube = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: OrientationCubeSolveRequest
): Promise<OrientationCubeSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<OrientationCubeSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
