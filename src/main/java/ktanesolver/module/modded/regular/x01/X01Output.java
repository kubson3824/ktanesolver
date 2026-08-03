package ktanesolver.module.modded.regular.x01;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record X01Output(int targetScore, int dartCount, String restrictions, List<String> darts)
	implements ModuleOutput {}
