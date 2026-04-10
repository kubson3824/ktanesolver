package ktanesolver.dto;

import java.time.Instant;
import java.util.UUID;

import ktanesolver.enums.RoundStatus;

public record RoundSummaryDto(
        UUID id,
        RoundStatus status,
        Instant startTime,
        long version,
        long bombCount,
        long moduleCount
) {
}
