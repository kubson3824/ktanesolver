package ktanesolver.module.modded.regular.gamepad;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GamepadOutput(List<String> sequence) implements ModuleOutput {
}
