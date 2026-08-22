package ktanesolver.module.modded.regular.lombaxcubes;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record LombaxCubesInput(String buttonLetters, String buttonColor, List<String> cubeFaces) implements ModuleInput {}
