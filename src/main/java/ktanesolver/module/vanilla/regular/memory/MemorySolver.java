package ktanesolver.module.vanilla.regular.memory;

import java.util.ArrayList;
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
    type = ModuleType.MEMORY,
    id = "memory",
    name = "Memory",
    category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
    description = "Repeat the growing sequence of numbers",
    tags = {"display", "4-numbers", "oscilloscope", "4-buttons", "5-leds"}
)
public class MemorySolver extends AbstractModuleSolver<MemoryInput, MemoryOutput> {

    @Override
    public SolveResult<MemoryOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MemoryInput input) {
        MemoryState state = module.getStateAs(MemoryState.class, () -> new MemoryState(new ArrayList<>(), new ArrayList<>()));

        if(input.stage() != state.displayHistory().size() + 1) {
            return failure("Invalid stage order");
        }

        MemoryDecision decision = decide(input, state);

        List<Integer> newDisplayHistory = new ArrayList<>(state.displayHistory());
        newDisplayHistory.add(input.display());

        List<MemoryStep> newHistory = new ArrayList<>(state.solutionHistory());
        newHistory.add(new MemoryStep(decision.position(), decision.label()));

        MemoryState newState = new MemoryState(newDisplayHistory, newHistory);
        module.setState(newState);

        // Only mark as solved on stage 5
        boolean isSolved = input.stage() == 5;
        MemoryOutput output = new MemoryOutput(decision.position(), decision.label());
        
        return success(output, isSolved);
    }

    private MemoryDecision decide(MemoryInput input, MemoryState state) {
        return switch(input.stage()) {
            case 1 -> stage1(input);
            case 2 -> stage2(input, state);
            case 3 -> stage3(input, state);
            case 4 -> stage4(input, state);
            case 5 -> stage5(input, state);
            default -> throw new IllegalStateException();
        };
    }

    private MemoryDecision stage1(MemoryInput input) {
        return switch(input.display()) {
            case 1, 2 -> pressPosition(input, 2);
            case 3 -> pressPosition(input, 3);
            case 4 -> pressPosition(input, 4);
            default -> throw new IllegalArgumentException();
        };
    }

    private MemoryDecision stage2(MemoryInput input, MemoryState state) {
        return switch(input.display()) {
            case 1 -> pressLabel(input, 4);
            case 2, 4 -> pressPosition(input, state.solutionHistory().getFirst().position());
            case 3 -> pressPosition(input, 1);
            default -> throw new IllegalArgumentException();
        };
    }

    private MemoryDecision stage3(MemoryInput input, MemoryState state) {
        return switch(input.display()) {
            case 1 -> pressLabel(input, state.solutionHistory().get(1).label());
            case 2 -> pressLabel(input, state.solutionHistory().get(0).label());
            case 3 -> pressPosition(input, 3);
            case 4 -> pressLabel(input, 4);
            default -> throw new IllegalArgumentException();
        };
    }

    private MemoryDecision stage4(MemoryInput input, MemoryState state) {
        return switch(input.display()) {
            case 1 -> pressPosition(input, state.solutionHistory().get(0).position());
            case 2 -> pressPosition(input, 1);
            case 3, 4 -> pressPosition(input, state.solutionHistory().get(1).position());
            default -> throw new IllegalArgumentException();
        };
    }

    private MemoryDecision stage5(MemoryInput input, MemoryState state) {
        return switch(input.display()) {
            case 1 -> pressLabel(input, state.solutionHistory().get(0).label());
            case 2 -> pressLabel(input, state.solutionHistory().get(1).label());
            case 3 -> pressLabel(input, state.solutionHistory().get(3).label());
            case 4 -> pressLabel(input, state.solutionHistory().get(2).label());
            default -> throw new IllegalArgumentException();
        };
    }

    private MemoryDecision pressPosition(MemoryInput input, int position) {
        int label = input.labels().get(position - 1);
        return new MemoryDecision(position, label);
    }

    private MemoryDecision pressLabel(MemoryInput input, int label) {
        int index = input.labels().indexOf(label);
        return new MemoryDecision(index + 1, label);
    }

    private record MemoryDecision(int position, int label) {
    }
}
