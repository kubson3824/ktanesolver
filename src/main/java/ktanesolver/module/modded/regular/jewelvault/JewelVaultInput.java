package ktanesolver.module.modded.regular.jewelvault;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record JewelVaultInput(List<Wheel> wheels, List<Integer> physicalWheelsByLetter) implements ModuleInput {
	public enum Jewel {
		AMETHYST, EMERALD, GLASS, ONYX, POUDRETTEITE, RUBY, SAPPHIRE, SCAPOLITE
	}

	public enum GreekLetter {
		ALPHA, BETA, GAMMA, DELTA, EPSILON, ZETA,
		ETA, THETA, IOTA, KAPPA, LAMBDA, MU,
		NU, XI, OMICRON, PI, RHO, SIGMA,
		TAU, UPSILON, PHI, CHI, PSI, OMEGA
	}

	public record Wheel(List<Jewel> jewelsClockwiseFromNorth, GreekLetter firstLetter, GreekLetter secondLetter) {}
}
