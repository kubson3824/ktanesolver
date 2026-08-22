package ktanesolver.module.modded.regular.unfaircipher;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
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
    type = ModuleType.UNFAIR_CIPHER,
    id = "unfairCipher",
    name = "Unfair Cipher",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decrypt the displayed message and translate its four instructions into button presses.",
    tags = {"cipher", "playfair", "caesar", "buttons", "timing"}
)
public class UnfairCipherSolver extends AbstractModuleSolver<UnfairCipherInput, UnfairCipherOutput> {
    private static final String ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
    private static final Set<String> INSTRUCTIONS = Set.of(
        "PCR", "PCG", "PCB", "SUB", "MIT", "CHK", "PRN", "BOB", "REP", "EAT", "STR", "IKE");
    private static final Set<Integer> PRIMES_MOD_20 = Set.of(2, 3, 5, 7, 11, 13, 17, 19);
    private static final String[][] KEY_B = {
        {"ABDA", "FEV", "DBHC", "BLD", "DBIE", "AFEF", "AFCG", "CQH", "DEAI", "FEAA", "EFAB", "DECC"},
        {"ABDB", "FEW", "DBHD", "BLE", "DBIF", "AFEG", "AFCH", "CQI", "DEAA", "FEAB", "EFAC", "DECD"},
        {"ABDC", "FEX", "DBHE", "BLF", "DBIG", "AFEH", "AFCI", "CQA", "DEAB", "FEAC", "EFAD", "DECE"},
        {"ABDD", "FEY", "DBHF", "BLG", "DBIH", "AFEI", "AFCA", "CQB", "DEAC", "FEAD", "EFAE", "DECF"},
        {"ABDE", "FEZ", "DBHG", "BLH", "DBII", "AFEA", "AFCB", "CQC", "DEAD", "FEAE", "EFAF", "DED"},
        {"ABDF", "FEBG", "DBHH", "BLI", "DBIA", "AFEB", "AFCC", "CQD", "DEAE", "FEAF", "EFB", "DEDA"},
        {"ABDG", "FEBH", "DBHI", "BLA", "DBIB", "AFEC", "AFCD", "CQE", "DEAF", "FET", "EFBA", "DEDB"}
    };

    @Override
    protected SolveResult<UnfairCipherOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, UnfairCipherInput input
    ) {
        if (input == null) return failure("Enter the encrypted message and module ID");
        String encrypted = normalize(input.encryptedMessage());
        if (!encrypted.matches("[A-Z]{12}")) return failure("The encrypted message must contain exactly 12 letters");
        if (input.moduleId() <= 0) return failure("Module ID must be positive");
        if (input.strikeCount() < 0) return failure("Strike count cannot be negative");
        String serial = normalize(bomb.getSerialNumber());
        if (!serial.matches("[A-Z0-9]{6}")) return failure("A six-character serial number is required");

        LocalDate startDate = round.getStartTime() == null
            ? LocalDate.now()
            : round.getStartTime().atZone(ZoneId.systemDefault()).toLocalDate();
        String keyA = calculateKeyA(bomb, input.moduleId());
        String keyB = calculateKeyB(startDate);
        String keyC = playfairEncrypt(keyB, keyA);
        int offset = calculateOffset(bomb);
        String afterCaesar = caesar(encrypted, -offset);
        String afterKeyC = playfairDecrypt(keyC, afterCaesar);
        String plaintext = playfairDecrypt(keyA, afterKeyC);
        List<String> instructions = splitInstructions(plaintext);
        if (instructions == null) return failure("The message did not decrypt to four valid instructions; check the display, date, bomb data, and module ID");

        List<UnfairCipherAction> actions = planActions(bomb, input.moduleId(), input.strikeCount(), instructions);
        boolean instantSolve = actions.size() < instructions.size();
        storeState(module, "unfairCipherEncryptedMessage", encrypted);
        return success(new UnfairCipherOutput(keyA, keyB, keyC, offset, instructions, actions, instantSolve));
    }

    static String calculateKeyA(BombEntity bomb, int moduleId) {
        String serial = normalize(bomb.getSerialNumber());
        if (letterValue(serial.charAt(0)) >= 20) serial = serial.substring(1);
        StringBuilder digits = new StringBuilder();
        for (char character : serial.toCharArray()) {
            digits.append(Character.isDigit(character) ? character - '0' : letterValue(character));
        }
        int value = Integer.parseInt(digits.toString());
        String originalSerial = normalize(bomb.getSerialNumber());
        if ("AEIOU".indexOf(originalSerial.charAt(3)) >= 0 || "AEIOU".indexOf(originalSerial.charAt(4)) >= 0) value /= 10;
        StringBuilder key = new StringBuilder(hexToLetters(Integer.toHexString(value).toUpperCase(Locale.ROOT)));
        appendWrappedLetter(key, moduleId);
        appendWrappedLetter(key, bomb.getPortPlates().size());
        appendWrappedLetter(key, bomb.getBatteryHolders());
        return key.toString();
    }

    static String calculateKeyB(LocalDate date) {
        int day = date.getDayOfWeek().getValue() - 1;
        return KEY_B[day][date.getMonthValue() - 1];
    }

    static int calculateOffset(BombEntity bomb) {
        Set<Object> portTypes = new LinkedHashSet<>();
        int portCount = 0;
        for (var plate : bomb.getPortPlates()) {
            portTypes.addAll(plate.getPorts());
            portCount += plate.getPorts().size();
        }
        int offset = -2 * portTypes.size() + bomb.getPortPlates().size();
        for (char character : normalize(bomb.getSerialNumber()).toCharArray()) {
            if (!Character.isLetter(character)) continue;
            offset += "AEIOU".indexOf(character) >= 0 ? -2 : 1;
        }
        for (boolean lit : bomb.getIndicators().values()) offset += lit ? 2 : -2;
        offset -= bomb.getBatteryCount();
        if (bomb.getBatteryCount() == 0) offset += 10;
        if (portCount == 0) offset *= 2;
        if (bomb.getModules().size() > 30) offset /= 2;
        return offset;
    }

    static String playfairEncrypt(String key, String plaintext) {
        return playfair(key, plaintext, 1, true);
    }

    static String playfairDecrypt(String key, String ciphertext) {
        return playfair(key, ciphertext, -1, false);
    }

    static String encryptInstructions(String keyA, String keyC, int offset, String instructions) {
        return caesar(playfairEncrypt(keyC, playfairEncrypt(keyA, instructions)), offset);
    }

    static List<UnfairCipherAction> planActions(BombEntity bomb, int moduleId, int strikes, List<String> instructions) {
        List<UnfairCipherAction> actions = new ArrayList<>();
        int colorPresses = 0;
        boolean bobUnicorn = bomb.isIndicatorLit("BOB") && bomb.getIndicators().size() == 1 && bomb.getBatteryCount() == 2;
        for (int index = 0; index < instructions.size(); index++) {
            String instruction = instructions.get(index);
            int stage = index + 1;
            String button;
            List<String> seconds = List.of();
            switch (instruction) {
                case "PCR" -> button = "RED";
                case "PCG" -> button = "GREEN";
                case "PCB" -> button = "BLUE";
                case "SUB" -> { button = "OUTER"; seconds = matchingSeconds(11); }
                case "MIT" -> { button = "INNER"; seconds = matchingLastDigit(Math.floorMod(moduleId + colorPresses + stage, 10)); }
                case "PRN" -> button = PRIMES_MOD_20.contains(Math.floorMod(moduleId, 20)) ? "INNER" : "OUTER";
                case "CHK" -> button = PRIMES_MOD_20.contains(Math.floorMod(moduleId, 20)) ? "OUTER" : "INNER";
                case "BOB" -> button = "INNER";
                case "REP", "EAT" -> button = actions.isEmpty() ? "INNER" : actions.get(actions.size() - 1).button();
                case "STR", "IKE" -> button = List.of("RED", "GREEN", "BLUE").get(Math.floorMod(strikes, 3));
                default -> throw new IllegalArgumentException("Unknown instruction " + instruction);
            }
            actions.add(new UnfairCipherAction(instruction, button, seconds));
            if (Set.of("RED", "GREEN", "BLUE").contains(button)) colorPresses++;
            if (instruction.equals("BOB") && bobUnicorn) break;
        }
        return List.copyOf(actions);
    }

    private static List<String> splitInstructions(String plaintext) {
        if (plaintext.length() != 12) return null;
        List<String> result = new ArrayList<>(4);
        for (int index = 0; index < 12; index += 3) {
            String instruction = plaintext.substring(index, index + 3);
            if (!INSTRUCTIONS.contains(instruction)) return null;
            result.add(instruction);
        }
        return List.copyOf(result);
    }

    private static String playfair(String key, String text, int direction, boolean replaceDuplicatePairs) {
        String matrix = matrix(key);
        String adjusted = normalize(text).replace('J', 'I');
        if (adjusted.length() % 2 != 0) adjusted += "X";
        StringBuilder result = new StringBuilder(adjusted.length());
        for (int index = 0; index < adjusted.length(); index += 2) {
            char first = adjusted.charAt(index);
            char second = adjusted.charAt(index + 1);
            if (replaceDuplicatePairs && first == second) second = 'X';
            int a = matrix.indexOf(first), b = matrix.indexOf(second);
            int rowA = a / 5, columnA = a % 5, rowB = b / 5, columnB = b % 5;
            if (rowA == rowB) {
                result.append(matrix.charAt(rowA * 5 + Math.floorMod(columnA + direction, 5)));
                result.append(matrix.charAt(rowB * 5 + Math.floorMod(columnB + direction, 5)));
            } else if (columnA == columnB) {
                result.append(matrix.charAt(Math.floorMod(rowA + direction, 5) * 5 + columnA));
                result.append(matrix.charAt(Math.floorMod(rowB + direction, 5) * 5 + columnB));
            } else {
                result.append(matrix.charAt(rowA * 5 + columnB));
                result.append(matrix.charAt(rowB * 5 + columnA));
            }
        }
        return result.toString();
    }

    private static String matrix(String key) {
        StringBuilder matrix = new StringBuilder(25);
        for (char character : (normalize(key).replace('J', 'I') + ALPHABET).toCharArray()) {
            if (matrix.indexOf(String.valueOf(character)) < 0) matrix.append(character);
        }
        return matrix.toString();
    }

    private static String caesar(String text, int offset) {
        StringBuilder result = new StringBuilder(text.length());
        for (char character : text.toCharArray()) result.append((char) ('A' + Math.floorMod(character - 'A' + offset, 26)));
        return result.toString();
    }

    private static String hexToLetters(String hex) {
        StringBuilder result = new StringBuilder();
        for (int index = 0; index < hex.length();) {
            char character = hex.charAt(index);
            if (!Character.isDigit(character)) {
                result.append(character);
                index++;
                continue;
            }
            int number = character - '0';
            if ((character == '1' || character == '2') && index + 1 < hex.length() && Character.isDigit(hex.charAt(index + 1))) {
                int pair = number * 10 + hex.charAt(index + 1) - '0';
                if (pair <= 26) { number = pair; index++; }
            }
            if (number > 0) result.append((char) ('A' + number - 1));
            index++;
        }
        return result.toString();
    }

    private static void appendWrappedLetter(StringBuilder key, int value) {
        if (value > 0) key.append((char) ('A' + Math.floorMod(value - 1, 26)));
    }

    private static int letterValue(char character) {
        return Character.isLetter(character) ? character - 'A' + 1 : character - '0';
    }

    private static List<String> matchingSeconds(int divisor) {
        List<String> values = new ArrayList<>();
        for (int second = 0; second < 60; second++) if (second % divisor == 0) values.add(String.format("%02d", second));
        return List.copyOf(values);
    }

    private static List<String> matchingLastDigit(int digit) {
        List<String> values = new ArrayList<>(6);
        for (int second = digit; second < 60; second += 10) values.add(String.format("%02d", second));
        return List.copyOf(values);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s", "").toUpperCase(Locale.ROOT);
    }
}
