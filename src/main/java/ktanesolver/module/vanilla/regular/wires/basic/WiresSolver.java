package ktanesolver.module.vanilla.regular.wires.basic;

import java.util.List;

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
    type = ModuleType.WIRES,
    id = "wires",
    name = "Wires",
    category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
    description = "Cut the correct wires based on the rules",
    tags = {"horizontal-wires", "red", "blue", "black", "white", "yellow"}
)
public class WiresSolver extends AbstractModuleSolver<WiresInput, WiresOutput> {

    @Override
    public SolveResult<WiresOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, WiresInput input) {
        List<WireColor> wires = input.wires();

        if(wires.size() < 3 || wires.size() > 6) {
            return failure("Invalid number of wires");
        }

        WireCutResult result = determineCut(wires, bomb);
        storeState(module, "wires", wires);

        return success(new WiresOutput(result.position(), result.instruction()));
    }

    private WireCutResult determineCut(List<WireColor> wires, BombEntity bomb) {
        int wireCount = wires.size();
        long redCount = wires.stream().filter(w -> w == WireColor.RED).count();
        long blueCount = wires.stream().filter(w -> w == WireColor.BLUE).count();
        long yellowCount = wires.stream().filter(w -> w == WireColor.YELLOW).count();
        long blackCount = wires.stream().filter(w -> w == WireColor.BLACK).count();

        boolean serialOdd = bomb.isLastDigitOdd();

        return switch(wireCount) {
            case 3 -> {
                if(redCount == 0)
                    yield new WireCutResult(1, "Cut the second wire");
                if(wires.get(2) == WireColor.WHITE)
                    yield new WireCutResult(2, "Cut the last wire");
                if(blueCount > 1) {
                    int lastBluePos = findLastWireOfColor(wires, WireColor.BLUE);
                    yield new WireCutResult(lastBluePos, "Cut the last blue wire");
                }
                yield new WireCutResult(2, "Cut the last wire");
            }
            case 4 -> {
                if(redCount > 1 && serialOdd) {
                    int lastRedPos = findLastWireOfColor(wires, WireColor.RED);
                    yield new WireCutResult(lastRedPos, "Cut the last red wire");
                }
                if(wires.get(3) == WireColor.YELLOW && redCount == 0)
                    yield new WireCutResult(0, "Cut the first wire");
                if(blueCount == 1)
                    yield new WireCutResult(0, "Cut the first wire");
                if(yellowCount > 1)
                    yield new WireCutResult(3, "Cut the last wire");
                yield new WireCutResult(1, "Cut the second wire");
            }
            case 5 -> {
                if(wires.get(4) == WireColor.BLACK && serialOdd)
                    yield new WireCutResult(3, "Cut the fourth wire");
                if(redCount == 1 && yellowCount > 1)
                    yield new WireCutResult(0, "Cut the first wire");
                if(blackCount == 0)
                    yield new WireCutResult(1, "Cut the second wire");
                yield new WireCutResult(0, "Cut the first wire");
            }
            case 6 -> {
                if(yellowCount == 0 && serialOdd)
                    yield new WireCutResult(2, "Cut the third wire");
                if(yellowCount == 1 && whiteCount(wires) > 1)
                    yield new WireCutResult(3, "Cut the fourth wire");
                if(redCount == 0)
                    yield new WireCutResult(5, "Cut the last wire");
                yield new WireCutResult(3, "Cut the fourth wire");
            }
            default -> throw new IllegalStateException();
        };
    }

    private int findLastWireOfColor(List<WireColor> wires, WireColor color) {
        for(int i = wires.size() - 1; i >= 0; i--) {
            if(wires.get(i) == color) {
                return i;
            }
        }
        return -1;
    }

    private long whiteCount(List<WireColor> wires) {
        return wires.stream().filter(w -> w == WireColor.WHITE).count();
    }

    private record WireCutResult(int position, String instruction) {
    }
}
