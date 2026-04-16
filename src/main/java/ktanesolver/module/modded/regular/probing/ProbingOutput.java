package ktanesolver.module.modded.regular.probing;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ProbingOutput(
    int redClipWire,
    int blueClipWire,
    List<Integer> redClipCandidates,
    List<Integer> blueClipCandidates,
    int redTargetFrequency,
    int blueTargetFrequency,
    String instruction
) implements ModuleOutput {
}
