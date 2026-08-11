package ktanesolver.module.modded.regular.sueetwall;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SueetWallOutput(List<String> pressCoordinates, boolean anyButtonAllowed) implements ModuleOutput {}
