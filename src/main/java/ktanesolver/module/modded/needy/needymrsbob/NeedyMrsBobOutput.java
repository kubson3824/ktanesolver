package ktanesolver.module.modded.needy.needymrsbob;

import ktanesolver.logic.ModuleOutput;

public record NeedyMrsBobOutput(String response, int responsePosition, String instruction) implements ModuleOutput {}
