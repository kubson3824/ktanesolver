
package ktanesolver.module.modded.regular.astrology;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.utils.EnumMatrix;

public class AstrologySolver extends AbstractModuleSolver<AstrologyInput, AstrologyOutput> {

	// Simple enum matrices
	private static final EnumMatrix<AstrologyElementType, AstrologyPlanetType, Integer> ELEMENT_PLANET = new EnumMatrix<>(AstrologyElementType.class, AstrologyPlanetType.class);
	private static final EnumMatrix<AstrologyElementType, AstrologyZodiacType, Integer> ELEMENT_ZODIAC = new EnumMatrix<>(AstrologyElementType.class, AstrologyZodiacType.class);
	private static final EnumMatrix<AstrologyPlanetType, AstrologyZodiacType, Integer> PLANET_ZODIAC = new EnumMatrix<>(AstrologyPlanetType.class, AstrologyZodiacType.class);

	static {
		// Fill ELEMENT_PLANET with predefined values
		int[][] elementPlanetValues = {
			// SUN, MOON, MERCURY, VENUS, MARS, JUPITER, SATURN, URANUS, NEPTUNE, PLUTO
			{0, 0, 1, -1, 0, 1, -2, 2, 0, -1}, // FIRE
			{ -2, 0, -1, 0, 2, 0, -2, 2, 0, 1}, // WATER
			{ -1, -1, 0, -1, 1, 2, 0, 2, 1, -2}, // EARTH
			{ -1, 2, -1, 0, -2, -1, 0, 2, -2, 2} // AIR
		};

		AstrologyPlanetType[] planets = AstrologyPlanetType.values();
		int elementIndex = 0;
		for(AstrologyElementType element: AstrologyElementType.values()) {
			for(int i = 0; i < planets.length; i++) {
				ELEMENT_PLANET.put(element, planets[i], elementPlanetValues[elementIndex][i]);
			}
			elementIndex++;
		}

		int[][] elementZodiacValues = {
			//ARIES, TAURUS, GEMINI, CANCER, LEO, VIRGO, LIBRA, SCORPIO, SAGITTARIUS, CAPRICORN, AQUARIUS, PISCES
			{1, 0, -1, 0, 0, 2, 2, 0, 1, 0, 1, 0}, // FIRE
			{2, 2, -1, 2, -1, -1, -2, 1, 2, 0, 0, 2}, // WATER
			{ -2, -1, 0, 0, 1, 0, 1, 2, -1, -2, 1, 1}, // EARTH
			{1, 1, -2, -2, 2, 0, -1, 1, 0, 0, -1, -1} // AIR
		};

		elementIndex = 0;
		AstrologyZodiacType[] zodiacs = AstrologyZodiacType.values();
		for(AstrologyElementType element: AstrologyElementType.values()) {
			for(int i = 0; i < zodiacs.length; i++) {
				ELEMENT_ZODIAC.put(element, zodiacs[i], elementZodiacValues[elementIndex][i]);
			}
			elementIndex++;
		}

		int[][] planetZodiacValues = {
				{-1, -1, 2, 0, -1, 0, -1, 1, 0, 0, -2, -2},
				{-2, 0, 1, 0, 2, 0, -1, 1, 2, 0, 1, 0},
				{-2, -2, -1, -1, 1, -1, 0, -2, 0, 0, -1, 1},
				{-2, 2, -2, 0, 0, 1, -1, 0, 2, -2, -1, 1},
				{-2, 0, -1, -2, -2, -2, -1, 1, 1, 1, 0, -1},
				{-1, -2, 1, -1, 0, 0, 0, 1, 0, -1, 2, 0},
				{-1, -1, 0, 0, 1, 1, 0, 0, 0, 0, -1, -1},
				{-1, 2, 0, 0, 1, -2, 1, 0, 2, -1, 1, 0},
				{1, 0, 2, 1, -1, 1, 1, 1, 0, -2, 2, 0},
				{-1, 0, 0, -1, -2, 1, 2, 1, 1, 0, 0, -1}
		};

		int planetIndex = 0;


	}

	@Override
	protected SolveResult<AstrologyOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AstrologyInput input) {
		storeState(module, "input", input);

		// Simple lookup
		Integer value = ELEMENT_PLANET.get(AstrologyElementType.FIRE, AstrologyPlanetType.MARS);

		return success(new AstrologyOutput(value));
	}
}
