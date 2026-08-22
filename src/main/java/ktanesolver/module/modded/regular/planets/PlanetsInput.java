package ktanesolver.module.modded.regular.planets;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record PlanetsInput(String planet, List<String> stripColors, int productFactorOne, int productFactorTwo) implements ModuleInput {}
