package ktanesolver.module.modded.regular.complexkeypad;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ComplexKeypadInput(List<Symbol> symbols) implements ModuleInput {
	public enum Symbol {
		ALPHA, EPSILON, THETA, PSI, MU, XI, ZETA, SIGMA, BETA, UPPER_DELTA,
		PI, OMEGA, LOWER_DELTA, GAMMA, ETA, ARABIC_MEEM, HORSESHOE, KAPPA,
		PHI, HEBREW_NUN, ARABIC_NOON
	}
}
