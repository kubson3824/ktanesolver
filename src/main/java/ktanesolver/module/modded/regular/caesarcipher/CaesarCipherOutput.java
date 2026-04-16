package ktanesolver.module.modded.regular.caesarcipher;

import ktanesolver.logic.ModuleOutput;

public record CaesarCipherOutput(String solution, int offset) implements ModuleOutput {
}
