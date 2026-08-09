package ktanesolver.module.modded.regular.lightspeed;

import ktanesolver.logic.ModuleOutput;

public record LightspeedOutput(
	String quadrant,
	int warpSpeed,
	String planet,
	String planetClass,
	String officer,
	String officerRank,
	String encryptionCode
) implements ModuleOutput {
}
