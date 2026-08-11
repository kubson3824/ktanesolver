package ktanesolver.module.modded.regular.tenbuttoncolorcode;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TenButtonColorCodeInput(Integer stage, List<String> colors) implements ModuleInput {}
