package ktanesolver.module.vanilla.regular.wires;

import com.fasterxml.jackson.core.type.TypeReference;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class WiresSolver implements ModuleSolver<WiresInput, WiresOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.WIRES;
    }

    @Override
    public Class<WiresInput> inputType() {
        return WiresInput.class;
    }

    @Override
    public SolveResult<WiresOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, WiresInput input) {
        List<WireColor> wires = input.wires();

        if (wires.size() < 3 || wires.size() > 6) {
            return new SolveFailure<>("Invalid number of wires");
        }

        WireCutResult result = determineCut(wires, bomb);

        SolveSuccess<WiresOutput> wiresOutputSolveSuccess = new SolveSuccess<>(new WiresOutput(result.position(), result.instruction()), true);
        Map<String, Object> convertedValue = Json.mapper().convertValue(wiresOutputSolveSuccess.output(), new TypeReference<>() {
        });
        convertedValue.forEach(module.getSolution()::put);
        module.getState().put("wires", wires);
        module.setSolved(true);
        return wiresOutputSolveSuccess;
    }

    private record WireCutResult(int position, String instruction) {
    }

    private WireCutResult determineCut(List<WireColor> wires, BombEntity bomb) {
        int wireCount = wires.size();
        long redCount = wires.stream().filter(w -> w == WireColor.RED).count();
        long blueCount = wires.stream().filter(w -> w == WireColor.BLUE).count();
        long yellowCount = wires.stream().filter(w -> w == WireColor.YELLOW).count();
        long blackCount = wires.stream().filter(w -> w == WireColor.BLACK).count();

        boolean serialOdd = isSerialOdd(bomb);

        return switch (wireCount) {
            case 3 -> {
                if (redCount == 0) yield new WireCutResult(1, "Cut the second wire");
                if (wires.get(2) == WireColor.WHITE) yield new WireCutResult(2, "Cut the last wire");
                if (blueCount > 1) {
                    int lastBluePos = findLastWireOfColor(wires, WireColor.BLUE);
                    yield new WireCutResult(lastBluePos, "Cut the last blue wire");
                }
                yield new WireCutResult(2, "Cut the last wire");
            }
            case 4 -> {
                if (redCount > 1 && serialOdd) {
                    int lastRedPos = findLastWireOfColor(wires, WireColor.RED);
                    yield new WireCutResult(lastRedPos, "Cut the last red wire");
                }
                if (wires.get(3) == WireColor.YELLOW && redCount == 0) yield new WireCutResult(0, "Cut the first wire");
                if (blueCount == 1) yield new WireCutResult(0, "Cut the first wire");
                if (yellowCount > 1) yield new WireCutResult(3, "Cut the last wire");
                yield new WireCutResult(1, "Cut the second wire");
            }
            case 5 -> {
                if (wires.get(4) == WireColor.BLACK && serialOdd) yield new WireCutResult(3, "Cut the fourth wire");
                if (redCount == 1 && yellowCount > 1) yield new WireCutResult(0, "Cut the first wire");
                if (blackCount == 0) yield new WireCutResult(1, "Cut the second wire");
                yield new WireCutResult(0, "Cut the first wire");
            }
            case 6 -> {
                if (yellowCount == 0 && serialOdd) yield new WireCutResult(2, "Cut the third wire");
                if (yellowCount == 1 && whiteCount(wires) > 1) yield new WireCutResult(3, "Cut the fourth wire");
                if (redCount == 0) yield new WireCutResult(5, "Cut the last wire");
                yield new WireCutResult(3, "Cut the fourth wire");
            }
            default -> throw new IllegalStateException();
        };
    }


    private boolean isSerialOdd(BombEntity bomb) {
        return bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').reduce((a, b) -> b)   // last digit
                .orElse(0) % 2 == 1;
    }


    private int findLastWireOfColor(List<WireColor> wires, WireColor color) {
        for (int i = wires.size() - 1; i >= 0; i--) {
            if (wires.get(i) == color) {
                return i;
            }
        }
        return -1; // Should not happen as we check counts before calling this
    }

    private long whiteCount(List<WireColor> wires) {
        return wires.stream().filter(w -> w == WireColor.WHITE).count();
    }
}
