package ktanesolver.module.modded.regular.cryptography;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record CryptographyInput(String ciphertext, List<String> keyLetters) implements ModuleInput {
}
