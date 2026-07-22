package ktanesolver.module.modded.regular.theiphone;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TheIPhoneInput(
	Action action,
	List<String> characters,
	List<Message> messages,
	Integer photoDigit,
	TinderProfile tinder,
	Integer pinPosition,
	Integer pinDigit
) implements ModuleInput {
	public enum Action { ANGRY_BIRDS, MESSAGES, PHOTOS, TINDER, RECORD_DIGIT, RESET_TINDER, CHEAT_CODES }
	public record Message(String sender, String style, int digit) {}
	public record TinderProfile(String name, int age, String starSign, String hobby, String pet) {}
}
