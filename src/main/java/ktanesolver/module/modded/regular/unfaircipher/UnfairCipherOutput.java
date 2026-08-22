package ktanesolver.module.modded.regular.unfaircipher;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record UnfairCipherOutput(
    String keyA,
    String keyB,
    String keyC,
    int caesarOffset,
    List<String> instructions,
    List<UnfairCipherAction> actions,
    boolean instantSolve
) implements ModuleOutput {}
