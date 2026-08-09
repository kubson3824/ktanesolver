package ktanesolver.module.modded.regular.lightspeed;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LightspeedInput(
	Symbol symbol,
	SymbolColor symbolColor,
	Point greenPoint,
	Integer antimatter,
	Integer dilithium,
	Integer shields,
	Integer stardate,
	Integer subStardate,
	List<String> planets,
	List<String> officers
) implements ModuleInput {
	public enum Symbol { C, L, P }
	public enum SymbolColor { YELLOW, ORANGE, PURPLE }
	public enum Point { NW, NE, SE, SW }
}
