package ktanesolver.module.modded.regular.encryptedequations;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record EncryptedEquationsOutput(
        List<String> operandValues,
        boolean undefined,
        String answer,
        String twitchCommand) implements ModuleOutput {}
