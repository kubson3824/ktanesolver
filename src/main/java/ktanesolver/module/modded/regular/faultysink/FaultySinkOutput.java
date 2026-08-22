package ktanesolver.module.modded.regular.faultysink;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FaultySinkOutput(List<String> actions, String instruction, String twitchCommand) implements ModuleOutput {}
