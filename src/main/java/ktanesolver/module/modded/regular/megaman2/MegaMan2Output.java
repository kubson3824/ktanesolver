package ktanesolver.module.modded.regular.megaman2;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record MegaMan2Output(int eTanks, List<String> password) implements ModuleOutput {}
