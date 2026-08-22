package ktanesolver.module.modded.regular.bluearrows;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
    type = ModuleType.BLUE_ARROWS, id = "blueArrowsModule", name = "Blue Arrows",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Order the four arrow presses using the displayed coordinate and edgework priority operations.",
    tags = {"arrows", "coordinates", "priority", "edgework", "rule seed"}
)
public class BlueArrowsSolver extends AbstractModuleSolver<BlueArrowsInput, BlueArrowsOutput> {
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String VOWELS = "AEIOU";
    private static final List<String> STANDARD_INDICATORS = List.of("BOB","SND","SIG","CAR","CLR","FRK","FRQ","IND","MSA","NSA","TRN");
    /** Values contain the Up, Down, Left, Right, and center letters in that order. */
    private static final Map<String, String> LETTERS = Map.ofEntries(
        Map.entry("CA","DKBGA"),Map.entry("C1","ZEAYG"),Map.entry("CB","XIGFY"),Map.entry("C8","ITYJF"),
        Map.entry("CF","MSFDJ"),Map.entry("C4","CRJKD"),Map.entry("CE","SPDBK"),Map.entry("C6","QPKAB"),
        Map.entry("3A","AJPEK"),Map.entry("31","GOKIE"),Map.entry("3B","YNETI"),Map.entry("38","FDIST"),
        Map.entry("3F","JXTRS"),Map.entry("34","DWSPR"),Map.entry("3E","KIRPP"),Map.entry("36","BTPKP"),
        Map.entry("GA","KBTOJ"),Map.entry("G1","EZJNO"),Map.entry("GB","IQODN"),Map.entry("G8","TKNXD"),
        Map.entry("GF","SADWX"),Map.entry("G4","RUXIW"),Map.entry("GE","PLWTI"),Map.entry("G6","PNIJT"),
        Map.entry("7A","JVNZB"),Map.entry("71","OSBQZ"),Map.entry("7B","NGZKQ"),Map.entry("78","DCQAK"),
        Map.entry("7F","XOKUA"),Map.entry("74","WHALU"),Map.entry("7E","IHUNL"),Map.entry("76","TYLBN"),
        Map.entry("DA","BFYSB"),Map.entry("D1","ZNVGS"),Map.entry("DB","QMSCG"),Map.entry("D8","KPGOC"),
        Map.entry("DF","ALCHO"),Map.entry("D4","UROHH"),Map.entry("DE","LTHYH"),Map.entry("D6","NBHVY"),
        Map.entry("5A","VWBNV"),Map.entry("51","SRFMN"),Map.entry("5B","GENPM"),Map.entry("58","CUMLP"),
        Map.entry("5F","OFPRL"),Map.entry("54","HZLTR"),Map.entry("5E","HVRBT"),Map.entry("56","YOTFB"),
        Map.entry("HA","FDORF"),Map.entry("H1","NZWER"),Map.entry("HB","MXRUE"),Map.entry("H8","PIEFU"),
        Map.entry("HF","LMUZF"),Map.entry("H4","RCFVZ"),Map.entry("HE","TSZOV"),Map.entry("H6","BQVWO"),
        Map.entry("2A","WAQZW"),Map.entry("21","RGDXZ"),Map.entry("2B","EYZIX"),Map.entry("28","UFXMI"),
        Map.entry("2F","FJICM"),Map.entry("24","ZDMSC"),Map.entry("2E","VKCQS"),Map.entry("26","OBSDQ")
    );

    @Override
    protected SolveResult<BlueArrowsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BlueArrowsInput input) {
        String coordinate = input == null || input.coordinate() == null ? "" : input.coordinate().trim().toUpperCase(Locale.ROOT);
        String assigned = LETTERS.get(coordinate);
        if (assigned == null) return failure("Enter one of the 64 valid displayed coordinates");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.chars().noneMatch(Character::isDigit)) return failure("Enter a serial number containing a digit");

        Work work = new Work(shift(ALPHABET, bomb.getLastDigit()));
        apply(10, work, bomb, assigned);
        boolean bobException = bomb.isIndicatorLit("BOB") && bomb.getBatteryCount() == 0
            && bomb.getPortPlates().isEmpty() && STANDARD_INDICATORS.stream().noneMatch(bomb::isIndicatorUnlit)
            && bomb.serialHasVowel();
        if (bobException) work.priority = ALPHABET;
        else {
            if (bomb.isIndicatorLit("BOB")) apply(0, work, bomb, assigned);
            if (bomb.getBatteryCount() % 2 == 0) apply(1, work, bomb, assigned);
            if (!bomb.hasPort(PortType.DVI)) apply(2, work, bomb, assigned);
            if (bomb.hasPort(PortType.STEREO_RCA)) apply(3, work, bomb, assigned);
            if (Character.isDigit(coordinate.charAt(0)) && Character.isDigit(coordinate.charAt(1)) && !work.used.isEmpty()) apply(4, work, bomb, assigned);
            if (bomb.getBatteryHolders() % 2 == 1) apply(5, work, bomb, assigned);
            if (VOWELS.indexOf(assigned.charAt(4)) >= 0) apply(6, work, bomb, assigned);
            if (VOWELS.indexOf(assigned.charAt(0)) >= 0) apply(7, work, bomb, assigned);
            if (VOWELS.indexOf(assigned.charAt(1)) >= 0 && !work.used.isEmpty()) apply(8, work, bomb, assigned);
            if (Character.isLetter(coordinate.charAt(0)) && Character.isLetter(coordinate.charAt(1)) && !work.used.isEmpty()) apply(9, work, bomb, assigned);
        }

        List<String> directions = new ArrayList<>();
        String[] names = {"up", "down", "left", "right"};
        for (int i = 0; i < work.priority.length(); i++)
            for (int direction = 0; direction < 4; direction++)
                if (work.priority.charAt(i) == assigned.charAt(direction)) directions.add(names[direction]);
        storeState(module, "blueArrowsInitialCharacters", coordinate);
        return success(new BlueArrowsOutput(List.copyOf(directions), String.join(" ", directions)));
    }

    private static void apply(int operation, Work work, BombEntity bomb, String assigned) {
        if (operation == 8) {
            int repeat = work.used.get(work.used.size() - 1);
            apply(repeat, work, bomb, assigned);
            work.used.add(8);
            return;
        }
        String current = work.priority;
        if (operation == 4 || operation == 9) {
            String previous = work.previous;
            work.previous = current;
            work.priority = previous;
            work.used.add(operation);
            return;
        }
        work.previous = current;
        work.priority = switch (operation) {
            case 0 -> new StringBuilder(current).reverse().toString();
            case 1 -> moveToEnd(current, VOWELS);
            case 2 -> current.substring(0, 13) + new StringBuilder(current.substring(13)).reverse();
            case 3 -> moveToFront(current, "RCA");
            case 5 -> primePositionsFirst(current);
            case 6 -> betweenAAndEFirst(current);
            case 7 -> shift(current, assigned.charAt(2) - '@');
            case 10 -> serialLetterFirst(current, bomb.getSerialNumber());
            default -> current;
        };
        work.used.add(operation);
    }

    private static String serialLetterFirst(String priority, String serial) {
        int code = serial.toUpperCase(Locale.ROOT).chars().filter(Character::isLetter).findFirst().orElse(-1);
        if (code < 0) return priority;
        char letter = (char) code;
        int index = priority.indexOf(letter);
        return index == 0 ? priority.substring(1) + letter : letter + priority.substring(0, index) + priority.substring(index + 1);
    }

    private static String moveToEnd(String text, String selected) {
        return filter(text, selected, false) + filter(text, selected, true);
    }

    private static String moveToFront(String text, String selected) {
        StringBuilder front = new StringBuilder(), rest = new StringBuilder();
        for (int i = 0; i < selected.length(); i++) if (text.indexOf(selected.charAt(i)) >= 0) front.append(selected.charAt(i));
        for (int i = 0; i < text.length(); i++) if (selected.indexOf(text.charAt(i)) < 0) rest.append(text.charAt(i));
        return front.append(rest).toString();
    }

    private static String filter(String text, String selected, boolean include) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < text.length(); i++) if ((selected.indexOf(text.charAt(i)) >= 0) == include) result.append(text.charAt(i));
        return result.toString();
    }

    private static String primePositionsFirst(String text) {
        int[] positions = {1,2,4,6,10,12,16,18,22};
        StringBuilder chosen = new StringBuilder(), rest = new StringBuilder();
        for (int position : positions) chosen.append(text.charAt(position));
        for (int i = 0; i < text.length(); i++) {
            boolean selected = false;
            for (int position : positions) if (position == i) selected = true;
            if (!selected) rest.append(text.charAt(i));
        }
        return chosen.reverse().append(rest).toString();
    }

    private static String betweenAAndEFirst(String text) {
        int a = text.indexOf('A'), e = text.indexOf('E');
        int start = Math.min(a, e) + 1, end = Math.max(a, e);
        String between = text.substring(start, end);
        return between + text.substring(0, start) + text.substring(end);
    }

    private static String shift(String text, int amount) {
        StringBuilder shifted = new StringBuilder();
        for (int i = 0; i < text.length(); i++) shifted.append((char)('A' + Math.floorMod(text.charAt(i) - 'A' - amount, 26)));
        return shifted.toString();
    }

    private static final class Work {
        private String priority;
        private String previous;
        private final List<Integer> used = new ArrayList<>();
        private Work(String priority) { this.priority = priority; this.previous = priority; }
    }
}
