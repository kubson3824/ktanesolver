package ktanesolver.module.modded.regular.elderfuthark;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ElderFutharkOutput(
    List<String> shownRunes,
    String encryptionKey,
    List<List<String>> encryptedRunes,
    List<String> pressSequence
) implements ModuleOutput {}
