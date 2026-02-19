package ktanesolver.module.modded.regular.cryptography;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record CryptographyOutput(String plaintext, List<String> keyOrder) implements ModuleOutput {
}
