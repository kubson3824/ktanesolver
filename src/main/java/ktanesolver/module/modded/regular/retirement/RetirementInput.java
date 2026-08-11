package ktanesolver.module.modded.regular.retirement;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record RetirementInput(List<String> homes) implements ModuleInput {}
