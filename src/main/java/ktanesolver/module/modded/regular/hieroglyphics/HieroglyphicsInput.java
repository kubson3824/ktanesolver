package ktanesolver.module.modded.regular.hieroglyphics;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HieroglyphicsInput(
    List<String> glyphNames, List<String> rows, List<Integer> sums, String anubisGlyphs, String horusGlyphs
) implements ModuleInput {}
