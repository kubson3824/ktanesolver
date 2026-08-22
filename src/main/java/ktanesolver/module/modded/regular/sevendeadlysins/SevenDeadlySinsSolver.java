package ktanesolver.module.modded.regular.sevendeadlysins;

import java.util.ArrayList;
import java.util.HashSet;
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
import ktanesolver.module.modded.regular.sevendeadlysins.SevenDeadlySinsInput.Sin;

@Service
@ModuleInfo(
    type = ModuleType.SEVEN_DEADLY_SINS,
    id = "sevenDeadlySins",
    name = "Seven Deadly Sins",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Find an adjacent press order through all seven sins that follows the directed diagram.",
    tags = {"sins", "graph", "adjacency", "sequence"}
)
public class SevenDeadlySinsSolver extends AbstractModuleSolver<SevenDeadlySinsInput, SevenDeadlySinsOutput> {
    private static final int[][] EDGES = {
        {1, 2, 4}, {2, 3, 5}, {3, 4, 6}, {0, 4, 5}, {1, 5, 6}, {0, 2, 6}, {0, 1, 3}
    };

    @Override
    protected SolveResult<SevenDeadlySinsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SevenDeadlySinsInput input
    ) {
        if (input == null || input.sins() == null || input.sins().size() != 7
            || input.sins().stream().anyMatch(sin -> sin == null)
            || new HashSet<>(input.sins()).size() != 7) {
            return failure("Enter each of the seven sins exactly once in clockwise order");
        }

        List<Integer> positions = new ArrayList<>();
        if (!findPath(input.sins(), positions, 0)) return failure("No valid press order exists for this layout");
        List<Sin> sequence = positions.stream().map(position -> input.sins().get(position)).toList();
        List<Integer> oneBased = positions.stream().map(position -> position + 1).toList();
        String command = "press " + String.join(" ", oneBased.stream().map(String::valueOf).toList());
        return success(new SevenDeadlySinsOutput(sequence, oneBased, command));
    }

    private static boolean findPath(List<Sin> sins, List<Integer> path, int used) {
        if (path.size() == 7) return true;
        for (int position = 0; position < 7; position++) {
            int bit = 1 << position;
            if ((used & bit) != 0 || !canPress(sins, path, used, position)) continue;
            path.add(position);
            if (findPath(sins, path, used | bit)) return true;
            path.removeLast();
        }
        return false;
    }

    private static boolean canPress(List<Sin> sins, List<Integer> path, int used, int position) {
        if (path.isEmpty()) return true;
        boolean adjacent = (used & (1 << ((position + 6) % 7))) != 0
            || (used & (1 << ((position + 1) % 7))) != 0;
        if (!adjacent) return false;
        int previous = sins.get(path.getLast()).ordinal();
        int next = sins.get(position).ordinal();
        for (int target : EDGES[previous]) if (target == next) return true;
        return false;
    }
}
