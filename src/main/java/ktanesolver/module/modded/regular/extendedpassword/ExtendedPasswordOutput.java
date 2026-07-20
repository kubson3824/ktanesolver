package ktanesolver.module.modded.regular.extendedpassword;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ExtendedPasswordOutput(List<String> possibleWords, boolean resolved) implements ModuleOutput {
}
