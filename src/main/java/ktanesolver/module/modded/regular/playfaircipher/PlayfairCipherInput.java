package ktanesolver.module.modded.regular.playfaircipher;

import ktanesolver.logic.ModuleInput;

public record PlayfairCipherInput(String encryptedMessage, String screenColor, String dayOfWeek) implements ModuleInput {
}
