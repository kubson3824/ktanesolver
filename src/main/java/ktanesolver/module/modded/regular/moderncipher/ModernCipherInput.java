package ktanesolver.module.modded.regular.moderncipher;

import ktanesolver.logic.ModuleInput;

public record ModernCipherInput(String ciphertext, int strikesAtGeneration, int solvedModulesAtGeneration) implements ModuleInput {
}
