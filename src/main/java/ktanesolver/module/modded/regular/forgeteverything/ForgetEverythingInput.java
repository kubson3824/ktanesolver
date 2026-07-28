package ktanesolver.module.modded.regular.forgeteverything;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ForgetEverythingInput(
	Action action,
	Integer stage,
	String dials,
	String nixies,
	List<Color> colors
) implements ModuleInput {
	public enum Action { RECORD_STAGE, FINISH, RESET }
	public enum Color { RED, YELLOW, GREEN, BLUE }
}
