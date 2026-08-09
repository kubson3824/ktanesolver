package ktanesolver.module.modded.regular.knowyourway;

import ktanesolver.logic.ModuleInput;

public record KnowYourWayInput(String ledPosition, String arrowDirection, String upperButtonLabel) implements ModuleInput {}
