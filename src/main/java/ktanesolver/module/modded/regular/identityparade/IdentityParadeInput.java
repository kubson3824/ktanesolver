package ktanesolver.module.modded.regular.identityparade;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record IdentityParadeInput(
	List<HairColor> hairColors,
	List<Build> builds,
	List<Attire> attires,
	List<Suspect> suspects
) implements ModuleInput {
	public enum HairColor { BLACK, BLONDE, BROWN, GREY, RED, WHITE }
	public enum Build { FAT, HUNCHED, MUSCULAR, SHORT, SLIM, TALL }
	public enum Attire { BLAZER, HOODIE, JUMPER, SUIT, T_SHIRT, TANK_TOP }
	public enum Suspect {
		ANDY, BEN, CHRISSIE, DYLAN, EDDIE, FIONA, GEMMA, HARRIET, IAN,
		JAMES, KAYLEIGH, LOUISE, MEGAN, NATE, OSCAR, PENNY, QUENTIN, RHIANNON
	}
}
