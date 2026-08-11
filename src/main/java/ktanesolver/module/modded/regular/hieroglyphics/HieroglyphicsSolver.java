package ktanesolver.module.modded.regular.hieroglyphics;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.HIEROGLYPHICS,
    id = "hieroglyphics",
    name = "Hieroglyphics",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Solve three glyph equations, configure two locks, and time the seal press.",
    tags = {"symbols", "math", "timing", "logic"}
)
public class HieroglyphicsSolver extends AbstractModuleSolver<HieroglyphicsInput, HieroglyphicsOutput> {
    private static final List<String> GLYPHS = List.of("MALE","BULL","URN","EYE OF HORUS","ANKH","GOOSE","LION","WATER","HEAD OF COW","MOSAIC","LASSO","TWO REEDS","SCALES","BONE","TRIANGLE","HORN","OWL","TENT");
    private static final Set<String> GENERATED_GLYPHS = Set.copyOf(GLYPHS.subList(0, 17));
    private static final List<String> PRIORITY = GLYPHS.subList(0, 14);

    @Override
    protected SolveResult<HieroglyphicsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HieroglyphicsInput input) {
        if (input == null || input.glyphNames() == null || input.rows() == null || input.sums() == null || input.anubisGlyphs() == null || input.horusGlyphs() == null) {
            return failure("Enter five glyph names, all three rows and sums, and both lock pairs");
        }
        List<String> names = input.glyphNames().stream().map(HieroglyphicsSolver::normalizeName).toList();
        if (names.size() != 5 || names.stream().distinct().count() != 5 || names.stream().anyMatch(n -> !GENERATED_GLYPHS.contains(n))) {
            return failure("Assign A–E to five distinct glyph names from the manual");
        }
        if (input.rows().size() != 3 || input.sums().size() != 3) return failure("Enter the 3-, 4-, and 5-glyph rows and their three sums");
        List<String> rows = input.rows().stream().map(HieroglyphicsSolver::aliases).toList();
        if (rows.get(0).length() != 3 || rows.get(1).length() != 4 || rows.get(2).length() != 5 || rows.stream().anyMatch(r -> !r.matches("[A-E]+"))) {
            return failure("Row aliases must have lengths 3, 4, and 5 and use only A–E");
        }
        if (input.sums().stream().anyMatch(s -> s == null || s < 3 || s > 25)) return failure("Enter valid archaeological row sums");
        String anubis = aliases(input.anubisGlyphs()), horus = aliases(input.horusGlyphs());
        if (!anubis.matches("[A-E]{2}") || !horus.matches("[A-E]{2}")) return failure("Each lock needs exactly two aliases A–E");

        char one = rows.getFirst().charAt(0);
        List<Map<Character, Integer>> matches = new ArrayList<>();
        int[] permutation = {2,3,4,5};
        permute(permutation, 0, values -> {
            Map<Character,Integer> map = new LinkedHashMap<>(); map.put(one, 1);
            int at = 0; for (char c = 'A'; c <= 'E'; c++) if (c != one) map.put(c, values[at++]);
            boolean valid = true; for (int i = 0; i < 3; i++) if (sum(rows.get(i), map) != input.sums().get(i)) valid = false;
            if (valid) matches.add(map);
        });
        if (matches.size() != 1) return failure(matches.isEmpty() ? "Those rows and sums have no valid value assignment" : "Those rows and sums do not uniquely determine the glyph values");
        Map<Character,Integer> values = matches.getFirst();
        int av1 = values.get(anubis.charAt(0)), av2 = values.get(anubis.charAt(1));
        int hv1 = values.get(horus.charAt(0)), hv2 = values.get(horus.charAt(1));
        if (av1 == 1 || av2 == 1 || hv1 == 1 || hv2 == 1 || av1 == av2 || hv1 == hv2) return failure("Lock glyphs must be two different glyphs valued 2 through 5");
        String anubisPosition = lock(Math.min(av1,av2), Math.max(av1,av2), true);
        String horusPosition = lock(Math.min(hv1,hv2), Math.max(hv1,hv2), false);

        int priorityIndex = -1;
        for (String glyph : PRIORITY) { int index = names.indexOf(glyph); if (index >= 0) { priorityIndex = index; break; } }
        if (priorityIndex < 0) return failure("At least one of the five glyphs must occur in the manual priority list");
        char priorityAlias = (char) ('A' + priorityIndex);
        int occurrences = 1;
        for (String row : rows) occurrences += (int) row.chars().filter(c -> c == priorityAlias).count();
        occurrences += (int) (anubis + horus).chars().filter(c -> c == priorityAlias).count();
        int product = values.get(priorityAlias) * occurrences;
        Map<String,Integer> outputValues = new LinkedHashMap<>();
        for (char c='A'; c<='E'; c++) outputValues.put(String.valueOf(c), values.get(c));
        return success(new HieroglyphicsOutput(Map.copyOf(outputValues), anubisPosition, horusPosition, names.get(priorityIndex), occurrences, (product - 1) % 9 + 1));
    }

    private static String lock(int a, int b, boolean anubis) {
        String pair = "" + a + b;
        return anubis ? switch (pair) { case "23","35" -> "LEFT"; case "24","34" -> "CENTER"; default -> "RIGHT"; }
            : switch (pair) { case "25","34" -> "LEFT"; case "23","45" -> "CENTER"; default -> "RIGHT"; };
    }
    private static int sum(String row, Map<Character,Integer> values) { return row.chars().map(c -> values.get((char)c)).sum(); }
    private interface PermutationConsumer { void accept(int[] values); }
    private static void permute(int[] values, int at, PermutationConsumer consumer) {
        if (at == values.length) { consumer.accept(values.clone()); return; }
        for (int i=at;i<values.length;i++) { int t=values[at];values[at]=values[i];values[i]=t;permute(values,at+1,consumer);t=values[at];values[at]=values[i];values[i]=t; }
    }
    private static String aliases(String value) { return value == null ? "" : value.replaceAll("[^A-Ea-e]", "").toUpperCase(Locale.ROOT); }
    private static String normalizeName(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
}
