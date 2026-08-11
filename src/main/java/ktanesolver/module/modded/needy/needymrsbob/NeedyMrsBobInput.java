package ktanesolver.module.modded.needy.needymrsbob;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record NeedyMrsBobInput(Integer message, Integer receivedEmoji, List<String> responseOrder) implements ModuleInput {}
