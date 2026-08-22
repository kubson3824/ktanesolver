package ktanesolver.module.modded.regular.colorfulinsanity;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.COLORFUL_INSANITY,
    id = "ColorfulInsanity",
    name = "Colorful Insanity",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Find the reversed and identical pattern pairs, then filter all 35 buttons through both tables.",
    tags = {"colors", "patterns", "grid", "buttons", "pairs"}
)
public class ColorfulInsanitySolver extends AbstractModuleSolver<ColorfulInsanityInput, ColorfulInsanityOutput> {
    private static final List<String> COLORS = List.of("RED", "ORANGE", "YELLOW", "GREEN", "CYAN", "AZURE", "BLUE", "MAGENTA", "PURPLE");
    private static final String[][] COLOR_TABLE = {
        {"YP", "PY", "CRO", "Y", "AG", "P", "RCY", "OP", "C"},
        {"MR", "BOP", "PMC", "AR", "MYB", "GR", "CBA", "OA", "OB"},
        {"BR", "YR", "AP", "YA", "PCA", "PRO", "BCG", "YG", "OG"},
        {"RAB", "GMR", "CYO", "CR", "RA", "PMA", "YO", "GMC", "MAP"},
        {"YM", "GM", "MG", "MBC", "AM", "YBM", "MP", "AG", "RYG"},
        {"ARM", "P", "OM", "AGO", "BG", "OP", "MB", "RG", "PB"},
        {"YP", "BCR", "RYO", "RYP", "OCR", "MGP", "BAG", "PA", "YBG"},
        {"AP", "A", "MP", "CRY", "YOC", "A", "MR", "GB", "BP"},
        {"YB", "BA", "AP", "MB", "MAP", "OB", "COP", "BR", "AP"}
    };

    @Override
    protected SolveResult<ColorfulInsanityOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ColorfulInsanityInput input
    ) {
        if (input == null || input.buttons() == null || input.buttons().size() != 35) return failure("Enter all 35 buttons");
        List<ColorfulInsanityButton> buttons = new ArrayList<>(35);
        for (ColorfulInsanityButton button : input.buttons()) {
            if (button == null || button.patternCell() < 0 || button.patternCell() > 24) return failure("Every pattern cell must be between A1 and E5");
            String black = normalize(button.blackRegionColor()), other = normalize(button.otherRegionColor());
            if (!COLORS.contains(black) || !COLORS.contains(other) || black.equals(other)) return failure("Each button needs two different valid colors");
            buttons.add(new ColorfulInsanityButton(button.patternCell(), black, other));
        }
        List<int[]> identical = pairs(buttons, false), reversed = pairs(buttons, true);
        if (identical.size() != 1) return failure("The grid must contain exactly one identical pair");
        if (reversed.size() != 1) return failure("The grid must contain exactly one reversed-color pair");
        int[] identicalPair = identical.getFirst(), reversedPair = reversed.getFirst();

        int patternCell = buttons.get(reversedPair[0]).patternCell();
        List<Integer> allowedPatterns = adjacentCells(patternCell);
        ColorfulInsanityButton colorKey = buttons.get(identicalPair[0]);
        String letters = COLOR_TABLE[COLORS.indexOf(colorKey.blackRegionColor())][COLORS.indexOf(colorKey.otherRegionColor())];
        List<String> allowedColors = letters.chars().mapToObj(ColorfulInsanitySolver::colorForLetter).toList();
        List<Integer> presses = new ArrayList<>();
        for (int index = 0; index < buttons.size(); index++) {
            ColorfulInsanityButton button = buttons.get(index);
            if (allowedPatterns.contains(button.patternCell()) && (allowedColors.isEmpty()
                || allowedColors.contains(button.blackRegionColor()) || allowedColors.contains(button.otherRegionColor()))) presses.add(index);
        }
        boolean fallback = presses.isEmpty();
        if (fallback) {
            presses.add(identicalPair[0]); presses.add(identicalPair[1]);
            presses.add(reversedPair[0]); presses.add(reversedPair[1]);
            presses.sort(Integer::compareTo);
        }
        return success(new ColorfulInsanityOutput(
            coordinates(reversedPair), coordinates(identicalPair), allowedPatterns, allowedColors,
            presses.stream().map(ColorfulInsanitySolver::coordinate).toList(), fallback));
    }

    private static List<int[]> pairs(List<ColorfulInsanityButton> buttons, boolean reversed) {
        List<int[]> result = new ArrayList<>();
        for (int first = 0; first < buttons.size(); first++) for (int second = first + 1; second < buttons.size(); second++) {
            ColorfulInsanityButton a = buttons.get(first), b = buttons.get(second);
            boolean match = a.patternCell() == b.patternCell() && (reversed
                ? a.blackRegionColor().equals(b.otherRegionColor()) && a.otherRegionColor().equals(b.blackRegionColor())
                : a.blackRegionColor().equals(b.blackRegionColor()) && a.otherRegionColor().equals(b.otherRegionColor()));
            if (match) result.add(new int[]{first, second});
        }
        return result;
    }

    private static List<Integer> adjacentCells(int cell) {
        List<Integer> result = new ArrayList<>(4);
        int row = cell / 5, column = cell % 5;
        if (column > 0) result.add(cell - 1);
        if (column < 4) result.add(cell + 1);
        if (row > 0) result.add(cell - 5);
        if (row < 4) result.add(cell + 5);
        return List.copyOf(result);
    }

    private static String colorForLetter(int letter) {
        return switch (letter) {
            case 'R' -> "RED"; case 'O' -> "ORANGE"; case 'Y' -> "YELLOW"; case 'G' -> "GREEN";
            case 'C' -> "CYAN"; case 'A' -> "AZURE"; case 'B' -> "BLUE"; case 'M' -> "MAGENTA"; case 'P' -> "PURPLE";
            default -> throw new IllegalArgumentException("Unknown color letter");
        };
    }

    private static List<String> coordinates(int[] pair) {
        return List.of(coordinate(pair[0]), coordinate(pair[1]));
    }

    private static String coordinate(int index) {
        return String.valueOf((char) ('A' + index % 7)) + (index / 7 + 1);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
