package ktanesolver.module.modded.regular.sueetwall;

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
    type = ModuleType.SUEET_WALL,
    id = "SueetWall",
    name = "Sueet Wall",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Evaluate twenty suit-and-number tiles against their wrapped neighbors.",
    tags = {"cards", "grid", "numbers", "logic"}
)
public class SueetWallSolver extends AbstractModuleSolver<SueetWallInput, SueetWallOutput> {
    private static final Set<String> SUITS = Set.of("CLUBS", "HEARTS", "SPADES", "DIAMONDS");
    private static final Set<String> COLORS = Set.of("BLACK", "RED");
    private static final int[][][] SIDES = {
        {{-1,-1},{-1,1},{1,-1},{1,1}}, {{-1,-1},{-1,0},{-1,1},{1,0}},
        {{-1,0},{1,-1},{1,0},{1,1}}, {{-1,0},{0,-1},{0,1},{1,0}}
    };

    @Override
    protected SolveResult<SueetWallOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SueetWallInput input
    ) {
        if (input == null || input.initialBombMinutes() == null || input.buttons() == null) {
            return failure("Enter the initial bomb time in whole minutes and all twenty buttons");
        }
        if (input.initialBombMinutes() < 0 || input.initialBombMinutes() > 999) return failure("Initial bomb minutes must be from 0 through 999");
        if (input.buttons().size() != 20) return failure("Enter exactly twenty buttons in A1–D5 reading order");
        List<SueetWallButton> buttons = input.buttons().stream().map(SueetWallSolver::normalized).toList();
        if (buttons.stream().anyMatch(b -> b == null || !SUITS.contains(b.suit()) || b.number() == null || b.number() < 1 || b.number() > 100 || !COLORS.contains(b.numberColor()))) {
            return failure("Every button needs a valid suit, a number from 1 through 100, and black or red number text");
        }
        List<String> coordinates = new ArrayList<>();
        for (int i = 0; i < 20; i++) if (correct(buttons, input.initialBombMinutes(), i)) coordinates.add(coordinate(i));
        boolean any = coordinates.isEmpty();
        if (any) coordinates.add("A1");
        return success(new SueetWallOutput(List.copyOf(coordinates), any));
    }

    static boolean correct(List<SueetWallButton> buttons, int minutes, int index) {
        SueetWallButton button = buttons.get(index);
        int suit = List.of("CLUBS", "HEARTS", "SPADES", "DIAMONDS").indexOf(button.suit());
        int row = index / 4, column = index % 4;
        for (int[] side : SIDES[suit]) {
            SueetWallButton neighbor = buttons.get(Math.floorMod(row + side[0], 5) * 4 + Math.floorMod(column + side[1], 4));
            boolean passes = switch (suit) {
                case 0 -> button.numberColor().equals("BLACK") ? neighbor.number() > button.number() : neighbor.number() < button.number();
                case 1 -> button.numberColor().equals("BLACK") ? neighbor.number() < minutes : neighbor.number() > minutes;
                case 2 -> button.numberColor().equals("BLACK") ? neighbor.suit().equals(button.suit()) : !neighbor.suit().equals(button.suit());
                default -> button.numberColor().equals("BLACK") ? suitColor(neighbor.suit()) == suitColor(button.suit()) : neighbor.numberColor().equals(button.numberColor());
            };
            if (!passes) return false;
        }
        return true;
    }

    private static int suitColor(String suit) { return List.of("CLUBS", "HEARTS", "SPADES", "DIAMONDS").indexOf(suit) % 2; }
    private static String coordinate(int index) { return "" + (char) ('A' + index % 4) + (index / 4 + 1); }
    private static SueetWallButton normalized(SueetWallButton button) {
        return button == null ? null : new SueetWallButton(normalize(button.suit()), button.number(), normalize(button.numberColor()));
    }
    private static String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
}
