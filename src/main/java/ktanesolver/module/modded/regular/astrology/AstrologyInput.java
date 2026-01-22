
package ktanesolver.module.modded.regular.astrology;

import ktanesolver.logic.ModuleInput;

public record AstrologyInput(AstrologyElementType element, AstrologyPlanetType planet, AstrologyZodiacType zodiac) implements ModuleInput {
}
