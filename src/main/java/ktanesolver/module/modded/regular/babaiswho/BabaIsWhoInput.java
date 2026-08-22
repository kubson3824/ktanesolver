package ktanesolver.module.modded.regular.babaiswho;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record BabaIsWhoInput(List<Rule> rules, List<Button> buttons) implements ModuleInput {
	public enum Character { BABA, KEKE, ME, ROCK, FLAG, WALL }
	public enum Attribute { YOU, MOVE, DEFEAT, PUSH, WIN, STOP }
	public record Rule(Character subject, Attribute attribute) {}
	public record Button(Character character, Attribute attribute) {}
}
