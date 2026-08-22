package ktanesolver.module.modded.regular.coloredkeys;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.coloredkeys.ColoredKeysInput.Key;

@Service
@ModuleInfo(
    type = ModuleType.COLORED_KEYS, id = "lgndColoredKeys", name = "Colored Keys",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Score the four colored letter keys and press the first highest-scoring key.",
    tags = {"keys", "colors", "letters", "edgework"}
)
public class ColoredKeysSolver extends AbstractModuleSolver<ColoredKeysInput, ColoredKeysOutput> {
    private static final List<String> COLORS = List.of("red", "blue", "green", "yellow", "purple", "white");
    private static final List<String> POSITIONS = List.of("top left", "top right", "bottom left", "bottom right");

    @Override
    protected SolveResult<ColoredKeysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ColoredKeysInput input) {
        if (input == null || input.keys() == null || input.keys().size() != 4) return failure("Enter all four keys");
        String word = color(input.displayedWord()), displayColor = color(input.displayedColor());
        if (word == null || displayColor == null) return failure("Choose a valid displayed word and color");
        List<Key> keys = new ArrayList<>();
        for (Key key : input.keys()) {
            String keyColor = key == null ? null : color(key.color());
            String letter = key == null || key.letter() == null ? "" : key.letter().trim().toUpperCase(Locale.ROOT);
            if (keyColor == null || !letter.matches("[A-Z]")) return failure("Each key needs a valid color and one letter");
            keys.add(new Key(keyColor, letter));
        }
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");

        int[] score = new int[4];
        if (bomb.isIndicatorLit("MSA")) score[0]++; if (bomb.isIndicatorLit("SIG")) score[1]++;
        if (bomb.isIndicatorLit("NSA")) score[2]++; if (bomb.isIndicatorLit("CLR")) score[3]++;
        if (bomb.isIndicatorUnlit("CAR")) score[0]++; if (bomb.isIndicatorUnlit("SND")) score[1]++;
        if (bomb.isIndicatorUnlit("TRN")) score[2]++; if (bomb.isIndicatorUnlit("BOB")) score[3]++;
        if (bomb.getBatteryHolders() % 2 == 1) score[0]++; if (bomb.getBatteryCount() > 3) score[1]++;
        if (bomb.getBatteryCount() == 0) score[2]++; if (bomb.getBatteryCount() % 2 == 0) score[3]++;
        if (bomb.hasPort(PortType.RJ45)) score[0]++; if (bomb.hasPort(PortType.DVI) || bomb.hasPort(PortType.PARALLEL)) score[1]++;
        if (bomb.hasPort(PortType.PS2) || bomb.hasPort(PortType.SERIAL)) score[2]++; if (bomb.hasPort(PortType.STEREO_RCA)) score[3]++;

        Map<String, Integer> frequencies = new HashMap<>();
        keys.forEach(key -> frequencies.merge(key.color(), 1, Integer::sum));
        if (frequencies.get(keys.get(0).color()) > 1) score[0]++;
        if (frequencies.containsValue(2)) score[1]++;
        if (frequencies.values().stream().anyMatch(count -> count >= 3)) score[2]++;
        if (frequencies.size() == 4) score[3]++;
        for (int i = 0; i < 4; i++) {
            Key key = keys.get(i);
            if (key.color().equals(word)) score[i]++;
            if (key.color().equals(displayColor)) score[i]++;
            if (word.toUpperCase(Locale.ROOT).contains(key.letter())) score[i]++;
            if (serial.toUpperCase(Locale.ROOT).contains(key.letter())) score[i]++;
        }

        storeState(module, "coloredKeysDisplayWord", word);
        storeState(module, "coloredKeysDisplayColor", displayColor);
        storeState(module, "coloredKeysLetters", keys.stream().map(Key::letter).toList());
        storeState(module, "coloredKeysColors", keys.stream().map(Key::color).toList());
        int chosen = 0;
        for (int i = 1; i < 4; i++) if (score[i] > score[chosen]) chosen = i;
        return success(new ColoredKeysOutput(chosen + 1, POSITIONS.get(chosen), List.of(score[0], score[1], score[2], score[3])));
    }

    private static String color(String value) {
        if (value == null) return null;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return COLORS.contains(normalized) ? normalized : null;
    }
}
