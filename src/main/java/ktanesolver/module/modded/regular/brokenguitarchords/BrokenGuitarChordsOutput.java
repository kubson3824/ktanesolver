package ktanesolver.module.modded.regular.brokenguitarchords;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record BrokenGuitarChordsOutput(String chord, int brokenString, List<String> positions, List<String> notes) implements ModuleOutput {}
