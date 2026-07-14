package ktanesolver.module.modded.regular.ledencryption;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LedEncryptionInput(String ledColor, List<String> letters, int totalStages) implements ModuleInput {}
