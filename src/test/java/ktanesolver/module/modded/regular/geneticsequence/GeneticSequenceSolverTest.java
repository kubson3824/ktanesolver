package ktanesolver.module.modded.regular.geneticsequence;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class GeneticSequenceSolverTest {
    private final GeneticSequenceSolver solver = new GeneticSequenceSolver();

    @Test void followsUnusedDefaultPathsAndDecodesTheCodingStrand() {
        GeneticSequenceOutput output = solve("ACGT", Map.of());
        assertThat(output.aminoAcids()).containsExactly("Trp", "Phe", "Asn", "Pro");
        assertThat(output.pathLabels()).containsExactly("FRQ", "BOB", "CLR");
        assertThat(output.templateStrand()).isFalse();
        assertThat(output.finalSequence()).isEqualTo("TGGTTTAACCCA");
        assertThat(output.pressPositions()).containsExactly(4, 3, 3, 4, 4, 4, 1, 1, 2, 2, 2, 1);
    }

    @Test void prefersLitThenUnlitIndicatorsAndReverseComplementsAfterAnOddUnlitPathCount() {
        Map<String, Boolean> indicators = new LinkedHashMap<>();
        indicators.put("FRQ", false);
        GeneticSequenceOutput output = solve("ACGT", indicators);
        assertThat(output.pathLabels()).containsExactly("FRQ", "BOB", "CLR");
        assertThat(output.templateStrand()).isTrue();
        assertThat(output.codingStrand()).isEqualTo("TGGTTTAACCCA");
        assertThat(output.finalSequence()).isEqualTo("TGGGTTAAACCA");
    }

    @Test void coversEveryStartingAminoAcidRuleAndRejectsInvalidOrders() {
        assertThat(GeneticSequenceSolver.startingAminoAcid("GACT")).isEqualTo("Gly");
        assertThat(GeneticSequenceSolver.startingAminoAcid("ATCG")).isEqualTo("Tyr");
        assertThat(GeneticSequenceSolver.startingAminoAcid("TGAC")).isEqualTo("Cys");
        assertThat(GeneticSequenceSolver.startingAminoAcid("CGAT")).isEqualTo("Arg");
        assertThat(GeneticSequenceSolver.startingAminoAcid("GATC")).isEqualTo("Leu");
        assertThat(GeneticSequenceSolver.startingAminoAcid("AGCT")).isEqualTo("Ala");
        assertThat(GeneticSequenceSolver.startingAminoAcid("AGTC")).isEqualTo("Asn");
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new GeneticSequenceInput("AATG"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private GeneticSequenceOutput solve(String order, Map<String, Boolean> indicators) {
        BombEntity bomb = new BombEntity();
        bomb.setIndicators(indicators);
        return ((SolveSuccess<GeneticSequenceOutput>) solver.solve(
            new RoundEntity(), bomb, new ModuleEntity(), new GeneticSequenceInput(order))).output();
    }
}
