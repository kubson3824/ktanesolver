import { api, withErrorWrapping } from "../lib/api";

export interface ZooInput {
  firstAnimal: string;
  secondAnimal: string;
}

export interface ZooOutput {
  animals: string[];
}

export const solveZoo = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ZooInput,
): Promise<{ output?: ZooOutput; reason?: string }> => withErrorWrapping(async () => {
  const response = await api.post<{ output?: ZooOutput; reason?: string }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
