package ktanesolver.module.modded.regular.harmonysequence;

import java.util.ArrayList;
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
    type = ModuleType.HARMONY_SEQUENCE,
    id = "harmonySequence",
    name = "Harmony Sequence",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Sort each four-note stage from lowest pitch to highest.",
    tags = {"music", "sounds", "sequence", "stages"}
)
public class HarmonySequenceSolver extends AbstractModuleSolver<HarmonySequenceInput, HarmonySequenceOutput> {
    @Override
    protected SolveResult<HarmonySequenceOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, HarmonySequenceInput input
    ) {
        if (input == null || input.stage() == null || input.stage() < 1 || input.stage() > 4) return failure("Stage must be from 1 to 4");
        if (input.pitchRanks() == null || input.pitchRanks().size() != 4 || !Set.copyOf(input.pitchRanks()).equals(Set.of(1, 2, 3, 4))) {
            return failure("Assign the unique pitch ranks 1 (lowest) through 4 (highest) to the four buttons");
        }
        List<List<Integer>> stages = stages(module);
        if (input.stage() > stages.size() + 1) return failure("Solve the preceding stage first");
        List<Integer> pressPositions = new ArrayList<>(4);
        for (int rank = 1; rank <= 4; rank++) pressPositions.add(input.pitchRanks().indexOf(rank) + 1);
        if (input.stage() == stages.size() + 1) stages.add(pressPositions);
        else stages.set(input.stage() - 1, pressPositions);
        storeState(module, "harmonySequenceStages", stages);
        return success(new HarmonySequenceOutput(input.stage(), List.copyOf(pressPositions)), input.stage() == 4);
    }

    private static List<List<Integer>> stages(ModuleEntity module) {
        List<List<Integer>> result = new ArrayList<>();
        Object raw = module.getState().get("harmonySequenceStages");
        if (raw instanceof List<?> list) for (Object entry : list) if (entry instanceof List<?> values) result.add(values.stream().map(Number.class::cast).map(Number::intValue).toList());
        return result;
    }
}
