package ktanesolver.module.modded.regular.geneticsequence;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.GENETIC_SEQUENCE,
    id = "geneticSequence",
    name = "Genetic Sequence",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Follow the amino-acid graph and decode the resulting DNA strand.",
    tags = {"dna", "sequence", "indicators", "graph"}
)
public class GeneticSequenceSolver extends AbstractModuleSolver<GeneticSequenceInput, GeneticSequenceOutput> {
    private record Edge(String label, String destination) {}

    private static final Map<String, List<Edge>> GRAPH = graph();
    private static final Map<String, String> CODONS = Map.ofEntries(
        Map.entry("Phe", "TTT"), Map.entry("Leu", "TTA"), Map.entry("Ile", "ATC"), Map.entry("Met", "ATG"),
        Map.entry("Val", "GTA"), Map.entry("Ser", "TCG"), Map.entry("Pro", "CCA"), Map.entry("Thr", "ACC"),
        Map.entry("Ala", "GCT"), Map.entry("Tyr", "TAT"), Map.entry("His", "CAT"), Map.entry("Gln", "CAG"),
        Map.entry("Asn", "AAC"), Map.entry("Lys", "AAA"), Map.entry("Asp", "GAT"), Map.entry("Glu", "GAA"),
        Map.entry("Cys", "TGC"), Map.entry("Trp", "TGG"), Map.entry("Arg", "CGC"), Map.entry("Gly", "GGG")
    );

    @Override
    protected SolveResult<GeneticSequenceOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, GeneticSequenceInput input
    ) {
        String order = input == null || input.buttonOrder() == null ? "" : input.buttonOrder().trim().toUpperCase();
        if (order.length() != 4 || !order.chars().allMatch(c -> "ATCG".indexOf(c) >= 0) || order.chars().distinct().count() != 4) {
            return failure("Button order must contain A, T, C, and G exactly once from left to right");
        }

        List<String> aminoAcids = new ArrayList<>();
        List<String> pathLabels = new ArrayList<>();
        Set<String> usedLabels = new HashSet<>();
        boolean template = false;
        aminoAcids.add(startingAminoAcid(order));
        Map<String, Boolean> indicators = bomb.getIndicators() == null ? Map.of() : bomb.getIndicators();

        for (int step = 0; step < 3; step++) {
            List<Edge> available = GRAPH.get(aminoAcids.get(step)).stream().filter(edge -> !usedLabels.contains(edge.label())).toList();
            Edge chosen = available.stream().filter(edge -> Boolean.TRUE.equals(indicators.get(edge.label()))).findFirst().orElse(null);
            if (chosen == null) {
                chosen = available.stream().filter(edge -> Boolean.FALSE.equals(indicators.get(edge.label()))).findFirst().orElse(null);
                if (chosen != null) template = !template;
            }
            if (chosen == null) chosen = available.get(0);
            usedLabels.add(chosen.label());
            pathLabels.add(chosen.label());
            aminoAcids.add(chosen.destination());
        }

        String coding = aminoAcids.stream().map(CODONS::get).reduce("", String::concat);
        String solution = template ? reverseComplement(coding) : coding;
        List<Integer> positions = solution.chars().map(c -> order.indexOf(c) + 1).boxed().toList();
        return success(new GeneticSequenceOutput(order, aminoAcids.get(0), List.copyOf(aminoAcids),
            List.copyOf(pathLabels), template, coding, solution, positions));
    }

    static String startingAminoAcid(String order) {
        if (order.equals("ACGT")) return "Trp";
        if (order.contains("ACT")) return "Gly";
        if (order.endsWith("G")) return "Tyr";
        if (order.startsWith("T")) return "Cys";
        if (order.indexOf('C') < order.indexOf('A') && order.indexOf('C') < order.indexOf('T')) return "Arg";
        if (Math.abs(order.indexOf('A') - order.indexOf('T')) == 1) return "Leu";
        if (Math.abs(order.indexOf('G') - order.indexOf('C')) == 1) return "Ala";
        return "Asn";
    }

    private static String reverseComplement(String coding) {
        StringBuilder result = new StringBuilder(coding.length());
        for (int i = coding.length() - 1; i >= 0; i--) result.append(switch (coding.charAt(i)) {
            case 'A' -> 'T'; case 'T' -> 'A'; case 'C' -> 'G'; default -> 'C';
        });
        return result.toString();
    }

    private static Map<String, List<Edge>> graph() {
        Map<String, List<Edge>> result = new LinkedHashMap<>();
        result.put("Phe", edges("BOB", "Asn", "FRQ", "Trp", "SND", "Cys"));
        result.put("Leu", edges("FRK", "His", "FRQ", "Lys", "TRN", "Val"));
        result.put("Ile", edges("FRK", "Val", "MSA", "Asn", "NSA", "Arg", "TRN", "Tyr"));
        result.put("Met", edges("CLR", "Asp", "MSA", "Arg", "TRN", "Gly"));
        result.put("Val", edges("BOB", "Ala", "FRK", "Ile", "TRN", "Leu"));
        result.put("Ser", edges("BOB", "Cys", "FRQ", "Gln", "SND", "Thr"));
        result.put("Pro", edges("CAR", "Cys", "CLR", "Asn", "FRK", "Gln"));
        result.put("Thr", edges("IND", "Lys", "MSA", "Gly", "NSA", "Glu", "SND", "Ser"));
        result.put("Ala", edges("BOB", "Val", "CAR", "Glu", "CLR", "His"));
        result.put("Tyr", edges("SIG", "His", "SND", "Lys", "TRN", "Ile"));
        result.put("His", edges("CLR", "Ala", "FRK", "Leu", "SIG", "Tyr"));
        result.put("Gln", edges("FRK", "Pro", "FRQ", "Ser", "SIG", "Arg"));
        result.put("Asn", edges("BOB", "Phe", "CLR", "Pro", "MSA", "Ile"));
        result.put("Lys", edges("FRQ", "Leu", "IND", "Thr", "SND", "Tyr"));
        result.put("Asp", edges("CLR", "Met", "IND", "Gly", "SIG", "Trp"));
        result.put("Glu", edges("CAR", "Ala", "IND", "Trp", "NSA", "Thr"));
        result.put("Cys", edges("BOB", "Ser", "CAR", "Pro", "SND", "Phe"));
        result.put("Trp", edges("FRQ", "Phe", "IND", "Glu", "SIG", "Asp"));
        result.put("Arg", edges("MSA", "Met", "NSA", "Ile", "SIG", "Gln"));
        result.put("Gly", edges("IND", "Asp", "MSA", "Thr", "TRN", "Met"));
        return Map.copyOf(result);
    }

    private static List<Edge> edges(String... values) {
        List<Edge> result = new ArrayList<>();
        for (int i = 0; i < values.length; i += 2) result.add(new Edge(values[i], values[i + 1]));
        return List.copyOf(result);
    }
}
