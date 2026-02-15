
package ktanesolver.module.modded.regular.astrology;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.utils.EnumMatrix;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@ModuleInfo(type = ModuleType.ASTROLOGY, id = "astrology", name = "Astrology", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Determine an omen score from an element, planet and zodiac symbol.", tags = {"symbols", "poor-omen", "no-omen", "good-omen"})
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
				ELEMENT_PLANET.set(element, planets[i], elementPlanetValues[elementIndex][i]);
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
				ELEMENT_ZODIAC.set(element, zodiacs[i], elementZodiacValues[elementIndex][i]);
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
		for(AstrologyPlanetType planet: AstrologyPlanetType.values()) {
			for(int i = 0; i < zodiacs.length; i++) {
				PLANET_ZODIAC.set(planet, zodiacs[i], planetZodiacValues[planetIndex][i]);
			}
			planetIndex++;
		}


	}

	@Override
	protected SolveResult<AstrologyOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AstrologyInput input) {
		storeState(module, "input", input);

		int value = 0;
		value += ELEMENT_PLANET.get(input.element(), input.planet());
		value += ELEMENT_ZODIAC.get(input.element(), input.zodiac());
		value += PLANET_ZODIAC.get(input.planet(), input.zodiac());

		// Check for common letters with serial number and adjust value
		String serialNumber = bomb.getSerialNumber().toUpperCase();
		
		// Check element name
		String elementName = input.element().name();
		if (hasCommonLetter(elementName, serialNumber)) {
			value += 1;
		} else {
			value -= 1;
		}
		
		// Check planet name
		String planetName = input.planet().name();
		if (hasCommonLetter(planetName, serialNumber)) {
			value += 1;
		} else {
			value -= 1;
		}
		
		// Check zodiac name
		String zodiacName = input.zodiac().name();
		if (hasCommonLetter(zodiacName, serialNumber)) {
			value += 1;
		} else {
			value -= 1;
		}

		return success(new AstrologyOutput(value));
	}
	
	/**
	 * Checks if the symbol name and serial number have at least one letter in common
	 */
	private boolean hasCommonLetter(String symbolName, String serialNumber) {
		// Convert to uppercase for case-insensitive comparison
		String symbolUpper = symbolName.toUpperCase();
		
		// Check each character in the symbol name
		for (char c : symbolUpper.toCharArray()) {
			// Only check letters (skip digits and special characters)
			if (Character.isLetter(c) && serialNumber.indexOf(c) >= 0) {
				return true;
			}
		}
		return false;
	}
}
