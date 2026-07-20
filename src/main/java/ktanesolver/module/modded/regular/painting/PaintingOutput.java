package ktanesolver.module.modded.regular.painting;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PaintingOutput(String ruleset, boolean creativityRule, List<Repaint> repaints) implements ModuleOutput {
	public record Repaint(int region, String label, String from, String to) {}
}
