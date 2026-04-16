package ktanesolver.module.modded.regular.probing;

import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

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
    type = ModuleType.PROBING,
    id = "probing",
    name = "Probing",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Use the six wires' missing frequencies to determine where to place the red and blue clips.",
    tags = {"modded", "wires", "frequencies", "logic"}
)
public class ProbingSolver extends AbstractModuleSolver<ProbingInput, ProbingOutput> {

    private static final int WIRE_COUNT = 6;
    private static final int WIRE_ONE_INDEX = 0;
    private static final int WIRE_FIVE_INDEX = 4;

    private static final int TEN_HZ = 10;
    private static final int TWENTY_TWO_HZ = 22;
    private static final int FIFTY_HZ = 50;
    private static final int SIXTY_HZ = 60;

    private static final Set<Integer> ALLOWED_FREQUENCIES = Set.of(TEN_HZ, TWENTY_TWO_HZ, FIFTY_HZ, SIXTY_HZ);

    @Override
    protected SolveResult<ProbingOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ProbingInput input) {
        List<Integer> missingFrequenciesByWire = input.missingFrequenciesByWire();
        if (missingFrequenciesByWire == null || missingFrequenciesByWire.size() != WIRE_COUNT) {
            return failure("Probing requires exactly 6 missing frequencies in reading order");
        }
        if (missingFrequenciesByWire.stream().anyMatch(frequency -> frequency == null || !ALLOWED_FREQUENCIES.contains(frequency))) {
            return failure("Probing missing frequencies must be one of 10, 22, 50, or 60");
        }

        storeState(module, "missingFrequenciesByWire", missingFrequenciesByWire);

        int wireOneMissingFrequency = missingFrequenciesByWire.get(WIRE_ONE_INDEX);
        int wireFiveMissingFrequency = missingFrequenciesByWire.get(WIRE_FIVE_INDEX);
        int redTargetFrequency = determineRedTargetFrequency(wireOneMissingFrequency, wireFiveMissingFrequency);
        int blueTargetFrequency = determineBlueTargetFrequency(wireFiveMissingFrequency);

        List<Integer> redClipCandidates = findCandidateWires(missingFrequenciesByWire, redTargetFrequency);
        if (redClipCandidates.isEmpty()) {
            return failure("No wire is missing " + redTargetFrequency + "Hz, so the red clip cannot be placed");
        }

        List<Integer> blueClipCandidates = findCandidateWires(missingFrequenciesByWire, blueTargetFrequency);
        if (blueClipCandidates.isEmpty()) {
            return failure("No wire is missing " + blueTargetFrequency + "Hz, so the blue clip cannot be placed");
        }

        // When multiple wires share the same missing frequency, use the first one in reading order.
        int redClipWire = redClipCandidates.get(0);
        Integer blueClipWire = blueClipCandidates.stream()
            .filter(candidate -> candidate != redClipWire)
            .findFirst()
            .orElse(null);
        if (blueClipWire == null) {
            return failure("Probing requires two different wires for the red and blue clips");
        }

        return success(new ProbingOutput(
            redClipWire,
            blueClipWire,
            List.copyOf(redClipCandidates),
            List.copyOf(blueClipCandidates),
            redTargetFrequency,
            blueTargetFrequency,
            "Connect the red clip to wire " + redClipWire + " and the blue clip to wire " + blueClipWire + ". Leave both connected for at least 6 seconds."
        ));
    }

    private static int determineRedTargetFrequency(int wireOneMissingFrequency, int wireFiveMissingFrequency) {
        if (wireOneMissingFrequency == TEN_HZ || wireOneMissingFrequency == TWENTY_TWO_HZ || wireOneMissingFrequency == SIXTY_HZ) {
            return FIFTY_HZ;
        }
        if (wireFiveMissingFrequency == TEN_HZ) {
            return TEN_HZ;
        }
        return SIXTY_HZ;
    }

    private static int determineBlueTargetFrequency(int wireFiveMissingFrequency) {
        if (wireFiveMissingFrequency == TWENTY_TWO_HZ || wireFiveMissingFrequency == FIFTY_HZ || wireFiveMissingFrequency == SIXTY_HZ) {
            return TWENTY_TWO_HZ;
        }
        return SIXTY_HZ;
    }

    private static List<Integer> findCandidateWires(List<Integer> missingFrequenciesByWire, int targetFrequency) {
        return IntStream.range(0, missingFrequenciesByWire.size())
            .filter(index -> missingFrequenciesByWire.get(index) == targetFrequency)
            .map(index -> index + 1)
            .boxed()
            .toList();
    }
}
