package ktanesolver.module.modded.regular.mafia;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MafiaInput(
	List<Suspect> suspects,
	double startingTimeMinutes,
	List<String> additionalModuleNames,
	int additionalPortCount,
	boolean hasTwoFactor,
	boolean hasColoredIndicator,
	boolean hasHdmiPort,
	boolean hasVgaPort,
	boolean hasAdditionalNeedyModule
) implements ModuleInput {
	public enum Suspect {
		ROB, TIM, MARY, BRIANE, HUNTER, MACY, JOHN, WILL, LACY, CLAIRE,
		KENNY, RICK, WALTER, BONNIE, LUKE, BILL, SARAH, LARRY, KATE, STACY,
		DIANE, MAC, JIM, CLYDE, TOMMY, LENNY, MOLLY, BENNY, PHIL, BOB,
		GARY, TED, KIM, NATE, CHER, RON, THOMAS, SAM, DUKE, JACK,
		ED, RONNY, TERRY, CLAIRA, NICK, COB, ASH, DON, JERRY, SIMON
	}
}
