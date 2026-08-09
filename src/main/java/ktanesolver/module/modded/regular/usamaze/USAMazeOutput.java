package ktanesolver.module.modded.regular.usamaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record USAMazeOutput(List<String> route, List<String> presses) implements ModuleOutput {}
