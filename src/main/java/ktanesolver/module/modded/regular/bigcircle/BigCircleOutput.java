package ktanesolver.module.modded.regular.bigcircle;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BigCircleOutput(
	Integer score,
	Integer serialIndex,
	String serialCharacter,
	List<String> pressSequence,
	boolean bobException,
	String spinDirection
) implements ModuleOutput {}
