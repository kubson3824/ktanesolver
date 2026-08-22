package ktanesolver.module.modded.regular.lombaxcubes;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record LombaxCubesOutput(List<Integer> cubeValues, String cubeX, String cubeY, int timerDigit) implements ModuleOutput {}
