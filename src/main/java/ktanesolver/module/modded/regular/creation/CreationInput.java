package ktanesolver.module.modded.regular.creation;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record CreationInput(Weather weather, List<Element> baseElements, boolean reset) implements ModuleInput {
	public enum Weather { CLEAR, HEAT_WAVE, METEOR_SHOWER, RAIN, WINDY }
	public enum Element {
		WATER, AIR, EARTH, FIRE,
		SWAMP, ENERGY, LIFE, PLASMA, BACTERIA, EGG, GHOST, WEEDS,
		BIRD, DINOSAUR, LIZARD, TURTLE, MUSHROOM, WORM, PLANKTON, SEEDS
	}
}
