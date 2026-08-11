package ktanesolver.module.modded.regular.tenbuttoncolorcode;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TenButtonColorCodeOutput(
    int stage, List<String> targetColors, List<Integer> presses
) implements ModuleOutput {}
