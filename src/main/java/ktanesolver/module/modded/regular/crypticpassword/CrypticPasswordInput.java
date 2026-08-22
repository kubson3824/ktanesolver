package ktanesolver.module.modded.regular.crypticpassword;

import ktanesolver.logic.ModuleInput;

public record CrypticPasswordInput(String startingWord, String keyWord) implements ModuleInput {}
