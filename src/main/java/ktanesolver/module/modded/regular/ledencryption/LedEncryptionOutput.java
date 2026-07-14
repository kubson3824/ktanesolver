package ktanesolver.module.modded.regular.ledencryption;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LedEncryptionOutput(int stage, List<String> correctButtons, List<String> correctLetters) implements ModuleOutput {}
