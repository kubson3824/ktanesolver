package ktanesolver.module.modded.regular.geneticsequence;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record GeneticSequenceOutput(
    String buttonOrder,
    String startingAminoAcid,
    List<String> aminoAcids,
    List<String> pathLabels,
    boolean templateStrand,
    String codingStrand,
    String finalSequence,
    List<Integer> pressPositions
) implements ModuleOutput {}
