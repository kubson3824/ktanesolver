import type {Bomb} from "./bomb";

export interface Round {
    id: string;
    bombs: Bomb[];
}
