package ktanesolver.module.modded.regular.dominoes;

import java.util.*;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;

@Service
@ModuleInfo(type = ModuleType.DOMINOES, id = "dominoes", name = "Dominoes",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Evaluate the four starting dominoes using bomb edgework and order them.",
    tags = {"edgework", "arithmetic", "ordering"})
public class DominoesSolver extends AbstractModuleSolver<DominoesInput, DominoesOutput> {
    @Override protected SolveResult<DominoesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, DominoesInput input) {
        if (input == null || input.dominoes() == null || input.dominoes().size() != 4) return failure("Enter four top/bottom domino pairs");
        for (List<Integer> pair : input.dominoes()) if (pair == null || pair.size() != 2 || pair.stream().anyMatch(v -> v == null || v < 1 || v > 6)) return failure("Every domino value must be from 1 through 6");
        int ports = bomb.getPortPlates().stream().mapToInt(p -> p.getPorts().size()).sum();
        int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int unlit = (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
        String operation = ports >= 3 ? "add" : bomb.getBatteryCount() >= 3 ? "subtract" : lit > 0 ? "multiply" : "divide";
        List<Integer> values = input.dominoes().stream().map(pair -> switch(operation) {
            case "add" -> pair.get(0) + pair.get(1); case "subtract" -> pair.get(0) - pair.get(1);
            case "multiply" -> pair.get(0) * pair.get(1); default -> pair.get(1) % pair.get(0) == 0 ? pair.get(1) / pair.get(0) : 1;
        }).toList();
        String serial = bomb.getSerialNumber(); if (serial == null || serial.length() < 3) return failure("The bomb serial number must contain at least three characters");
        boolean ascending = lit > unlit || lit == unlit && serial.charAt(2) % 2 != 0;
        List<Integer> order = new ArrayList<>(List.of(1,2,3,4));
        order.sort((a,b) -> { int cmp = Integer.compare(values.get(a-1), values.get(b-1)); return ascending ? cmp : -cmp; });
        return success(new DominoesOutput(operation, values, List.copyOf(order)));
    }
}
