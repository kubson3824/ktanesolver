import { solveModule } from "../lib/api";
export const SONIC_ZONES=["MUSHROOM_HILL","FLYING_BATTERY","SANDOPOLIS","LAVA_REEF","SKY_SANCTUARY","DEATH_EGG"] as const;
export const SONIC_SOUNDS=["BLUE_SPHERE","INVINCIBILITY_THEME","JUMP","LIGHTNING_SHIELD","BOSS_THEME","FLAG_BUMP","NOT_ENOUGH_RINGS","SPECIAL_STAGE","ANTIGRAV_FUNNEL","FLYING_BATTERY","MUSHROOM_BOUNCE","TELEPORT","BADNIK_KILL","BREATHE","LAMPPOST","SPIKES","ALARM","BRIDGE_UP","FLYING_BATTERY_ZONE_THEME","REGULAR_SHIELD","BUMPER","DROWN_WARNING","RING_CASH_IN","SPIN"] as const;
export const SONIC_HEROES=["SONIC","TAILS","KNUCKLES"] as const;export const SONIC_BADNIKS=["BUTTERDROID","CLUCKOID","GHOST","SPIKE_BONKER","TECHNOSQUEAK"] as const;export const SONIC_MONITORS=["RUNNING_BOOTS","FIRE_SHIELD","INVINCIBILITY","KNUCKLES_EXTRA_LIFE","LIGHTNING_SHIELD"] as const;
export interface SonicKnucklesOutput{object:string;ringSecond:number;hitsRequired:number;firstHitParity:string;finalHitParity:string}
export const solveSonicKnuckles=(roundId:string,bombId:string,moduleId:string,input:Record<string,unknown>):Promise<{output:SonicKnucklesOutput;solved:boolean}>=>(solveModule(roundId,bombId,moduleId,input));
