package ktanesolver.module.modded.regular.unfaircipher;

import ktanesolver.logic.ModuleInput;

public record UnfairCipherInput(String encryptedMessage, int moduleId, int strikeCount) implements ModuleInput {}
