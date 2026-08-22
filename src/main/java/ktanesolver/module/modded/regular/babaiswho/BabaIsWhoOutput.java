package ktanesolver.module.modded.regular.babaiswho;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Attribute;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Character;

public record BabaIsWhoOutput(int position, Character character, Attribute attribute, Integer appliedRule, boolean defeatShifted) implements ModuleOutput {}
