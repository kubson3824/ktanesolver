package ktanesolver.module.modded.regular.sevendeadlysins;

import java.util.List;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.sevendeadlysins.SevenDeadlySinsInput.Sin;

public record SevenDeadlySinsOutput(
    List<Sin> pressSequence,
    List<Integer> pressPositions,
    String twitchCommand
) implements ModuleOutput {}
