package ktanesolver.module.modded.regular.elderfuthark;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.ELDER_FUTHARK,
    id = "elderFuthark",
    name = "Elder Futhark",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Interweave the shown rune names and encrypt them with the Futhark cipher.",
    tags = {"runes", "cipher", "serial", "sequence"}
)
public class ElderFutharkSolver extends AbstractModuleSolver<ElderFutharkInput, ElderFutharkOutput> {
    public static final List<String> RUNES = List.of(
        "Ansuz", "Berkana", "Kenaz", "Dagaz", "Ehwaz", "Fehu", "Gebo", "Hagalaz", "Isa", "Jera", "Eihwaz",
        "Laguz", "Mannaz", "Nauthiz", "Othila", "Perthro", "Algiz", "Raido", "Sowulo", "Teiwaz", "Uruz", "Wunjo", "Thurisaz"
    );
    private static final List<String> LETTERS = List.of(
        "a", "b", "ckq", "d", "e", "f", "g", "h", "i", "j", "y", "l", "m", "n", "o", "p", "z", "r", "s", "t", "u", "vw", "x"
    );

    @Override
    protected SolveResult<ElderFutharkOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ElderFutharkInput input
    ) {
        if (input == null || input.runeNames() == null || input.runeNames().size() != 3) return failure("Choose the three shown runes in order");
        List<String> shown = new ArrayList<>(3);
        for (String value : input.runeNames()) {
            int index = runeIndex(value);
            if (index < 0) return failure("Choose valid Elder Futhark rune names");
            shown.add(RUNES.get(index));
        }
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");

        int maxLength = shown.stream().mapToInt(String::length).max().orElseThrow();
        StringBuilder interwoven = new StringBuilder(maxLength * 3);
        for (int i = 0; i < maxLength; i++) for (String rune : shown) interwoven.append(Character.toLowerCase(rune.charAt(i % rune.length())));
        int rotation = serial.chars().filter(Character::isDigit).map(Character::getNumericValue).sum() % 6;
        String woven = interwoven.toString();
        String rotated = rotation == 0 ? woven : woven.substring(woven.length() - rotation) + woven.substring(0, woven.length() - rotation);
        int totalLength = shown.stream().mapToInt(String::length).sum();
        String key = rotated.substring(0, totalLength);

        String original = String.join("", shown).toLowerCase(Locale.ROOT);
        List<String> presses = new ArrayList<>(totalLength);
        for (int i = 0; i < totalLength; i++) presses.add(RUNES.get((letterIndex(original.charAt(i)) + letterIndex(key.charAt(i))) % RUNES.size()));
        List<List<String>> grouped = new ArrayList<>(3);
        int offset = 0;
        for (String rune : shown) {
            grouped.add(List.copyOf(presses.subList(offset, offset + rune.length())));
            offset += rune.length();
        }

        storeState(module, "elderFutharkRunes", List.copyOf(shown));
        return success(new ElderFutharkOutput(List.copyOf(shown), key, List.copyOf(grouped), List.copyOf(presses)));
    }

    private static int runeIndex(String value) {
        if (value == null) return -1;
        for (int i = 0; i < RUNES.size(); i++) if (RUNES.get(i).equalsIgnoreCase(value.trim())) return i;
        return -1;
    }

    private static int letterIndex(char letter) {
        for (int i = 0; i < LETTERS.size(); i++) if (LETTERS.get(i).indexOf(letter) >= 0) return i;
        throw new IllegalArgumentException("Unsupported rune-name letter: " + letter);
    }
}
