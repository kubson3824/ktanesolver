import type {Module} from "./module";

export interface Bomb {
    id: string;
    serialNumber: string;
    aaBatteries: number;
    dBatteries: number;
    indicators: string[];
    ports: string[];
    modules: Module[];
}
