package ktanesolver.module.modded.regular.sonicknuckles;
import ktanesolver.logic.ModuleInput;
public record SonicKnucklesInput(Zone zone,Sound heroSound,Sound badnikSound,Sound monitorSound,Hero hero,Badnik badnik,Monitor monitor,int score,int rings) implements ModuleInput{
 public enum Zone{MUSHROOM_HILL,FLYING_BATTERY,SANDOPOLIS,LAVA_REEF,SKY_SANCTUARY,DEATH_EGG}
 public enum Sound{BLUE_SPHERE,INVINCIBILITY_THEME,JUMP,LIGHTNING_SHIELD,BOSS_THEME,FLAG_BUMP,NOT_ENOUGH_RINGS,SPECIAL_STAGE,ANTIGRAV_FUNNEL,FLYING_BATTERY,MUSHROOM_BOUNCE,TELEPORT,BADNIK_KILL,BREATHE,LAMPPOST,SPIKES,ALARM,BRIDGE_UP,FLYING_BATTERY_ZONE_THEME,REGULAR_SHIELD,BUMPER,DROWN_WARNING,RING_CASH_IN,SPIN}
 public enum Hero{SONIC(17),TAILS(4),KNUCKLES(12);final int code;Hero(int c){code=c;}}
 public enum Badnik{BUTTERDROID(6),CLUCKOID(14),GHOST(16),SPIKE_BONKER(8),TECHNOSQUEAK(3);final int code;Badnik(int c){code=c;}}
 public enum Monitor{RUNNING_BOOTS(7),FIRE_SHIELD(13),INVINCIBILITY(2),KNUCKLES_EXTRA_LIFE(9),LIGHTNING_SHIELD(11);final int code;Monitor(int c){code=c;}}
}
