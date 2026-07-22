package ktanesolver.module.modded.regular.theiphone;

import java.util.List;
import java.util.Map;

import ktanesolver.logic.ModuleOutput;

public record TheIPhoneOutput(
	String instruction,
	List<Integer> pinDigits,
	String pressPosition,
	String swipeDirection,
	Integer matchScore,
	int tinderProgress,
	String pin,
	Map<String, String> cheatCodes
) implements ModuleOutput {}
