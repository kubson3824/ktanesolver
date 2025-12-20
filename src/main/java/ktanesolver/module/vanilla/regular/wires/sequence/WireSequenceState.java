
package ktanesolver.module.vanilla.regular.wires.sequence;

import java.util.List;

public record WireSequenceState(int red, int blue, int black, List<WireSequenceCombo> history) {
}
