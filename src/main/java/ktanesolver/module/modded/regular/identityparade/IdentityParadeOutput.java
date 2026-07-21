package ktanesolver.module.modded.regular.identityparade;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Attire;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Build;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.HairColor;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Suspect;

public record IdentityParadeOutput(Suspect suspect, HairColor hairColor, Build build, Attire attire) implements ModuleOutput {
}
