package ktanesolver.module.modded.regular.faultysink;

import ktanesolver.logic.ModuleInput;

public record FaultySinkInput(Fault fault, Material knobMaterial, Material faucetMaterial, Material pipeMaterial,
	Control missingKnob, Control textureSource, Control hotReplacement, Rotation rotation,
	Control spinningControl, int completedCorrectKnobs) implements ModuleInput {
	public enum Fault { BLACK_DRAIN, BLUE_DRAIN, PINK_TEXTURE, ALL_BLACK, UPSIDE_DOWN }
	public enum Material { COPPER, STAINLESS_STEEL, GOLD_PLATED, PVC }
	public enum Control { COLD, HOT, FAUCET, PIPE, BASIN }
	public enum Rotation { NONE, AFTER_THREE_CORRECT, CLOCKWISE, COUNTERCLOCKWISE }
}
