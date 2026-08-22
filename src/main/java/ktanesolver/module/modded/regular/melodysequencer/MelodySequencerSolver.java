package ktanesolver.module.modded.regular.melodysequencer;

import java.util.ArrayList;
import java.util.HashSet;
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
    type = ModuleType.MELODY_SEQUENCER,
    id = "melodySequencer",
    name = "Melody Sequencer",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Sort four given melody parts and record the four missing parts.",
    tags = {"music", "melody", "sequence", "piano", "sorting"}
)
public class MelodySequencerSolver extends AbstractModuleSolver<MelodySequencerInput, MelodySequencerOutput> {
    static final List<List<String>> PARTS = List.of(
        List.of("D4", "F4", "A4", "F4", "A#4", "F4", "A4", "F4"),
        List.of("D4", "F4", "A4", "C5", "D5", "A4", "D5", "C5"),
        List.of("F5", "D5", "F5", "A5", "A#5", "F5", "A#5", "A5"),
        List.of("G5", "E5", "G5", "E5", "C5", "E5", "C5", "A4"),
        List.of("G4", "E4", "G4", "E4", "A4", "E4", "A4", "F4"),
        List.of("A#4", "F4", "A#4", "G4", "C5", "G4", "C5", "A4"),
        List.of("D5", "A4", "D5", "G4", "C5", "G4", "C5", "F4"),
        List.of("A#4", "F4", "A#4", "E4", "A4", "E4", "A4", "C4")
    );

    @Override
    protected SolveResult<MelodySequencerOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, MelodySequencerInput input
    ) {
        if (input == null || input.slotParts() == null || input.slotParts().size() != 8) {
            return failure("Identify the contents of all eight slots");
        }
        List<Integer> slots = new ArrayList<>(input.slotParts());
        Set<Integer> given = new HashSet<>();
        for (Integer part : slots) {
            if (part == null) continue;
            if (part < 1 || part > 8) return failure("Part numbers must be between 1 and 8");
            if (!given.add(part)) return failure("Each given melody part must be unique");
        }
        if (given.size() != 4) return failure("Exactly four slots must contain given melody parts");

        List<MelodySequencerMove> moves = new ArrayList<>();
        for (int target = 0; target < 8; target++) {
            int current = slots.indexOf(target + 1);
            if (current < 0 || current == target) continue;
            moves.add(new MelodySequencerMove(current + 1, target + 1));
            Integer displaced = slots.get(target);
            slots.set(target, target + 1);
            slots.set(current, displaced);
        }
        List<MelodySequencerRecording> recordings = new ArrayList<>();
        for (int slot = 0; slot < 8; slot++) {
            if (slots.get(slot) == null) recordings.add(new MelodySequencerRecording(slot + 1, PARTS.get(slot)));
        }
        return success(new MelodySequencerOutput(List.copyOf(moves), List.copyOf(recordings)));
    }
}
