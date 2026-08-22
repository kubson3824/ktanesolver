package ktanesolver.module.modded.regular.hiddencolors;

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
    type = ModuleType.HIDDEN_COLORS, id = "lgndHiddenColors", name = "Hidden Colors",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Name six hidden buttons from the LED table and apply the first matching rule.",
    tags = {"colors", "buttons", "LED", "edgework"}
)
public class HiddenColorsSolver extends AbstractModuleSolver<HiddenColorsInput, HiddenColorsOutput> {
    public static final List<String> COLORS = List.of("red", "blue", "green", "yellow", "orange", "purple", "magenta", "white");
    private static final int[][] NAMED = {
        {1,5,16,20,7,14}, {15,18,13,8,3,10}, {8,12,7,14,9,13}, {2,12,18,14,8,4},
        {12,17,18,6,11,16}, {6,7,11,9,10,15}, {20,19,18,17,16,3}, {1,2,8,13,17,16}
    };

    @Override
    protected SolveResult<HiddenColorsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HiddenColorsInput input) {
        int led = input == null ? -1 : COLORS.indexOf(normalize(input.ledColor()));
        if (led < 0 || input.buttonColors() == null || input.buttonColors().size() != 20) return failure("Choose the LED color and all twenty button colors");
        List<String> colors = input.buttonColors().stream().map(HiddenColorsSolver::normalize).toList();
        if (colors.stream().anyMatch(value -> !COLORS.contains(value))) return failure("Choose valid button colors");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");

        int[] named = NAMED[led];
        String a = at(colors,named[0]), b = at(colors,named[1]), c = at(colors,named[2]), d = at(colors,named[3]), e = at(colors,named[4]), f = at(colors,named[5]);
        String ledColor = COLORS.get(led);
        int rule, answer;
        if (a.equals(b) && b.equals(c)) { rule=1; answer=4; }
        else if (d.equals(e) && e.equals(f)) { rule=2; answer=9; }
        else if (ledColor.equals(at(colors,1)) && ledColor.equals(at(colors,20))) { rule=3; answer=14; }
        else if (at(colors,4).equals(at(colors,8)) && at(colors,8).equals(at(colors,16))) { rule=4; answer=5; }
        else if (a.equals(at(colors,13)) && a.equals(at(colors,14))) { rule=5; answer=11; }
        else if (e.equals("purple")) { rule=6; answer=17; }
        else if (bomb.isIndicatorUnlit("CLR")) { rule=7; answer=12; }
        else if (bomb.isIndicatorLit("TRN")) { rule=8; answer=3; }
        else if (bomb.getBatteryCount() >= 6) { rule=9; answer=8; }
        else if (c.equals("orange") || c.equals("white")) { rule=10; answer=10; }
        else if (f.equals("red") || f.equals("blue")) { rule=11; answer=6; }
        else if (!Set.of("orange","magenta","purple","white").contains(b)) { rule=12; answer=2; }
        else if (!new java.util.HashSet<>(List.of(a,b,c,d,e,f)).contains(ledColor)) { rule=13; answer=18; }
        else if (firstDigit(serial) < 3) { rule=14; answer=1; }
        else if (e.equals(ledColor)) { rule=15; answer=19; }
        else if (Set.of(2,3,5,7).contains(bomb.getLastDigit())) { rule=16; answer=20; }
        else if (Set.of("magenta","green","yellow").contains(a)) { rule=17; answer=7; }
        else if (c.equals(ledColor) || e.equals(ledColor) || f.equals(ledColor)) { rule=18; answer=15; }
        else if (!c.equals(d)) { rule=19; answer=13; }
        else { rule=20; answer=16; }

        int green = colors.indexOf("green") + 1;
        if (green == 0) return failure("At least one button must be green so the LED can be switched on");
        storeState(module, "hiddenColorsLedColor", title(ledColor));
        Map<String,Integer> positions = new LinkedHashMap<>(); for (int i=0;i<6;i++) positions.put(String.valueOf((char)('A'+i)),named[i]);
        return success(new HiddenColorsOutput(green, answer, rule, Map.copyOf(positions)));
    }

    private static String at(List<String> colors, int position) { return colors.get(position - 1); }
    private static String normalize(String value) { return value == null ? "" : value.trim().toLowerCase(Locale.ROOT); }
    private static String title(String value) { return Character.toUpperCase(value.charAt(0)) + value.substring(1); }
    private static int firstDigit(String serial) { return serial.chars().filter(Character::isDigit).map(c -> c-'0').findFirst().orElse(0); }
}
