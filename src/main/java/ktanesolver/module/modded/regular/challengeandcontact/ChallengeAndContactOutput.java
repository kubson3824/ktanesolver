package ktanesolver.module.modded.regular.challengeandcontact;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ChallengeAndContactOutput(
    int stage, String answer, String decodedPrefix, List<String> displayedLetters
) implements ModuleOutput {}
