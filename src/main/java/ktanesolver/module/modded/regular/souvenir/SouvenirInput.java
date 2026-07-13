package ktanesolver.module.modded.regular.souvenir;

import java.util.List;
import java.util.UUID;

import ktanesolver.logic.ModuleInput;

public record SouvenirInput(
	UUID sourceModuleId,
	String question,
	List<String> answers,
	boolean finalQuestion
) implements ModuleInput {}
