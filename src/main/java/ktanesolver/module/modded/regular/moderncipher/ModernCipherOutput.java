package ktanesolver.module.modded.regular.moderncipher;

import ktanesolver.logic.ModuleOutput;

public record ModernCipherOutput(String solution, int stage, int key, String direction) implements ModuleOutput {
}
