package ktanesolver.module.modded.regular.threedtunnels;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ThreeDTunnelsOutput(
	int stage,
	String targetSymbol,
	List<String> actions,
	boolean localizationStep,
	int candidateCount
) implements ModuleOutput {}
