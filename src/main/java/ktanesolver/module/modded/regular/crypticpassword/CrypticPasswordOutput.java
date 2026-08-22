package ktanesolver.module.modded.regular.crypticpassword;

import ktanesolver.logic.ModuleOutput;

public record CrypticPasswordOutput(String answer, String effectiveKey, boolean reversedKey, boolean transposedTable) implements ModuleOutput {}
