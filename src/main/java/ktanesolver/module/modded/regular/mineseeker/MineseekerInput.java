package ktanesolver.module.modded.regular.mineseeker;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MineseekerInput(String startImage, String backgroundColor, List<Integer> twoFactorCodes) implements ModuleInput {}
