package ktanesolver.module.modded.regular.playfaircipher;

import ktanesolver.logic.ModuleOutput;

public record PlayfairCipherOutput(
	String decryptedMessage,
	String pressSequence,
	String key,
	String encryptedMessage,
	String screenColor
) implements ModuleOutput {
}
