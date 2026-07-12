package ktanesolver.module.modded.regular.murder;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.murder.MurderInput.Location;
import ktanesolver.module.modded.regular.murder.MurderInput.Suspect;
import ktanesolver.module.modded.regular.murder.MurderInput.Weapon;

public record MurderOutput(Suspect suspect, Weapon weapon, Location location) implements ModuleOutput {
}
