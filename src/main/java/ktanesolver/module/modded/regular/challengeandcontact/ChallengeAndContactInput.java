package ktanesolver.module.modded.regular.challengeandcontact;

import ktanesolver.logic.ModuleInput;

public record ChallengeAndContactInput(Integer stage, String clue, String displayedLetter) implements ModuleInput {}
