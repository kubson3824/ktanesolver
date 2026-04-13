package ktanesolver.module.modded.regular.numberpad;

import java.util.EnumSet;
import java.util.List;
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
    type = ModuleType.NUMBER_PAD,
    id = "number_pad",
    name = "Number Pad",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Follow the wheel chart based on keypad colours and edgework to derive the 4-digit code.",
    tags = {"lookup", "edgework", "digits"}
)
public class NumberPadSolver extends AbstractModuleSolver<NumberPadInput, NumberPadOutput> {

    private static final Set<NumberPadColor> RED_WHITE_BLUE = EnumSet.of(
        NumberPadColor.RED,
        NumberPadColor.WHITE,
        NumberPadColor.BLUE
    );

    @Override
    public SolveResult<NumberPadOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, NumberPadInput input) {
        List<NumberPadColor> buttonColors = input.buttonColors();
        if (buttonColors == null || buttonColors.size() != 10) {
            return failure("Number Pad requires exactly 10 button colors");
        }
        if (buttonColors.stream().anyMatch(color -> color == null)) {
            return failure("Number Pad button colors cannot contain blanks");
        }

        storeState(module, "buttonColors", buttonColors);

        NumberPadStats stats = NumberPadStats.from(buttonColors, bomb);
        String code = selectCode(stats);

        return success(new NumberPadOutput(code, "Submit " + code));
    }

    private String selectCode(NumberPadStats stats) {
        Column column = stats.column();

        return switch (stats.levelOneGroup()) {
            case THREE_OR_MORE_YELLOW -> selectThreeOrMoreYellowCode(stats, column);
            case FOUR_FIVE_SIX_RWB -> selectRedWhiteBlueMiddleCode(stats, column);
            case SERIAL_HAS_VOWEL -> selectSerialVowelCode(stats, column);
            case OTHERWISE -> selectOtherwiseCode(stats, column);
        };
    }

    private String selectThreeOrMoreYellowCode(NumberPadStats stats, Column column) {
        if (stats.hasAtLeastTwoBlueAndThreeGreen()) {
            return code(column, "3322", "3223", "3232", "3223");
        }
        if (stats.buttonFiveNotBlueOrWhite()) {
            return stats.hasAtLeastThreeWhite()
                ? code(column, "9321", "2931", "9231", "1392")
                : code(column, "2346", "4236", "2436", "6324");
        }
        if (stats.hasFewerThanTwoPorts()) {
            return stats.hasAtLeastThreeWhite()
                ? code(column, "7290", "7902", "7920", "2097")
                : code(column, "2999", "9299", "2999", "9299");
        }
        if (stats.hasAtLeastThreeWhite()) {
            return stats.hasGreenOnTopRow()
                ? code(column, "7019", "1709", "7109", "9071")
                : code(column, "9207", "9072", "9027", "2709");
        }
        return stats.hasGreenOnTopRow()
            ? code(column, "7019", "1709", "7109", "9071")
            : code(column, "2090", "9200", "2900", "0029");
    }

    private String selectRedWhiteBlueMiddleCode(NumberPadStats stats, Column column) {
        if (stats.hasAtLeastTwoBlueAndThreeGreen()) {
            return code(column, "2536", "2365", "2356", "5632");
        }
        if (stats.buttonFiveIs(NumberPadColor.RED)) {
            return code(column, "6739", "3679", "6379", "9763");
        }
        if (stats.hasFewerThanTwoPorts()) {
            return code(column, "6197", "9617", "6917", "7169");
        }
        return stats.hasGreenOnTopRow()
            ? code(column, "5053", "5503", "5503", "3055")
            : code(column, "3506", "3065", "3056", "5603");
    }

    private String selectSerialVowelCode(NumberPadStats stats, Column column) {
        if (stats.hasAtLeastTwoBlueAndThreeGreen()) {
            return code(column, "8591", "9851", "8951", "1589");
        }
        if (stats.buttonFiveNotBlueOrWhite()) {
            return code(column, "8869", "6889", "8689", "9886");
        }
        if (stats.hasFewerThanTwoPorts()) {
            return code(column, "8319", "1839", "8139", "9381");
        }
        return stats.hasGreenOnTopRow()
            ? code(column, "7101", "0711", "7011", "1170")
            : code(column, "1018", "1180", "1108", "0811");
    }

    private String selectOtherwiseCode(NumberPadStats stats, Column column) {
        if (stats.hasAtLeastTwoBlueAndThreeGreen()) {
            return code(column, "9017", "1907", "9107", "7091");
        }
        if (stats.buttonFiveNotBlueOrWhite()) {
            return code(column, "1379", "1793", "1739", "3971");
        }
        if (stats.hasFewerThanTwoPorts()) {
            return code(column, "9471", "7941", "9741", "1497");
        }
        return stats.hasGreenOnTopRow()
            ? code(column, "4428", "4284", "4248", "4824")
            : code(column, "9244", "4924", "9424", "4294");
    }

    private String code(Column column, String serialEven, String oddBatteries, String both, String neither) {
        return switch (column) {
            case SERIAL_EVEN -> serialEven;
            case ODD_BATTERIES -> oddBatteries;
            case BOTH -> both;
            case NEITHER -> neither;
        };
    }

    private enum LevelOneGroup {
        THREE_OR_MORE_YELLOW,
        FOUR_FIVE_SIX_RWB,
        SERIAL_HAS_VOWEL,
        OTHERWISE
    }

    private enum Column {
        SERIAL_EVEN,
        ODD_BATTERIES,
        BOTH,
        NEITHER
    }

    private record NumberPadStats(
        int yellowCount,
        int whiteCount,
        int blueCount,
        int greenCount,
        int portCount,
        boolean serialHasVowel,
        boolean serialEven,
        boolean oddBatteryCount,
        boolean greenOnTopRow,
        NumberPadColor buttonFiveColor,
        boolean fourFiveSixAreRedWhiteBlue
    ) {

        private static NumberPadStats from(List<NumberPadColor> buttonColors, BombEntity bomb) {
            int yellowCount = count(buttonColors, NumberPadColor.YELLOW);
            int whiteCount = count(buttonColors, NumberPadColor.WHITE);
            int blueCount = count(buttonColors, NumberPadColor.BLUE);
            int greenCount = count(buttonColors, NumberPadColor.GREEN);
            int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();

            return new NumberPadStats(
                yellowCount,
                whiteCount,
                blueCount,
                greenCount,
                portCount,
                bomb.serialHasVowel(),
                bomb.isLastDigitEven(),
                bomb.getBatteryCount() % 2 == 1,
                buttonColors.get(7) == NumberPadColor.GREEN
                    || buttonColors.get(8) == NumberPadColor.GREEN
                    || buttonColors.get(9) == NumberPadColor.GREEN,
                buttonColors.get(5),
                RED_WHITE_BLUE.contains(buttonColors.get(4))
                    && RED_WHITE_BLUE.contains(buttonColors.get(5))
                    && RED_WHITE_BLUE.contains(buttonColors.get(6))
            );
        }

        private static int count(List<NumberPadColor> buttonColors, NumberPadColor color) {
            return (int) buttonColors.stream().filter(color::equals).count();
        }

        private LevelOneGroup levelOneGroup() {
            if (yellowCount >= 3) {
                return LevelOneGroup.THREE_OR_MORE_YELLOW;
            }
            if (fourFiveSixAreRedWhiteBlue) {
                return LevelOneGroup.FOUR_FIVE_SIX_RWB;
            }
            if (serialHasVowel) {
                return LevelOneGroup.SERIAL_HAS_VOWEL;
            }
            return LevelOneGroup.OTHERWISE;
        }

        private Column column() {
            if (serialEven && oddBatteryCount) {
                return Column.BOTH;
            }
            if (serialEven) {
                return Column.SERIAL_EVEN;
            }
            if (oddBatteryCount) {
                return Column.ODD_BATTERIES;
            }
            return Column.NEITHER;
        }

        private boolean hasAtLeastTwoBlueAndThreeGreen() {
            return blueCount >= 2 && greenCount >= 3;
        }

        private boolean buttonFiveNotBlueOrWhite() {
            return buttonFiveColor != NumberPadColor.BLUE && buttonFiveColor != NumberPadColor.WHITE;
        }

        private boolean buttonFiveIs(NumberPadColor color) {
            return buttonFiveColor == color;
        }

        private boolean hasFewerThanTwoPorts() {
            return portCount < 2;
        }

        private boolean hasAtLeastThreeWhite() {
            return whiteCount >= 3;
        }

        private boolean hasGreenOnTopRow() {
            return greenOnTopRow;
        }
    }
}
